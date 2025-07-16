'use client';

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { ModelMeta } from '../lib/client';
import analytics from '../lib/client-analytics';
import ModelCard from './ModelCard';
import ModelDetail from './ModelDetail';
import DocsModal from './DocsModal';
import XGBoostInfoModal from './XGBoostInfoModal';
import { format } from 'timeago.js';

interface ModelListProps {
  models: ModelMeta[];
  onDeleteModel: (modelId: string) => void;
  onSelectModel: (model: ModelMeta) => void;
  selectedModelId?: string;
  onUploadClick: () => void;
  onChatPrediction: (modelFamily: ModelFamily) => void;
}

interface ModelFamily {
  name: string;
  latest_version: number;
  version_count: number;
  model_type: string;
  is_deployed: boolean;
  last_updated: string;
  feature_count: number;
  models: ModelMeta[];
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

export default function ModelList({ 
  models, 
  onDeleteModel, 
  onSelectModel, 
  selectedModelId,
  onUploadClick,
  onChatPrediction 
}: ModelListProps) {
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [selectedModelForDocs, setSelectedModelForDocs] = useState<ModelFamily | null>(null);
  const [xgBoostInfoModalOpen, setXgBoostInfoModalOpen] = useState(false);

  // Analytics: Track model list view
  React.useEffect(() => {
    analytics.modelListViewed(models.length);
  }, [models.length]);

  // Group models by name (model families)
  const modelFamilies = React.useMemo(() => {
    const familiesMap = new Map<string, ModelFamily>();
    
    models.forEach(model => {
      const familyName = model.name;
      
      if (!familiesMap.has(familyName)) {
        familiesMap.set(familyName, {
          name: familyName,
          latest_version: model.version || 1,
          version_count: 1,
          model_type: model.model_type,
          is_deployed: model.is_latest || false,
          last_updated: model.created_at,
          feature_count: model.feature_names?.length || 0,
          models: [model]
        });
      } else {
        const family = familiesMap.get(familyName)!;
        family.version_count += 1;
        family.models.push(model);
        
        // Update to latest version info if this model is newer
        if ((model.version || 0) > family.latest_version) {
          family.latest_version = model.version || 1;
          family.model_type = model.model_type;
          family.last_updated = model.created_at;
          family.feature_count = model.feature_names?.length || 0;
        }
        
        // Update deployed status if any version is deployed
        if (model.is_latest) {
          family.is_deployed = true;
        }
      }
    });
    
    return Array.from(familiesMap.values());
  }, [models]);

  const handleDeleteModel = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (model) {
      analytics.modelDeleted(model.id, model.name);
      onDeleteModel(modelId);
    }
  };

  const handleSelectModel = (model: ModelMeta) => {
    analytics.modelSelected(model.id, model.name);
    onSelectModel(model);
  };

  const handleFamilyClick = (familyName: string) => {
    setSelectedFamily(familyName);
  };

  const handleBackToList = () => {
    setSelectedFamily(null);
  };

  const handleDeployNewVersion = () => {
    onUploadClick();
  };

  const handleShowDocs = (modelFamily: ModelFamily) => {
    setSelectedModelForDocs(modelFamily);
    setDocsModalOpen(true);
  };

  const handleCloseDocs = () => {
    setDocsModalOpen(false);
    setSelectedModelForDocs(null);
  };

  const handleShowXGBoostInfo = () => {
    setXgBoostInfoModalOpen(true);
  };

  const handleCloseXGBoostInfo = () => {
    setXgBoostInfoModalOpen(false);
  };

  // If a family is selected, show the detail view
  if (selectedFamily) {
    const familyModels = models.filter(m => m.name === selectedFamily);
    return (
      <ModelDetail
        modelName={selectedFamily}
        models={familyModels}
        onBack={handleBackToList}
        onDeployNewVersion={handleDeployNewVersion}
        onDeleteModel={handleDeleteModel}
      />
    );
  }

  // Master view - show model families as cards
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Models</h1>
          <p className="text-gray-600 mt-1">
            {modelFamilies.length} model{modelFamilies.length !== 1 ? 's' : ''} • {models.length} total version{models.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onUploadClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Model</span>
        </button>
      </div>

      {/* Model Cards Grid */}
      {modelFamilies.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.712-3.714M14 40v-4a9.971 9.971 0 01.712-3.714m0 0A9.971 9.971 0 0118 32a9.971 9.971 0 013.288 4.286M14 36v-4a9.971 9.971 0 011.712-3.714" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No models</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by uploading your first model.</p>
            <div className="mt-6">
              <button
                onClick={onUploadClick}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Model
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {modelFamilies.map((family) => (
            <ModelCard
              key={family.name}
              modelFamily={family}
              onClick={() => handleFamilyClick(family.name)}
              onChatPrediction={onChatPrediction}
              onShowDocs={handleShowDocs}
              onShowInfo={handleShowXGBoostInfo}
            />
          ))}
        </div>
      )}

      {/* Docs Modal */}
      {selectedModelForDocs && (
        <DocsModal
          isOpen={docsModalOpen}
          onClose={handleCloseDocs}
          modelFamily={selectedModelForDocs}
        />
      )}

      {/* XGBoost Info Modal */}
      <XGBoostInfoModal
        isOpen={xgBoostInfoModalOpen}
        onClose={handleCloseXGBoostInfo}
      />
    </div>
  );
} 