import json
import uuid
import joblib
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path

from ..schemas.model_meta import ModelMeta, ModelMetaCreate, ModelStatus, ModelType
from ..core.config import settings


class ModelRegistry:
    """Service for managing ML model storage and metadata."""

    def __init__(self):
        self.models: Dict[str, ModelMeta] = {}
        self.loaded_models: Dict[str, Any] = {}
        self._load_registry()

    def _get_registry_path(self) -> Path:
        """Get path to registry metadata file."""
        return Path(settings.models_storage_path) / "registry.json"

    def _load_registry(self):
        """Load model registry from disk."""
        registry_path = self._get_registry_path()
        if registry_path.exists():
            try:
                with open(registry_path, "r") as f:
                    data = json.load(f)
                    for model_id, model_data in data.items():
                        # Handle migration for models without versioning fields
                        if "version" not in model_data:
                            model_data["version"] = 1
                        if "parent_model_id" not in model_data:
                            model_data["parent_model_id"] = None
                        if "is_latest" not in model_data:
                            model_data["is_latest"] = True

                        self.models[model_id] = ModelMeta(**model_data)

                # After loading, run migration to fix version conflicts
                self._migrate_existing_models()

            except Exception as e:
                print(f"Error loading registry: {e}")

    def _migrate_existing_models(self):
        """Migrate existing models to ensure proper versioning."""
        try:
            # Group models by name to fix versioning
            model_groups = {}
            for model in self.models.values():
                if model.name not in model_groups:
                    model_groups[model.name] = []
                model_groups[model.name].append(model)

            # Fix versioning for each group
            for model_name, models in model_groups.items():
                if len(models) > 1:
                    # Multiple models with same name - fix versions
                    # Sort by creation date to assign versions chronologically
                    models.sort(key=lambda m: m.created_at)

                    # Assign versions starting from 1
                    for i, model in enumerate(models):
                        model.version = i + 1
                        model.is_latest = i == len(models) - 1  # Last one is latest
                        self.models[model.id] = model

                elif len(models) == 1:
                    # Single model - ensure it's marked as latest
                    model = models[0]
                    model.is_latest = True
                    self.models[model.id] = model

            # Save the migrated registry
            self._save_registry()
            print(
                f"Migration completed: processed {len(self.models)} models across {len(model_groups)} model families"
            )

        except Exception as e:
            print(f"Error during model migration: {e}")

    def _save_registry(self):
        """Save model registry to disk."""
        registry_path = self._get_registry_path()
        try:
            with open(registry_path, "w") as f:
                data = {
                    model_id: model.model_dump(mode="json")
                    for model_id, model in self.models.items()
                }
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving registry: {e}")

    def _get_model_family(self, model_id: str) -> List[ModelMeta]:
        """Get all models in the same version family (including the specified model)."""
        target_model = self.get_model(model_id)
        if not target_model:
            return []

        # Find the root model (the one without a parent)
        root_model_id = model_id
        while target_model and target_model.parent_model_id:
            root_model_id = target_model.parent_model_id
            target_model = self.get_model(root_model_id)

        # Collect all models with this root as parent or the root itself
        family = []
        for model in self.models.values():
            if (
                model.id == root_model_id
                or model.parent_model_id == root_model_id
                or self._is_descendant(model.id, root_model_id)
            ):
                family.append(model)

        return family

    def _is_descendant(self, model_id: str, ancestor_id: str) -> bool:
        """Check if a model is a descendant of an ancestor model."""
        model = self.get_model(model_id)
        while model and model.parent_model_id:
            if model.parent_model_id == ancestor_id:
                return True
            model = self.get_model(model.parent_model_id)
        return False

    def save_model(
        self, model_data: bytes, filename: str, metadata: ModelMetaCreate
    ) -> str:
        """Save model binary and metadata with versioning support."""
        model_id = str(uuid.uuid4())

        # Handle versioning logic
        version = 1
        parent_model_id = None

        if metadata.is_new_version and metadata.parent_model_id:
            # This is a new version of an existing model
            parent_model = self.get_model(metadata.parent_model_id)
            if not parent_model:
                raise ValueError(f"Parent model {metadata.parent_model_id} not found")

            # Set parent and calculate new version
            parent_model_id = metadata.parent_model_id

            # Find the highest version for this model family
            model_family = self._get_model_family(metadata.parent_model_id)
            if model_family:
                version = max(m.version for m in model_family) + 1
            else:
                version = 2  # Parent is version 1, this becomes version 2

            # Mark all previous versions as not latest
            for existing_model in model_family:
                if existing_model.is_latest:
                    existing_model.is_latest = False
                    existing_model.updated_at = datetime.utcnow()

        elif metadata.is_new_version and not metadata.parent_model_id:
            # User wants new version but didn't specify parent - try to find by name
            existing_models = [
                m for m in self.models.values() if m.name == metadata.name
            ]
            if existing_models:
                # Find the latest version of this model name
                latest_model = max(existing_models, key=lambda m: m.version)
                parent_model_id = latest_model.id
                version = latest_model.version + 1

                # Mark all previous versions as not latest
                for existing_model in existing_models:
                    if existing_model.is_latest:
                        existing_model.is_latest = False
                        existing_model.updated_at = datetime.utcnow()

        # Save model file
        file_extension = Path(filename).suffix
        model_filename = f"{model_id}{file_extension}"
        model_path = Path(settings.models_storage_path) / model_filename

        try:
            with open(model_path, "wb") as f:
                f.write(model_data)

            # Create full metadata object
            full_metadata = ModelMeta(
                id=model_id,
                name=metadata.name,
                description=metadata.description,
                file_path=str(model_path),
                status=ModelStatus.UPLOADED,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                version=version,
                parent_model_id=parent_model_id,
                is_latest=True,  # New models are always the latest version
            )

            # Try to load and inspect the model
            try:
                loaded_model = joblib.load(model_path)

                # Determine model type
                if hasattr(loaded_model, "predict_proba"):
                    full_metadata.model_type = ModelType.CLASSIFIER
                else:
                    full_metadata.model_type = ModelType.REGRESSOR

                # Extract feature names if available
                if hasattr(loaded_model, "feature_names_in_"):
                    full_metadata.feature_names = (
                        loaded_model.feature_names_in_.tolist()
                    )
                elif hasattr(loaded_model, "get_booster"):
                    # XGBoost specific
                    try:
                        booster = loaded_model.get_booster()
                        full_metadata.feature_names = booster.feature_names
                    except Exception:
                        pass

                # Store additional model info
                full_metadata.model_info = {
                    "model_class": type(loaded_model).__name__,
                    "has_predict_proba": hasattr(loaded_model, "predict_proba"),
                    "n_features": getattr(loaded_model, "n_features_in_", None),
                }

                full_metadata.status = ModelStatus.DEPLOYED

            except Exception as e:
                full_metadata.status = ModelStatus.ERROR
                full_metadata.model_info = {"error": str(e)}

            # Store in registry
            self.models[model_id] = full_metadata
            self._save_registry()

            return model_id

        except Exception as e:
            # Clean up file if it was created
            if model_path.exists():
                model_path.unlink()
            raise e

    def get_model(self, model_id: str) -> Optional[ModelMeta]:
        """Get model metadata by ID."""
        return self.models.get(model_id)

    def get_all_models(self) -> List[ModelMeta]:
        """Get all model metadata."""
        return list(self.models.values())

    def get_latest_models(self) -> List[ModelMeta]:
        """Get only the latest versions of all models."""
        return [model for model in self.models.values() if model.is_latest]

    def get_models_by_name(self, name: str) -> List[ModelMeta]:
        """Get all versions of models with the given name, sorted by version."""
        models = [model for model in self.models.values() if model.name == name]
        return sorted(models, key=lambda m: m.version)

    def get_latest_model_by_name(self, name: str) -> Optional[ModelMeta]:
        """Get the latest version of a model by name."""
        models = self.get_models_by_name(name)
        if not models:
            return None
        return max(models, key=lambda m: m.version)

    def load_model(self, model_id: str) -> Any:
        """Load model for inference."""
        if model_id not in self.models:
            raise ValueError(f"Model {model_id} not found")

        # Use cached model if available
        if model_id in self.loaded_models:
            return self.loaded_models[model_id]

        model_meta = self.models[model_id]
        if model_meta.status != ModelStatus.DEPLOYED:
            raise ValueError(f"Model {model_id} is not deployed")

        try:
            model = joblib.load(model_meta.file_path)
            self.loaded_models[model_id] = model
            return model
        except Exception as e:
            raise ValueError(f"Failed to load model {model_id}: {e}")

    def delete_model(self, model_id: str) -> bool:
        """Delete model and its files."""
        if model_id not in self.models:
            return False

        model_meta = self.models[model_id]

        # Remove file
        if model_meta.file_path and Path(model_meta.file_path).exists():
            Path(model_meta.file_path).unlink()

        # Remove from loaded models cache
        if model_id in self.loaded_models:
            del self.loaded_models[model_id]

        # Remove from registry
        del self.models[model_id]
        self._save_registry()

        return True


# Global registry instance
model_registry = ModelRegistry()
