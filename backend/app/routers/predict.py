from fastapi import APIRouter, HTTPException, Path
from typing import Dict, Any

from ..schemas.prediction import (
    PredictionRequest, 
    PredictionResponse, 
    PredictionBatchRequest, 
    PredictionBatchResponse
)
from ..services.predictor import prediction_service
from ..services.registry import model_registry


router = APIRouter(tags=["predictions"])


@router.post("/models/{model_id}/predict", response_model=PredictionResponse)
async def predict(
    model_id: str,
    request: PredictionRequest
):
    """Make a prediction using the specified model."""
    
    input_features = request.features
    
    try:
        result = prediction_service.predict(model_id, input_features)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/models/{model_id}/predict/batch", response_model=PredictionBatchResponse)
async def predict_batch(
    model_id: str,
    request: PredictionBatchRequest
):
    """Make batch predictions using the specified model."""
    try:
        result = prediction_service.predict_batch(model_id, request.features)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


 