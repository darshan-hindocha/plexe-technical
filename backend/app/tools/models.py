"""
Model management tools for the chat system.

These tools handle listing, getting info about, and deleting ML models.
"""

import logging
from smolagents import tool

from ..services.registry import model_registry

logger = logging.getLogger(__name__)


@tool
def list_models(status_filter: str = "all", latest_only: bool = True) -> list:
    """
    List available ML models with versioning support.

    Args:
        status_filter: Filter models by status ("deployed", "uploaded", "error", "all")
        latest_only: If True, only show latest versions of each model

    Returns:
        List of model information dictionaries
    """
    try:
        if latest_only:
            models = model_registry.get_latest_models()
        else:
            models = model_registry.get_all_models()

        if status_filter != "all":
            models = [m for m in models if m.status.value == status_filter]

        return [
            {
                "id": m.id,
                "name": m.name,
                "status": m.status.value,
                "model_type": m.model_type.value if m.model_type else "unknown",
                "feature_names": m.feature_names,
                "version": m.version,
                "is_latest": m.is_latest,
                "created_at": (
                    m.created_at.isoformat() if hasattr(m, "created_at") else None
                ),
            }
            for m in models
        ]
    except Exception as e:
        logger.error(f"Failed to list models: {str(e)}")
        return []


@tool
def get_model_info(model_id: str) -> dict:
    """
    Get detailed information about a specific model.

    Args:
        model_id: ID of the model to get information for

    Returns:
        Detailed model information dictionary
    """
    try:
        model = model_registry.get_model(model_id)
        if not model:
            return {"error": f"Model not found: {model_id}"}

        # Get version information
        model_family = model_registry._get_model_family(model_id)
        version_info = {
            "total_versions": len(model_family),
            "other_versions": [
                {
                    "id": m.id,
                    "version": m.version,
                    "created_at": (
                        m.created_at.isoformat() if hasattr(m, "created_at") else None
                    ),
                    "is_latest": m.is_latest,
                }
                for m in model_family
                if m.id != model_id
            ],
        }

        return {
            "id": model.id,
            "name": model.name,
            "status": model.status.value,
            "model_type": model.model_type.value if model.model_type else "unknown",
            "feature_names": model.feature_names,
            "description": getattr(model, "description", None),
            "version": model.version,
            "is_latest": model.is_latest,
            "parent_model_id": model.parent_model_id,
            "created_at": (
                model.created_at.isoformat() if hasattr(model, "created_at") else None
            ),
            "file_size": getattr(model, "file_size", None),
            "version_info": version_info,
        }
    except Exception as e:
        logger.error(f"Failed to get model info for {model_id}: {str(e)}")
        return {"error": f"Failed to get model info: {str(e)}"}


@tool
def delete_model(model_id: str) -> dict:
    """
    Delete a model from the registry.

    Args:
        model_id: ID of the model to delete

    Returns:
        Result of the deletion operation
    """
    try:
        model = model_registry.get_model(model_id)
        if not model:
            return {"status": "error", "message": f"Model not found: {model_id}"}

        model_name = model.name
        model_version = model.version
        is_latest = model.is_latest

        # If this is the latest version, we need to promote another version
        if is_latest:
            model_family = model_registry._get_model_family(model_id)
            other_versions = [m for m in model_family if m.id != model_id]

            if other_versions:
                # Promote the highest version to latest
                next_latest = max(other_versions, key=lambda m: m.version)
                next_latest.is_latest = True
                model_registry.models[next_latest.id] = next_latest

        # Delete from registry (this should handle file cleanup too)
        success = model_registry.delete_model(model_id)

        if success:
            # Save registry to persist the latest flag changes
            model_registry._save_registry()

            return {
                "status": "success",
                "message": f"Successfully deleted model '{model_name}' v{model_version} (ID: {model_id})",
            }
        else:
            return {"status": "error", "message": f"Failed to delete model: {model_id}"}

    except Exception as e:
        logger.error(f"Failed to delete model {model_id}: {str(e)}")
        return {"status": "error", "message": f"Failed to delete model: {str(e)}"}


@tool
def find_model_by_name(model_name: str, latest_only: bool = True) -> dict:
    """
    Find a model ID by its name with versioning support.

    Args:
        model_name: Name of the model to find
        latest_only: If True, only search latest versions

    Returns:
        Model information with ID if found, error if not found
    """
    try:
        if latest_only:
            # Try to find the latest version by name
            latest_model = model_registry.get_latest_model_by_name(model_name)
            if latest_model:
                return {
                    "found": True,
                    "id": latest_model.id,
                    "name": latest_model.name,
                    "status": latest_model.status.value,
                    "model_type": (
                        latest_model.model_type.value
                        if latest_model.model_type
                        else "unknown"
                    ),
                    "feature_names": latest_model.feature_names,
                    "version": latest_model.version,
                    "is_latest": True,
                }

        # Search all models
        models = (
            model_registry.get_latest_models()
            if latest_only
            else model_registry.get_all_models()
        )

        # Try exact match first
        for model in models:
            if model.name.lower() == model_name.lower():
                return {
                    "found": True,
                    "id": model.id,
                    "name": model.name,
                    "status": model.status.value,
                    "model_type": (
                        model.model_type.value if model.model_type else "unknown"
                    ),
                    "feature_names": model.feature_names,
                    "version": model.version,
                    "is_latest": model.is_latest,
                }

        # Try partial match
        for model in models:
            if (
                model_name.lower() in model.name.lower()
                or model.name.lower() in model_name.lower()
            ):
                return {
                    "found": True,
                    "id": model.id,
                    "name": model.name,
                    "status": model.status.value,
                    "model_type": (
                        model.model_type.value if model.model_type else "unknown"
                    ),
                    "feature_names": model.feature_names,
                    "version": model.version,
                    "is_latest": model.is_latest,
                    "note": f"Partial match found for '{model_name}'",
                }

        return {
            "found": False,
            "message": f"No model found with name '{model_name}'. Available models: {[m.name for m in models]}",
        }
    except Exception as e:
        logger.error(f"Failed to find model by name {model_name}: {str(e)}")
        return {"found": False, "message": f"Error searching for model: {str(e)}"}


@tool
def get_model_versions(model_name: str) -> dict:
    """
    Get all versions of a model by name.

    Args:
        model_name: Name of the model to get versions for

    Returns:
        List of all versions of the model
    """
    try:
        versions = model_registry.get_models_by_name(model_name)

        if not versions:
            return {
                "found": False,
                "message": f"No models found with name '{model_name}'",
            }

        return {
            "found": True,
            "model_name": model_name,
            "total_versions": len(versions),
            "versions": [
                {
                    "id": m.id,
                    "version": m.version,
                    "status": m.status.value,
                    "is_latest": m.is_latest,
                    "created_at": (
                        m.created_at.isoformat() if hasattr(m, "created_at") else None
                    ),
                }
                for m in versions
            ],
        }
    except Exception as e:
        logger.error(f"Failed to get model versions for {model_name}: {str(e)}")
        return {"found": False, "message": f"Error getting model versions: {str(e)}"}
