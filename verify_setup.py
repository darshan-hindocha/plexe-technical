#!/usr/bin/env python3
"""
Quick verification script for Plexe ML Model Service.

This script verifies that the core functionality works without requiring API keys.
It tests the upload → deploy → predict workflow using the REST API.
"""

import requests
import tempfile
import joblib
import xgboost as xgb
import numpy as np
from sklearn.datasets import make_classification
import time
import sys


def create_test_model():
    """Create a simple XGBoost model for testing."""
    print("📦 Creating test model...")
    
    # Generate synthetic data
    X, y = make_classification(n_samples=100, n_features=4, n_classes=2, random_state=42)
    
    # Train XGBoost model
    model = xgb.XGBClassifier(random_state=42, eval_metric='logloss')
    model.fit(X, y)
    
    # Save to temporary file
    temp_file = tempfile.NamedTemporaryFile(suffix='.pkl', delete=False)
    joblib.dump(model, temp_file.name)
    temp_file.close()
    
    print(f"✅ Test model created: {temp_file.name}")
    return temp_file.name


def verify_backend_running():
    """Check if the backend is running."""
    print("🔍 Checking if backend is running...")
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running!")
            data = response.json()
            print(f"   📊 Service: {data.get('message', 'Unknown')}")
            print(f"   🔑 API Key Status: {data.get('api_key_status', 'unknown')}")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend not accessible: {e}")
        print("💡 Make sure to run 'make dev' or 'docker-compose up' first")
        return False


def test_model_upload(model_file):
    """Test model upload functionality."""
    print("\n📤 Testing model upload...")
    
    try:
        with open(model_file, 'rb') as f:
            files = {'file': ('test_model.pkl', f, 'application/octet-stream')}
            data = {
                'name': 'verification_test_model',
                'description': 'Model uploaded by verification script'
            }
            
            response = requests.post(
                "http://localhost:8000/api/v1/models/upload",
                files=files,
                data=data,
                timeout=30
            )
        
        if response.status_code == 200:
            model_data = response.json()
            print("✅ Model uploaded successfully!")
            print(f"   📋 Model ID: {model_data['id']}")
            print(f"   📊 Model Type: {model_data['model_type']}")
            print(f"   🎯 Status: {model_data['status']}")
            return model_data['id']
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return None


def test_model_prediction(model_id):
    """Test model prediction functionality."""
    print("\n🎯 Testing model prediction...")
    
    try:
        prediction_data = {
            "features": {
                "feature_0": 1.5,
                "feature_1": -0.5,
                "feature_2": 0.3,
                "feature_3": 2.1
            }
        }
        
        response = requests.post(
            f"http://localhost:8000/api/v1/models/{model_id}/predict",
            json=prediction_data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Prediction successful!")
            print(f"   🎯 Prediction: {result['prediction']}")
            if 'probability' in result and result['probability']:
                print(f"   📊 Probability: {result['probability']:.2%}")
            if 'confidence' in result and result['confidence']:
                print(f"   🎚️ Confidence: {result['confidence']}")
            return True
        else:
            print(f"❌ Prediction failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return False


def test_model_list():
    """Test model listing functionality."""
    print("\n📋 Testing model list...")
    
    try:
        response = requests.get("http://localhost:8000/api/v1/models", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            models = data.get('models', [])
            print(f"✅ Found {len(models)} model(s)")
            
            for model in models[-3:]:  # Show last 3 models
                print(f"   📦 {model['name']} ({model['model_type']}) - {model['status']}")
            
            return True
        else:
            print(f"❌ List failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ List error: {e}")
        return False


def cleanup_test_model(model_id):
    """Clean up the test model."""
    print(f"\n🧹 Cleaning up test model...")
    
    try:
        response = requests.delete(f"http://localhost:8000/api/v1/models/{model_id}", timeout=10)
        if response.status_code == 200:
            print("✅ Test model cleaned up")
        else:
            print(f"⚠️ Cleanup warning: {response.status_code}")
    except Exception as e:
        print(f"⚠️ Cleanup error: {e}")


def main():
    """Run the verification process."""
    print("🚀 Plexe ML Model Service - Verification Script")
    print("=" * 50)
    print("This script tests core functionality without requiring API keys")
    print("")
    
    # Check if backend is running
    if not verify_backend_running():
        sys.exit(1)
    
    # Create test model
    model_file = None
    model_id = None
    
    try:
        model_file = create_test_model()
        
        # Test upload
        model_id = test_model_upload(model_file)
        if not model_id:
            sys.exit(1)
        
        # Test prediction
        if not test_model_prediction(model_id):
            sys.exit(1)
        
        # Test listing
        if not test_model_list():
            sys.exit(1)
        
        print("\n🎉 All core functionality verified successfully!")
        print("")
        print("✅ What works without API keys:")
        print("   • Model upload and deployment")
        print("   • REST API predictions")
        print("   • Model management")
        print("   • API documentation")
        print("")
        print("💬 To test chat functionality:")
        print("   • Set up API keys (see README.md)")
        print("   • Visit http://localhost:3000")
        print("   • Try the chat interface")
        print("")
        print("📚 Visit http://localhost:8000/docs for API documentation")
        
    except KeyboardInterrupt:
        print("\n⏹️ Verification stopped by user")
    
    finally:
        # Cleanup
        if model_id:
            cleanup_test_model(model_id)
        
        if model_file:
            try:
                import os
                os.unlink(model_file)
                print("🗑️ Temporary files cleaned up")
            except:
                pass


if __name__ == "__main__":
    main() 