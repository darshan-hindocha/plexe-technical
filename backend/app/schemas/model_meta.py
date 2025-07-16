from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class ModelType(str, Enum):
    CLASSIFIER = "classifier"
    REGRESSOR = "regressor"


class ModelStatus(str, Enum):
    UPLOADED = "uploaded"
    DEPLOYED = "deployed"
    ERROR = "error"


class ModelMetaBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    name: str = Field(..., description="Model name")
    description: Optional[str] = Field(None, description="Model description")
    model_type: Optional[ModelType] = Field(None, description="Type of model")


class ModelMetaCreate(ModelMetaBase):
    # Versioning fields for upload
    is_new_version: bool = Field(False, description="Whether this is a new version of an existing model")
    parent_model_id: Optional[str] = Field(None, description="ID of the parent model for versioning")


class ModelMetaUpdate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ModelStatus] = None


class ModelMeta(ModelMetaBase):
    model_config = ConfigDict(protected_namespaces=(), from_attributes=True)
    
    id: str = Field(..., description="Unique model identifier")
    status: ModelStatus = Field(default=ModelStatus.UPLOADED)
    file_path: Optional[str] = Field(None, description="Path to model file")
    feature_names: Optional[List[str]] = Field(None, description="Expected input features")
    model_info: Optional[Dict[str, Any]] = Field(None, description="Additional model information")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Versioning fields
    version: int = Field(1, description="Model version number")
    parent_model_id: Optional[str] = Field(None, description="ID of the parent model for versioning")
    is_latest: bool = Field(True, description="Whether this is the latest version of the model")


class ModelListResponse(BaseModel):
    models: List[ModelMeta] = Field(..., description="List of models")
    total: int = Field(..., description="Total number of models") 