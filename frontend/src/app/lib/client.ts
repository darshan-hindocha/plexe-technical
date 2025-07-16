import { components } from './api';

// Type definitions from generated schema
export type ModelMeta = components['schemas']['ModelMeta'];
export type ModelListResponse = components['schemas']['ModelListResponse'];
export type PredictionRequest = components['schemas']['PredictionRequest'];
export type PredictionResponse = components['schemas']['PredictionResponse'];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetchWithErrorHandling<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // Model management
  async previewModel(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/v1/models/preview`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Preview failed: ${errorText}`);
    }

    return response.json();
  }

  async uploadModel(
    file: File, 
    name: string, 
    description?: string, 
    isNewVersion?: boolean, 
    parentModelId?: string
  ): Promise<ModelMeta> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    if (description) formData.append('description', description);
    if (isNewVersion !== undefined) formData.append('is_new_version', String(isNewVersion));
    if (parentModelId) formData.append('parent_model_id', parentModelId);

    const response = await fetch(`${this.baseUrl}/api/v1/models/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    return response.json();
  }

  async getModels(latestOnly: boolean = false): Promise<ModelListResponse> {
    const params = latestOnly ? '?latest_only=true' : '';
    return this.fetchWithErrorHandling<ModelListResponse>(`/api/v1/models${params}`);
  }

  async getModel(modelId: string): Promise<ModelMeta> {
    return this.fetchWithErrorHandling<ModelMeta>(`/api/v1/models/${modelId}`);
  }

  async deleteModel(modelId: string): Promise<{ message: string }> {
    return this.fetchWithErrorHandling(`/api/v1/models/${modelId}`, {
      method: 'DELETE',
    });
  }

  // Predictions
  async predict(modelId: string, features: Record<string, any>): Promise<PredictionResponse> {
    return this.fetchWithErrorHandling<PredictionResponse>(`/api/v1/models/${modelId}/predict`, {
      method: 'POST',
      body: JSON.stringify({ features }),
    });
  }

  // Batch predictions
  async predictBatch(modelId: string, features: Record<string, any>[]): Promise<{ predictions: PredictionResponse[]; model_id: string }> {
    return this.fetchWithErrorHandling(`/api/v1/models/${modelId}/predict/batch`, {
      method: 'POST',
      body: JSON.stringify({ features }),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.fetchWithErrorHandling('/health');
  }
}

export const apiClient = new ApiClient(); 