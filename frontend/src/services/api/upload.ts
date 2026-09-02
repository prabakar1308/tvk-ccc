import { fetchWithAuth, getAuthToken } from './client';

export const uploadApi = {
  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Use native fetch to automatically handle the multipart boundary
    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/v1/upload`, {
      method: 'POST',
      body: formData,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
  },

  deleteFile: async (url: string): Promise<void> => {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/v1/upload?url=${encodeURIComponent(url)}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      console.error(`Failed to delete orphaned file: ${url}`);
    }
  }
};
