"""
Prediction tools for the chat system.

These tools handle making predictions and validating features.
"""

import logging
from typing import Dict, List
from smolagents import tool

from ..services.predictor import prediction_service
from ..services.registry import model_registry

logger = logging.getLogger(__name__)


@tool
def make_prediction(model_id: str, features: dict) -> dict:
    """
    Make a prediction using a specified model.

    Args:
        model_id: ID of the model to use for prediction
        features: Input features as key-value pairs

    Returns:
        Prediction result with confidence information
    """
    try:
        result = prediction_service.predict(model_id, features)

        return {
            "prediction": result.prediction,
            "probability": result.probability,
            "confidence": result.confidence,
            "model_id": result.model_id,
            "status": "success",
        }
    except Exception as e:
        logger.error(f"Prediction failed for model {model_id}: {str(e)}")
        return {
            "status": "error",
            "message": f"Prediction failed: {str(e)}",
            "model_id": model_id,
        }


@tool
def validate_features(model_id: str, features: dict) -> dict:
    """
    Validate input features for a model without making a prediction.

    Args:
        model_id: ID of the model to validate features for
        features: Input features to validate

    Returns:
        Validation result with any errors or warnings
    """
    try:
        model = model_registry.get_model(model_id)

        # Validation logic
        missing_features = []
        if model.feature_names:
            missing_features = [f for f in model.feature_names if f not in features]

        extra_features = []
        if model.feature_names:
            extra_features = [
                f for f in features.keys() if f not in model.feature_names
            ]

        is_valid = len(missing_features) == 0

        return {
            "valid": is_valid,
            "missing_features": missing_features,
            "extra_features": extra_features,
            "message": (
                "Features are valid"
                if is_valid
                else f"Missing required features: {missing_features}"
            ),
            "model_id": model_id,
        }
    except Exception as e:
        logger.error(f"Feature validation failed for model {model_id}: {str(e)}")
        return {
            "valid": False,
            "message": f"Validation failed: {str(e)}",
            "model_id": model_id,
        }


@tool
def make_batch_prediction(model_id: str, features_list: List[Dict]) -> dict:
    """
    Make batch predictions using a specified model.

    Args:
        model_id: ID of the model to use for prediction
        features_list: List of feature dictionaries for batch prediction

    Returns:
        Batch prediction results
    """
    try:
        result = prediction_service.predict_batch(model_id, features_list)

        return {
            "predictions": [
                {
                    "prediction": pred.prediction,
                    "probability": pred.probability,
                    "confidence": pred.confidence,
                }
                for pred in result.predictions
            ],
            "model_id": result.model_id,
            "batch_size": len(result.predictions),
            "status": "success",
        }
    except Exception as e:
        logger.error(f"Batch prediction failed for model {model_id}: {str(e)}")
        return {
            "status": "error",
            "message": f"Batch prediction failed: {str(e)}",
            "model_id": model_id,
        }


@tool
def predict_with_model_name(model_name: str, features: dict) -> dict:
    """
    Make a prediction using a model name instead of model ID.
    Uses the latest version of the model by default.

    Args:
        model_name: Name of the model to use for prediction (e.g., "sentiment_analysis_model")
        features: Input features as key-value pairs

    Returns:
        Prediction result with confidence information
    """
    try:
        # First try to find the latest version by exact name match
        latest_model = model_registry.get_latest_model_by_name(model_name)

        if not latest_model:
            # Try exact match from all models (including older versions)
            models = model_registry.get_latest_models()  # Only latest versions
            for model in models:
                if model.name.lower() == model_name.lower():
                    latest_model = model
                    break

        if not latest_model:
            # Try partial match from latest models only
            models = model_registry.get_latest_models()
            for model in models:
                if (
                    model_name.lower() in model.name.lower()
                    or model.name.lower() in model_name.lower()
                ):
                    latest_model = model
                    break

        if not latest_model:
            available_models = [m.name for m in model_registry.get_latest_models()]
            return {
                "status": "error",
                "message": f"No model found with name '{model_name}'. Available models: {available_models}",
                "model_name": model_name,
            }

        # Make the prediction using the found model ID
        result = prediction_service.predict(latest_model.id, features)

        return {
            "prediction": result.prediction,
            "probability": result.probability,
            "confidence": result.confidence,
            "model_id": result.model_id,
            "model_name": model_name,
            "model_version": latest_model.version,
            "status": "success",
        }
    except Exception as e:
        logger.error(f"Prediction failed for model {model_name}: {str(e)}")
        return {
            "status": "error",
            "message": f"Prediction failed: {str(e)}",
            "model_name": model_name,
        }
