#!/usr/bin/env python3
"""Create sample XGBoost models for testing."""

import numpy as np
import pandas as pd
import joblib
from sklearn.datasets import make_classification, make_regression
from sklearn.model_selection import train_test_split
import xgboost as xgb
from pathlib import Path


def create_sample_models():
    """Create sample XGBoost models for testing."""
    
    # Create output directory
    output_dir = Path("sample_models")
    output_dir.mkdir(exist_ok=True)
    
    print("Creating sample models...")
    
    # 1. Customer Churn Classifier
    print("1. Creating customer churn classifier...")
    
    # Generate synthetic customer data
    np.random.seed(42)
    n_samples = 1000
    
    # Features: tenure, monthly_charges, total_charges
    tenure = np.random.randint(1, 73, n_samples)
    monthly_charges = np.random.uniform(20, 120, n_samples)
    total_charges = tenure * monthly_charges + np.random.normal(0, 100, n_samples)
    
    # Create churn labels (customers with high charges and low tenure are more likely to churn)
    churn_prob = 0.3 + 0.4 * (monthly_charges / 120) - 0.3 * (tenure / 72)
    churn = np.random.binomial(1, np.clip(churn_prob, 0, 1), n_samples)
    
    # Create DataFrame
    customer_data = pd.DataFrame({
        'tenure': tenure,
        'monthly_charges': monthly_charges,
        'total_charges': total_charges
    })
    
    # Train model
    X_train, X_test, y_train, y_test = train_test_split(
        customer_data, churn, test_size=0.2, random_state=42
    )
    
    churn_model = xgb.XGBClassifier(random_state=42)
    churn_model.fit(X_train, y_train)
    
    # Save model
    churn_path = output_dir / "customer_churn_model.pkl"
    joblib.dump(churn_model, churn_path)
    print(f"   Saved to: {churn_path}")
    print(f"   Features: {list(customer_data.columns)}")
    print(f"   Accuracy: {churn_model.score(X_test, y_test):.3f}")
    
    # 2. Price Prediction Regressor
    print("\n2. Creating price prediction regressor...")
    
    # Generate synthetic product data
    np.random.seed(123)
    n_products = 800
    
    # Features: quality_score, brand_value, market_demand
    quality_score = np.random.uniform(1, 10, n_products)
    brand_value = np.random.uniform(0, 5, n_products)
    market_demand = np.random.uniform(0, 1, n_products)
    
    # Create price (higher quality, brand value, and demand = higher price)
    price = (quality_score * 10 + brand_value * 20 + market_demand * 30 + 
             np.random.normal(0, 5, n_products))
    price = np.clip(price, 10, 200)  # Reasonable price range
    
    # Create DataFrame
    product_data = pd.DataFrame({
        'quality_score': quality_score,
        'brand_value': brand_value,
        'market_demand': market_demand
    })
    
    # Train model
    X_train, X_test, y_train, y_test = train_test_split(
        product_data, price, test_size=0.2, random_state=42
    )
    
    price_model = xgb.XGBRegressor(random_state=42)
    price_model.fit(X_train, y_train)
    
    # Save model
    price_path = output_dir / "price_prediction_model.pkl"
    joblib.dump(price_model, price_path)
    print(f"   Saved to: {price_path}")
    print(f"   Features: {list(product_data.columns)}")
    print(f"   R² Score: {price_model.score(X_test, y_test):.3f}")
    
    # 3. Sentiment Analysis Classifier
    print("\n3. Creating sentiment analysis classifier...")
    
    # Generate synthetic text features (simplified)
    np.random.seed(456)
    n_reviews = 600
    
    # Features: word_count, positive_words, negative_words
    word_count = np.random.randint(10, 200, n_reviews)
    positive_words = np.random.randint(0, 20, n_reviews)
    negative_words = np.random.randint(0, 15, n_reviews)
    
    # Create sentiment (0=negative, 1=neutral, 2=positive)
    sentiment_score = positive_words - negative_words + np.random.normal(0, 2, n_reviews)
    sentiment = np.where(sentiment_score < -1, 0, np.where(sentiment_score > 1, 2, 1))
    
    # Create DataFrame
    sentiment_data = pd.DataFrame({
        'word_count': word_count,
        'positive_words': positive_words,
        'negative_words': negative_words
    })
    
    # Train model
    X_train, X_test, y_train, y_test = train_test_split(
        sentiment_data, sentiment, test_size=0.2, random_state=42
    )
    
    sentiment_model = xgb.XGBClassifier(random_state=42)
    sentiment_model.fit(X_train, y_train)
    
    # Save model
    sentiment_path = output_dir / "sentiment_analysis_model.pkl"
    joblib.dump(sentiment_model, sentiment_path)
    print(f"   Saved to: {sentiment_path}")
    print(f"   Features: {list(sentiment_data.columns)}")
    print(f"   Accuracy: {sentiment_model.score(X_test, y_test):.3f}")
    
    print(f"\n✓ Sample models created in '{output_dir}' directory")
    print("\nYou can use these models to test the application:")
    print(f"1. Customer Churn: tenure=24, monthly_charges=70, total_charges=1680")
    print(f"2. Price Prediction: quality_score=8.5, brand_value=3.2, market_demand=0.7")
    print(f"3. Sentiment Analysis: word_count=50, positive_words=8, negative_words=2")


if __name__ == "__main__":
    create_sample_models() 