import numpy as np
import pandas as pd
from typing import Dict, Any, List
from ..schemas.prediction import PredictionResponse, PredictionBatchResponse
from ..services.registry import model_registry


class PredictionService:
    """Service for making predictions with loaded models."""

    def __init__(self):
        self.registry = model_registry

    def _prepare_features(self, features: Dict[str, Any], model_id: str) -> np.ndarray:
        """Prepare input features for model prediction."""
        model_meta = self.registry.get_model(model_id)
        if not model_meta:
            raise ValueError(f"Model {model_id} not found")

        # If we have feature names from the model, ensure order matches
        if model_meta.feature_names:
            try:
                # Create DataFrame to ensure proper feature ordering
                df = pd.DataFrame([features])
                # Reorder columns to match model's expected feature order
                df = df.reindex(columns=model_meta.feature_names)

                # Check for missing features
                missing_features = df.isnull().any()
                if missing_features.any():
                    missing_cols = df.columns[missing_features].tolist()
                    raise ValueError(f"Missing required features: {missing_cols}")

                return df.values
            except KeyError as e:
                raise ValueError(f"Missing required features: {e}")
        else:
            # Fallback: convert to array (feature order may be incorrect)
            return np.array(list(features.values())).reshape(1, -1)

    def _get_confidence_level(self, probability: float) -> str:
        """Get confidence level description based on probability."""
        if probability >= 0.8:
            return "High"
        elif probability >= 0.6:
            return "Medium"
        else:
            return "Low"

    def predict(self, model_id: str, features: Dict[str, Any]) -> PredictionResponse:
        """Make a single prediction."""
        try:
            # Load model
            model = self.registry.load_model(model_id)

            # Prepare features
            X = self._prepare_features(features, model_id)

            # Make prediction
            prediction = model.predict(X)[0]

            # Get probability if available (for classifiers)
            probability = None
            confidence = None

            if hasattr(model, "predict_proba"):
                proba = model.predict_proba(X)[0]
                if len(proba) == 2:  # Binary classification
                    probability = float(max(proba))
                else:  # Multi-class
                    probability = float(
                        proba[prediction]
                        if isinstance(prediction, (int, np.integer))
                        else max(proba)
                    )
                confidence = self._get_confidence_level(probability)

            # Convert prediction to appropriate type
            if isinstance(prediction, np.number):
                prediction = prediction.item()

            return PredictionResponse(
                prediction=prediction,
                probability=probability,
                confidence=confidence,
                model_id=model_id,
            )

        except Exception as e:
            raise ValueError(f"Prediction failed: {str(e)}")

    def predict_batch(
        self, model_id: str, features_list: List[Dict[str, Any]]
    ) -> PredictionBatchResponse:
        """Make batch predictions."""
        try:
            # Load model
            model = self.registry.load_model(model_id)

            predictions = []

            for features in features_list:
                # Prepare features for each sample
                X = self._prepare_features(features, model_id)

                # Make prediction
                prediction = model.predict(X)[0]

                # Get probability if available
                probability = None
                confidence = None

                if hasattr(model, "predict_proba"):
                    proba = model.predict_proba(X)[0]
                    if len(proba) == 2:  # Binary classification
                        probability = float(max(proba))
                    else:  # Multi-class
                        probability = float(
                            proba[prediction]
                            if isinstance(prediction, (int, np.integer))
                            else max(proba)
                        )
                    confidence = self._get_confidence_level(probability)

                # Convert prediction to appropriate type
                if isinstance(prediction, np.number):
                    prediction = prediction.item()

                predictions.append(
                    PredictionResponse(
                        prediction=prediction,
                        probability=probability,
                        confidence=confidence,
                        model_id=model_id,
                    )
                )

            return PredictionBatchResponse(predictions=predictions, model_id=model_id)

        except Exception as e:
            raise ValueError(f"Batch prediction failed: {str(e)}")


# Global predictor instance
prediction_service = PredictionService()
