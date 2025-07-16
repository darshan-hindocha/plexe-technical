"use client";

import React, { useState } from "react";
import { X, Copy, CheckCircle } from "lucide-react";

interface ModelFamily {
  name: string;
  latest_version: number;
  version_count: number;
  model_type: string;
  is_deployed: boolean;
  last_updated: string;
  feature_count: number;
  models: any[];
}

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelFamily: ModelFamily;
}

export default function DocsModal({ isOpen, onClose, modelFamily }: DocsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Get the deployed model (latest version)
  const deployedModel = modelFamily.models?.find(m => m.is_latest) || modelFamily.models?.[0];
  const modelId = deployedModel?.id || 'model_id';

  // Create feature example based on model type
  const createFeatureExample = () => {
    const features: { [key: string]: any } = {};
    
    // Use actual feature names if available
    if (deployedModel?.feature_names && deployedModel.feature_names.length > 0) {
      const featureNames = deployedModel.feature_names.slice(0, 5); // Limit to 5 for display
      featureNames.forEach((featureName, index) => {
        if (modelFamily.model_type === 'classifier') {
          features[featureName] = index === 0 ? 1.5 : index === 1 ? 0.8 : Math.round(Math.random() * 10 * 100) / 100;
        } else {
          features[featureName] = Math.round(Math.random() * 100 * 100) / 100;
        }
      });
      
      if (deployedModel.feature_names.length > 5) {
        features["..."] = "additional_features";
      }
    } else {
      // Fallback to generic feature names
      for (let i = 1; i <= Math.min(modelFamily.feature_count, 5); i++) {
        if (modelFamily.model_type === 'classifier') {
          features[`feature_${i}`] = i === 1 ? 1.5 : i === 2 ? 0.8 : Math.round(Math.random() * 10 * 100) / 100;
        } else {
          features[`feature_${i}`] = Math.round(Math.random() * 100 * 100) / 100;
        }
      }
      
      if (modelFamily.feature_count > 5) {
        features["..."] = "additional_features";
      }
    }
    
    return features;
  };

  const exampleFeatures = createFeatureExample();
  
  // Create the curl command
  const apiUrl = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:8000';
    
  const curlCommand = `curl -X POST "${apiUrl}/api/v1/models/${modelId}/predict" \\
  -H "Content-Type: application/json" \\
  -d '{
    "features": ${JSON.stringify(exampleFeatures, null, 6).replace(/^/gm, '    ')}
  }'`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">API Documentation</h2>
            <p className="text-gray-600 mt-1">
              {modelFamily.name} - v{modelFamily.latest_version} ({modelFamily.model_type})
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Endpoint Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Prediction Endpoint</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">POST</span>
                  <code className="text-sm font-mono">/api/v1/models/{modelId}/predict</code>
                </div>
                <p className="text-gray-600 text-sm">
                  Make a prediction using the {modelFamily.name} model
                </p>
              </div>
            </div>

            {/* Request Format */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Format</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Headers</h4>
                <code className="block text-sm bg-white p-2 rounded border">
                  Content-Type: application/json
                </code>
                
                <h4 className="font-medium text-gray-800 mb-2 mt-4">Body</h4>
                <pre className="text-sm bg-white p-4 rounded border overflow-x-auto">
{`{
  "features": {
    "feature_1": number,
    "feature_2": number,
    ...
  }
}`}</pre>
              </div>
            </div>

            {/* Example Request */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Example Request</h3>
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <button
                  onClick={handleCopy}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
                <pre className="text-sm text-green-400 overflow-x-auto pr-12">
                  <code>{curlCommand}</code>
                </pre>
              </div>
              {copied && (
                <p className="text-green-600 text-sm mt-2">✓ Copied to clipboard!</p>
              )}
            </div>

            {/* Response Format */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Response Format</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm bg-white p-4 rounded border overflow-x-auto">
{`{
  "prediction": ${modelFamily.model_type === 'classifier' ? '"class_name"' : '42.5'},
  "probability": ${modelFamily.model_type === 'classifier' ? '0.85' : 'null'},
  "confidence": ${modelFamily.model_type === 'classifier' ? '"high"' : 'null'},
  "model_id": "${modelId}"
}`}</pre>
              </div>
            </div>

            {/* Model Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Model Information</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Model Name:</span>
                    <div className="font-medium">{modelFamily.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Version:</span>
                    <div className="font-medium">v{modelFamily.latest_version}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <div className="font-medium capitalize">{modelFamily.model_type}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Features:</span>
                    <div className="font-medium">{modelFamily.feature_count}</div>
                  </div>
                </div>
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