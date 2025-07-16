from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, Any, List, Union, Optional


class PredictionRequest(BaseModel):
    features: Dict[str, Any] = Field(..., description="Input features for prediction")


class PredictionBatchRequest(BaseModel):
    features: List[Dict[str, Any]] = Field(..., description="Batch of input features")


class PredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    prediction: Union[float, int, str] = Field(..., description="Model prediction")
    probability: Optional[float] = Field(None, description="Prediction probability (for classifiers)")
    confidence: Optional[str] = Field(None, description="Confidence level description")
    model_id: str = Field(..., description="ID of model used for prediction")


class PredictionBatchResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    predictions: List[PredictionResponse] = Field(..., description="Batch predictions")
    model_id: str = Field(..., description="ID of model used for predictions")


class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: Optional[str] = Field(None, description="Message timestamp")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User message")
    context: Optional[List[ChatMessage]] = Field(None, description="Previous chat context")


class ChatResponse(BaseModel):
    response: str = Field(..., description="Assistant response")
    action: Optional[str] = Field(None, description="Action type: 'upload', 'deploy', 'predict', 'info'")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional response data") 