"use client";

import React from "react";
import { Brain, FileText, Activity, MessageSquare, Code, Info } from "lucide-react";
import { format } from "timeago.js";

interface ModelFamily {
  name: string;
  latest_version: number;
  version_count: number;
  model_type: string;
  is_deployed: boolean;
  last_updated: string;
  feature_count: number;
  models?: any[];
}

interface ModelCardProps {
  modelFamily: ModelFamily;
  onClick: () => void;
  onChatPrediction: (modelFamily: ModelFamily) => void;
  onShowDocs: (modelFamily: ModelFamily) => void;
  onShowInfo: () => void;
}

const getModelIcon = (modelType: string) => {
  switch (modelType) {
    case "classifier":
      return Brain;
    case "regressor":
      return Activity;
    default:
      return FileText;
  }
};

const getStatusColor = (isDeployed: boolean) => {
  return isDeployed ? "bg-green-500" : "bg-gray-400";
};

export default function ModelCard({ modelFamily, onClick, onChatPrediction, onShowDocs, onShowInfo }: ModelCardProps) {
  const Icon = getModelIcon(modelFamily.model_type);

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChatPrediction(modelFamily);
  };

  const handleDocsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowDocs(modelFamily);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowInfo();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow group">
      {/* Header - clickable for details */}
      <div
        className="cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Icon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{modelFamily.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <div
                  className={`w-2 h-2 rounded-full ${getStatusColor(
                    modelFamily.is_deployed
                  )}`}
                />
                <span className="text-sm text-gray-600">
                  v{modelFamily.latest_version} is{" "}
                  {modelFamily.is_deployed ? "deployed" : "inactive"}
                </span>
              </div>
            </div>
          </div>
          {/* Info button */}
          <button
            onClick={handleInfoClick}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Learn about XGBoost"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Last updated</span>
            <span className="text-gray-900">
              {format(modelFamily.last_updated)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Features</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              {modelFamily.feature_count} features
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {modelFamily.is_deployed && (
        <div className="flex space-x-2 pt-4 border-t border-gray-100">
          <button
            onClick={handleChatClick}
            className="flex-1 flex w-1/2 items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat Prediction</span>
          </button>
          <button
            onClick={handleDocsClick}
            className="flex items-center w-1/2 justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            <Code className="h-4 w-4" />
            <span>Docs</span>
          </button>
        </div>
      )}

      {!modelFamily.is_deployed && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center">
            Deploy this model to enable predictions
          </p>
        </div>
      )}
    </div>
  );
}
