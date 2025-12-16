// Use environment variable for API URL, fallback to relative path
// For GitHub Pages, set VITE_API_URL to your backend URL
// Example: https://your-backend.herokuapp.com/api or https://api.yourdomain.com/api
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('accessToken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || 'Request failed',
      response.status,
      errorData
    );
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text || text.trim() === '') {
    return undefined as T;
  }

  return JSON.parse(text);
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
  upload: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Upload failed',
        response.status,
        errorData
      );
    }

    return response.json();
  },
  download: async (endpoint: string): Promise<Blob> => {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Download failed',
        response.status,
        errorData
      );
    }

    return response.blob();
  },
};

