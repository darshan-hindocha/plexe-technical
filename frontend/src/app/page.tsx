/**
 * Main application page for Plexe ML Model Service.
 * 
 * Provides tabbed interface for:
 * - Chat: Real-time conversation with AI assistant
 * - Upload: Model file upload with validation
 * - Models: Model management and overview
 * 
 * Production TODOs:
 * - Add user authentication
 * - Implement proper error boundaries
 * - Add loading states and skeletons
 * - Set up analytics tracking
 * - Add accessibility improvements
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Upload, MessageSquare, List, Brain, AlertCircle } from 'lucide-react';
import Chat from './components/Chat';
import FileUpload from './components/FileUpload';
import ModelList from './components/ModelList';
import { apiClient, ModelMeta } from './lib/client';
import { ChatProvider, useChatContext } from './lib/chat-context';
import analytics from './lib/client-analytics';

type View = 'chat' | 'upload' | 'models';

// Add interface for ModelFamily to match what ModelList expects
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

interface HomeContentProps {
  activeView: View;
  setActiveView: React.Dispatch<React.SetStateAction<View>>;
}

function HomeContent({ activeView, setActiveView }: HomeContentProps) {
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setInitialMessage } = useChatContext();

  // Track view changes for analytics
  const handleViewChange = (newView: View) => {
    const previousView = activeView;
    analytics.viewChanged(newView, previousView);
    setActiveView(newView);
  };

  // Load models on component mount
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getModels();
      setModels(response.models);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (model: ModelMeta) => {
    setModels(prev => [...prev, model]);
    handleViewChange('models');
    setError(null);
  };

  const handleUploadError = (error: string) => {
    setError(error);
  };

  const handleDeleteModel = async (modelId: string) => {
    try {
      await apiClient.deleteModel(modelId);
      setModels(prev => prev.filter(m => m.id !== modelId));
      if (selectedModel?.id === modelId) {
        setSelectedModel(null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete model');
    }
  };

  const handleSelectModel = (model: ModelMeta) => {
    setSelectedModel(model);
  };



  const handleChatPrediction = (modelFamily: ModelFamily) => {
    // Get the deployed model to access feature names
    const deployedModel = modelFamily.models?.find(m => m.is_latest) || modelFamily.models?.[0];
    
    // Create the prediction prompt with actual feature names if available
    const featurePrompts = [];
    if (deployedModel?.feature_names && deployedModel.feature_names.length > 0) {
      // Use actual feature names from the model
      deployedModel.feature_names.forEach(featureName => {
        featurePrompts.push(`${featureName}: ,`);
      });
    } else {
      // Fallback to generic feature names
      for (let i = 1; i <= modelFamily.feature_count; i++) {
        featurePrompts.push(`feature_${i}: ,`);
      }
    }
    
    const predictionPrompt = `make a prediction on ${modelFamily.name} with features;\n${featurePrompts.join('\n')}`;
    
    // Set the initial message and navigate to chat
    setInitialMessage(predictionPrompt);
    handleViewChange('chat');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'upload':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Model</h2>
            <FileUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
        );
      
      case 'models':
        return (
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading models...</p>
              </div>
            ) : (
              <ModelList
                models={models}
                onDeleteModel={handleDeleteModel}
                onSelectModel={handleSelectModel}
                selectedModelId={selectedModel?.id}
                onUploadClick={() => handleViewChange('upload')}
                onChatPrediction={handleChatPrediction}
              />
            )}
          </div>
        );
      
      default:
        return (
          <div className="h-full">
            <Chat />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Plexe ML Service</h1>
                <p className="text-sm text-gray-500">Model Management & Predictions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{models.length} models</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => handleViewChange('chat')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                activeView === 'chat'
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Chat Assistant</span>
            </button>
            
            <button
              onClick={() => handleViewChange('models')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                activeView === 'models'
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="h-5 w-5" />
              <span>Models</span>
              {models.length > 0 && (
                <span className="ml-auto bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full">
                  {models.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => handleViewChange('upload')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                activeView === 'upload'
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Upload className="h-5 w-5" />
              <span>Upload Model</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-hidden">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<View>('chat');

  const handleModelUploadRequested = () => {
    setActiveView('upload');
  };

  return (
    <ChatProvider onModelUploadRequested={handleModelUploadRequested}>
      <HomeContent activeView={activeView} setActiveView={setActiveView} />
    </ChatProvider>
  );
}
