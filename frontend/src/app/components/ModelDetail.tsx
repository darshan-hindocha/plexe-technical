'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Brain, 
  Activity, 
  FileText, 
  Calendar, 
  Package, 
  Settings, 
  BarChart3, 
  Upload,
  Trash2,
  RotateCcw,
  Eye,
  MoreHorizontal 
} from 'lucide-react';
import { ModelMeta } from '../lib/client';
import { format } from 'timeago.js';

interface ModelDetailProps {
  modelName: string;
  models: ModelMeta[];
  onBack: () => void;
  onDeployNewVersion: () => void;
  onDeleteModel: (modelId: string) => void;
}

const getModelIcon = (modelType: string) => {
  switch (modelType) {
    case 'classifier':
      return Brain;
    case 'regressor':
      return Activity;
    default:
      return FileText;
  }
};

const getStatusBadge = (isLatest: boolean, deployedAt?: string) => {
  if (isLatest) {
    return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Latest</span>;
  }
  if (deployedAt) {
    return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Deployed</span>;
  }
  return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">Archived</span>;
};

const formatDate = (dateString: string) => {
  return format(dateString);
};

export default function ModelDetail({ 
  modelName, 
  models, 
  onBack, 
  onDeployNewVersion,
  onDeleteModel 
}: ModelDetailProps) {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  
  // Sort models by version (latest first)
  const sortedModels = [...models].sort((a, b) => (b.version || 0) - (a.version || 0));
  const latestModel = sortedModels[0];
  const Icon = getModelIcon(latestModel?.model_type || '');

  const handleActionClick = (action: string, modelId: string) => {
    switch (action) {
      case 'delete':
        onDeleteModel(modelId);
        break;
      case 'rollback':
        // TODO: Implement rollback functionality
        console.log('Rollback model:', modelId);
        break;
      case 'metrics':
        // TODO: Implement metrics view
        console.log('View metrics for:', modelId);
        break;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack} 
          className="mr-4 hover:bg-gray-100 p-2 rounded-full transition"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">{modelName}</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Model Versions List */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Model Versions</h3>
              <button 
                onClick={onDeployNewVersion}
                className="flex items-center text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded"
              >
                <Upload className="h-4 w-4 mr-2" />
                Deploy New Version
              </button>
            </div>

            {sortedModels.map((model) => (
              <div 
                key={model.id} 
                className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
                  model.is_latest ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${model.is_latest ? 'bg-blue-500' : 'bg-gray-400'}`} />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">v{model.version}</span>
                      {model.is_latest && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(model.created_at || '')}
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Package className="h-4 w-4 mr-2" />
                        {model.feature_names?.length || 0} features
                      </div>
                    </div>
                    
                    {model.feature_names && (
                      <div className="mt-3">
                        <span className="text-sm text-gray-500">Expected features: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {model.feature_names.slice(0, 3).map((feature, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {feature}
                            </span>
                          ))}
                          {model.feature_names.length > 3 && (
                            <span className="text-gray-500 text-xs px-2 py-1">
                              +{model.feature_names.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick('metrics', model.id);
                    }}
                    className="hover:bg-gray-100 p-2 rounded"
                    title="View Metrics"
                  >
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                  </button>
                  
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement more actions dropdown
                      }}
                      className="hover:bg-gray-100 p-2 rounded"
                      title="More Actions"
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Overview</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Model Type</label>
                <p className="font-medium capitalize">{latestModel?.model_type}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-500">Latest Version</label>
                <p className="font-medium">v{latestModel?.version}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-500">Total Versions</label>
                <p className="font-medium">{sortedModels.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 