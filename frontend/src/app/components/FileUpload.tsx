'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { apiClient, ModelMeta } from '../lib/client';
import analytics from '../lib/client-analytics';
import UploadModal from './UploadModal';

interface FileUploadProps {
  onUploadSuccess: (model: ModelMeta) => void;
  onUploadError: (error: string) => void;
}

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

export default function FileUpload({ onUploadSuccess, onUploadError }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelPreview, setModelPreview] = useState<ModelPreview | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(file => 
      file.name.endsWith('.pkl') || file.name.endsWith('.joblib')
    );
    
    if (validFile) {
      setSelectedFile(validFile);
      handleFilePreview(validFile);
    } else {
      onUploadError('Please select a .pkl or .joblib file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      handleFilePreview(file);
    }
  };

  const handleFilePreview = async (file: File) => {
    try {
      setIsUploading(true);
      const preview = await apiClient.previewModel(file);
      setModelPreview(preview);
      setShowModal(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Preview failed';
      onUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadConfirm = async (uploadData: {
    name: string;
    description: string;
    is_new_version: boolean;
    parent_model_id?: string;
  }) => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    // Analytics: Track upload start
    analytics.modelUploadStarted(selectedFile.name, selectedFile.size);
    
    try {
      const model = await apiClient.uploadModel(
        selectedFile,
        uploadData.name,
        uploadData.description,
        uploadData.is_new_version,
        uploadData.parent_model_id
      );
      
      // Analytics: Track upload success
      analytics.modelUploadSuccess(
        model.id,
        model.name,
        model.model_type,
        model.feature_names?.length
      );
      
      onUploadSuccess(model);
      
      // Reset form
      setSelectedFile(null);
      setModelPreview(null);
      setShowModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      // Analytics: Track upload error
      analytics.modelUploadError(selectedFile.name, errorMessage);
      
      onUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModelPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setModelPreview(null);
    setShowModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* File Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pkl,.joblib"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <Upload className="h-12 w-12 text-gray-800" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Upload Model File
            </h3>
            <p className="text-gray-800 mt-1">
              Drag and drop your model file here, or click to browse
            </p>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isUploading}
            >
              <FileText className="h-4 w-4 mr-2" />
              Choose File
            </button>
            
            <p className="text-xs text-gray-400">
              Supports .pkl and .joblib files (max 100MB)
            </p>
          </div>
        </div>
      </div>

      {/* Selected File Preview */}
      {selectedFile && !showModal && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            <button
              onClick={clearSelection}
              className="p-1 text-gray-400 hover:text-gray-600"
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isUploading && (
            <div className="mt-3 flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Analyzing model...</span>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showModal}
        onClose={handleModalClose}
        modelPreview={modelPreview}
        onConfirm={handleUploadConfirm}
        isUploading={isUploading}
      />
    </div>
  );
} 