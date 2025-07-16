"""
System tools for the chat system.

These tools handle system status, health checks, and help information.
"""

import logging
from datetime import datetime
from smolagents import tool

logger = logging.getLogger(__name__)


@tool
def get_system_status() -> dict:
    """
    Get current system health and status information.
    
    Returns:
        System status information including model count, memory usage, etc.
    """
    try:
        from ..services.registry import model_registry
        
        models = model_registry.get_all_models()
        active_models = [m for m in models if m.status.value == "active"]
        
        return {
            "status": "healthy",
            "total_models": len(models),
            "active_models": len(active_models),
            "timestamp": datetime.now().isoformat(),
            "service": "ML Model Chat Service",
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Failed to get system status: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to get status: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }


@tool
def get_available_commands() -> dict:
    """
    Get a list of available commands and their descriptions.
    
    Returns:
        Dictionary of available commands with descriptions and usage examples
    """
    return {
        "list_models": "List all available models with optional status filtering. Usage: 'show me all models' or 'list active models'",
        "get_model_info": "Get detailed information about a specific model. Usage: 'tell me about model [model_id]'",
        "delete_model": "Delete a model from the system. Usage: 'delete model [model_id]'",
        "make_prediction": "Make a prediction using a specified model. Usage: 'predict with [model_id] using {feature1: value1, feature2: value2}'",
        "validate_features": "Validate input features for a model. Usage: 'validate features {feature1: value1} for model [model_id]'",
        "make_batch_prediction": "Make predictions for multiple inputs. Usage: 'batch predict with [model_id] using [feature_list]'",
        "get_system_status": "Get current system health information. Usage: 'system status' or 'health check'",
        "get_upload_guidance": "Get information about how to upload model files. Usage: 'how do I upload a model?'",
        "validate_file_for_upload": "Validate a file before upload. Usage: 'validate file [filename] with size [bytes]'"
    }


@tool
def get_usage_examples() -> dict:
    """
    Get examples of how to use the chat system effectively.
    
    Returns:
        Dictionary with usage examples for common tasks
    """
    return {
        "list_models": "Show me all available models",
        "model_info": "Tell me about the customer_churn model",
        "prediction": "Make a prediction using customer_churn with {tenure: 24, monthly_charges: 70, total_charges: 1680}",
        "validation": "Validate these features for the price_prediction model: {quality_score: 8, brand_value: 5}",
        "system_check": "What's the system status?",
        "help": "What commands are available?",
        "upload": "How do I upload a new model?",
        "delete": "Delete the old_model"
    } 