"use client";

import React from "react";
import { X, ExternalLink } from "lucide-react";

interface XGBoostInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function XGBoostInfoModal({ isOpen, onClose }: XGBoostInfoModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">About XGBoost</h2>
            <p className="text-gray-600 mt-1">
              Understanding the machine learning algorithm powering these models
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* What is XGBoost */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What is XGBoost?</h3>
              <p className="text-gray-700 leading-relaxed">
                XGBoost (eXtreme Gradient Boosting) is a powerful machine learning algorithm that excels at making predictions from data. 
                Think of it as an extremely smart system that learns from examples and gets better at making predictions by combining 
                the insights from many smaller "decision trees."
              </p>
            </div>

            {/* How it works */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How Does It Work?</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>1. Learning from Examples:</strong> XGBoost analyzes your data to find patterns and relationships 
                  between different features (like age, income, location) and the outcomes you want to predict.
                </p>
                <p>
                  <strong>2. Building Multiple Models:</strong> Instead of relying on one prediction model, XGBoost creates 
                  hundreds or thousands of smaller models, each focusing on different aspects of the data.
                </p>
                <p>
                  <strong>3. Combining Predictions:</strong> It then combines all these smaller predictions into one 
                  final, highly accurate prediction - like having a panel of experts vote on the best answer.
                </p>
              </div>
            </div>

            {/* Why it's popular */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Why is XGBoost So Popular?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">High Accuracy</h4>
                  <p className="text-sm text-blue-800">
                    Consistently produces some of the most accurate predictions across many different types of problems.
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Fast Performance</h4>
                  <p className="text-sm text-green-800">
                    Optimized for speed, making it practical for real-world applications with large datasets.
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Handles Missing Data</h4>
                  <p className="text-sm text-purple-800">
                    Automatically deals with missing information in your data without requiring manual preprocessing.
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900 mb-2">Versatile</h4>
                  <p className="text-sm text-orange-800">
                    Works well for both classification (predicting categories) and regression (predicting numbers).
                  </p>
                </div>
              </div>
            </div>

            {/* Use cases */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Common Use Cases</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Customer Behavior:</strong> Predicting if customers will buy, churn, or respond to marketing</li>
                  <li>• <strong>Financial Services:</strong> Credit scoring, fraud detection, and risk assessment</li>
                  <li>• <strong>Healthcare:</strong> Diagnosis assistance and treatment outcome prediction</li>
                  <li>• <strong>E-commerce:</strong> Price optimization and recommendation systems</li>
                  <li>• <strong>Marketing:</strong> Click-through rate prediction and customer segmentation</li>
                </ul>
              </div>
            </div>

            {/* Further reading */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Learn More</h3>
              <div className="space-y-3">
                <a 
                  href="https://xgboost.readthedocs.io/en/stable/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>Official XGBoost Documentation</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a 
                  href="https://machinelearningmastery.com/gentle-introduction-xgboost-applied-machine-learning/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>A Gentle Introduction to XGBoost</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a 
                  href="https://towardsdatascience.com/https-medium-com-vishalmorde-xgboost-algorithm-long-she-may-rein-edd9f99be63d" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>XGBoost Algorithm Explained</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a 
                  href="https://www.youtube.com/watch?v=8b1JEDvenQU" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>XGBoost Explained (Video)</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 