/**
 * API Integration Layer for GeoMeasure Pro
 * Communicates with the FastAPI backend at VITE_API_BASE_URL.
 */

import { 
  FileRecord, 
  FeatureMeasurement, 
  ApiHealthStatus, 
  MeasurementsListResponse 
} from '../types/geospatial';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';

const STORAGE_API_KEY = 'geomeasure_api_base_url';
const STORAGE_FILES_KEY = 'geomeasure_persisted_records';

export function getApiBaseUrl(): string {
  const custom = localStorage.getItem(STORAGE_API_KEY);
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return 'http://localhost:8000';
}

export function setApiBaseUrl(url: string): void {
  localStorage.setItem(STORAGE_API_KEY, url.trim().replace(/\/+$/, ''));
}

export class GeoMeasureApiClient {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errJson = await response.json();
          if (errJson && errJson.detail) {
            errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
          }
        } catch {
          // Response body was not JSON
        }
        throw new Error(errorDetail);
      }

      if (response.status === 204) {
        return null as unknown as T;
      }

      return await response.json();
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`Request to ${url} timed out after 15 seconds.`);
      }
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error(`Cannot connect to FastAPI backend at ${baseUrl}. Ensure backend is running.`);
      }
      throw err;
    }
  }

  /**
   * Health Check: queries GET /api/health
   */
  static async checkHealth(): Promise<{ isOnline: boolean; data?: ApiHealthStatus; error?: string }> {
    try {
      const data = await this.request<ApiHealthStatus>('/api/health');
      return { isOnline: true, data };
    } catch (err: any) {
      return { isOnline: false, error: err.message };
    }
  }

  /**
   * Upload and process KML or ZIP Shapefile: POST /api/files/
   */
  static async uploadFile(file: File): Promise<FileRecord> {
    const formData = new FormData();
    formData.append('file', file);

    const result = await this.request<FileRecord>('/api/files/', {
      method: 'POST',
      body: formData
    });

    // Cache locally as secondary recovery storage
    this.saveToLocalCache(result);
    return result;
  }

  /**
   * Get file metadata: GET /api/files/{id}/
   */
  static async getFile(fileId: string): Promise<FileRecord> {
    return await this.request<FileRecord>(`/api/files/${fileId}/`);
  }

  /**
   * Get file measurements: GET /api/files/{id}/measurements/
   */
  static async getFileMeasurements(
    fileId: string, 
    params?: { page?: number; page_size?: number; geometry_type?: string; status?: string }
  ): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params?.geometry_type) searchParams.set('geometry_type', params.geometry_type);
    if (params?.status) searchParams.set('status', params.status);

    const qs = searchParams.toString();
    const endpoint = `/api/files/${fileId}/measurements/${qs ? `?${qs}` : ''}`;
    return await this.request(endpoint);
  }

  /**
   * List files: GET /api/files/
   */
  static async listFiles(search?: string): Promise<FileRecord[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return await this.request<FileRecord[]>(`/api/files/${qs}`);
  }

  /**
   * Delete file: DELETE /api/files/{id}/
   */
  static async deleteFile(fileId: string): Promise<void> {
    await this.request<void>(`/api/files/${fileId}/`, {
      method: 'DELETE'
    });
    this.removeFromLocalCache(fileId);
  }

  // --- Local Fallback & Seed Data Management ---

  static getLocalCachedFiles(): FileRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_FILES_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Failed to read local cache:", e);
    }
    // Default seed with sample datasets
    localStorage.setItem(STORAGE_FILES_KEY, JSON.stringify(SAMPLE_DATASETS));
    return SAMPLE_DATASETS;
  }

  static saveToLocalCache(file: FileRecord): void {
    try {
      const current = this.getLocalCachedFiles();
      const updated = [file, ...current.filter(f => f.id !== file.id)];
      localStorage.setItem(STORAGE_FILES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to write to local cache:", e);
    }
  }

  static removeFromLocalCache(fileId: string): void {
    try {
      const current = this.getLocalCachedFiles();
      const updated = current.filter(f => f.id !== fileId);
      localStorage.setItem(STORAGE_FILES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to remove from local cache:", e);
    }
  }
}
