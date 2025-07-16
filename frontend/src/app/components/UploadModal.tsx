'use client';

import React, { useState, useEffect } from 'react';
import { X, Brain, FileText, Tag, Layers, Check, AlertCircle } from 'lucide-react';
import { ModelMeta } from '../lib/client';

interface ModelPreview {
  model_info: {
    filename: string;
    file_size: number;
    model_class: string;
    model_type: string;
    feature_names: string[] | null;
    n_features: number | null;
  };
  available_models: Array<{
    id: string;
    name: string;
    version: number;
    model_type: string;
  }>;
  suggested_name: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelPreview: ModelPreview | null;
  onConfirm: (uploadData: {
    name: string;
    description: string;
    is_new_version: boolean;
    parent_model_id?: string;
  }) => void;
  isUploading: boolean;
}

export default function UploadModal({ 
  isOpen, 
  onClose, 
  modelPreview, 
  onConfirm, 
  isUploading 
}: UploadModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isNewVersion, setIsNewVersion] = useState(false);
  const [selectedParentModel, setSelectedParentModel] = useState('');

  useEffect(() => {
    if (modelPreview) {
      setName(modelPreview.suggested_name);
      setDescription('');
      setIsNewVersion(false);
      setSelectedParentModel('');
    }
  }, [modelPreview]);

  if (!isOpen || !modelPreview) return null;

  const handleConfirm = () => {
    onConfirm({
      name,
      description,
      is_new_version: isNewVersion,
      parent_model_id: isNewVersion ? selectedParentModel : undefined,
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const canConfirm = name.trim() && (!isNewVersion || selectedParentModel);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Confirm Model Upload</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md"
            disabled={isUploading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Model Information Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center">
              <Brain className="h-4 w-4 mr-2" />
              Model Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Filename:</span>
                <p className="font-medium">{modelPreview.model_info.filename}</p>
              </div>
              
              <div>
                <span className="text-gray-600">File Size:</span>
                <p className="font-medium">{formatFileSize(modelPreview.model_info.file_size)}</p>
              </div>
              
              <div>
                <span className="text-gray-600">Model Type:</span>
                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ml-2 ${
                  modelPreview.model_info.model_type === 'classifier' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {modelPreview.model_info.model_type}
                </span>
              </div>
              
              <div>
                <span className="text-gray-600">Model Class:</span>
                <p className="font-medium">{modelPreview.model_info.model_class}</p>
              </div>
            </div>

            {modelPreview.model_info.feature_names && (
              <div className="mt-4">
                <span className="text-gray-600">Expected Features ({modelPreview.model_info.feature_names.length}):</span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {modelPreview.model_info.feature_names.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-200 text-gray-700"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upload Configuration */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Upload Configuration
            </h3>

            {/* Model Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter model name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your model"
              />
            </div>

            {/* Versioning Options */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Upload Type
              </label>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={!isNewVersion}
                    onChange={() => setIsNewVersion(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Upload as new model</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={isNewVersion}
                    onChange={() => setIsNewVersion(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Upload as new version of existing model</span>
                </label>
              </div>

              {isNewVersion && (
                <div className="ml-6 mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Parent Model
                  </label>
                  <select
                    value={selectedParentModel}
                    onChange={(e) => setSelectedParentModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a model...</option>
                    {modelPreview.available_models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} (v{model.version}) - {model.model_type}
                      </option>
                    ))}
                  </select>
                  
                  {isNewVersion && !selectedParentModel && (
                    <p className="text-xs text-gray-500 mt-1">
                      Select which existing model this is a new version of
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center text-sm text-gray-600">
            {isNewVersion && selectedParentModel ? (
              <div className="flex items-center">
                <Layers className="h-4 w-4 mr-1" />
                Will create new version of selected model
              </div>
            ) : !isNewVersion ? (
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                Will create new model
              </div>
            ) : (
              <div className="flex items-center text-amber-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                Please select a parent model
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm || isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>{isUploading ? 'Uploading...' : 'Confirm Upload'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 