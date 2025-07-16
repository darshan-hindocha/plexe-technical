from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from typing import List, Optional

from ..schemas.model_meta import ModelMeta, ModelMetaCreate, ModelListResponse

from ..services.registry import model_registry
from ..core.deps import get_settings
from ..core.config import Settings
import joblib
import tempfile
import os


router = APIRouter(prefix="/models", tags=["models"])


@router.post("/preview", response_model=dict)
async def preview_model(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings)
):
    """Preview model metadata before upload."""
    
    # Validate file extension
    if not any(file.filename.endswith(ext) for ext in settings.allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed extensions: {settings.allowed_extensions}"
        )
    
    # Validate file size
    content = await file.read()
    if len(content) > settings.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_file_size} bytes"
        )
    
    try:
        # Save to temporary file for inspection
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Load and inspect the model
            loaded_model = joblib.load(temp_file_path)
            
            # Extract model information
            model_info = {
                "filename": file.filename,
                "file_size": len(content),
                "model_class": type(loaded_model).__name__,
                "has_predict_proba": hasattr(loaded_model, 'predict_proba'),
                "n_features": getattr(loaded_model, 'n_features_in_', None)
            }
            
            # Determine model type
            if hasattr(loaded_model, 'predict_proba'):
                model_info["model_type"] = "classifier"
            else:
                model_info["model_type"] = "regressor"
            
            # Extract feature names if available
            feature_names = None
            if hasattr(loaded_model, 'feature_names_in_'):
                feature_names = loaded_model.feature_names_in_.tolist()
            elif hasattr(loaded_model, 'get_booster'):
                # XGBoost specific
                try:
                    booster = loaded_model.get_booster()
                    feature_names = booster.feature_names
                except:
                    pass
            
            model_info["feature_names"] = feature_names
            
            # Get available models for versioning
            available_models = model_registry.get_latest_models()
            available_models_info = [
                {
                    "id": m.id,
                    "name": m.name,
                    "version": m.version,
                    "model_type": m.model_type.value if m.model_type else "unknown"
                }
                for m in available_models
            ]
            
            return {
                "model_info": model_info,
                "available_models": available_models_info,
                "suggested_name": file.filename.rsplit('.', 1)[0]
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to preview model: {str(e)}")


@router.post("/upload", response_model=ModelMeta)
async def upload_model(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    is_new_version: bool = Form(False),
    parent_model_id: Optional[str] = Form(None),
    settings: Settings = Depends(get_settings)
):
    """Upload and deploy an XGBoost model with versioning support."""
    
    # Validate file extension
    if not any(file.filename.endswith(ext) for ext in settings.allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed extensions: {settings.allowed_extensions}"
        )
    
    # Validate file size
    content = await file.read()
    if len(content) > settings.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_file_size} bytes"
        )
    
    try:
        # Create metadata
        metadata = ModelMetaCreate(
            name=name,
            description=description,
            is_new_version=is_new_version,
            parent_model_id=parent_model_id
        )
        
        # Save model
        model_id = model_registry.save_model(content, file.filename, metadata)
        
        # Return saved model metadata
        saved_model = model_registry.get_model(model_id)
        return saved_model
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save model: {str(e)}")


@router.get("", response_model=ModelListResponse)
async def list_models(latest_only: bool = False):
    """Get all uploaded models or only latest versions."""
    if latest_only:
        models = model_registry.get_latest_models()
    else:
        models = model_registry.get_all_models()
    return ModelListResponse(models=models, total=len(models))


@router.get("/{model_id}", response_model=ModelMeta)
async def get_model(model_id: str):
    """Get specific model by ID."""
    model = model_registry.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@router.delete("/{model_id}")
async def delete_model(model_id: str):
    """Delete a model."""
    success = model_registry.delete_model(model_id)
    if not success:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"message": "Model deleted successfully"}


 