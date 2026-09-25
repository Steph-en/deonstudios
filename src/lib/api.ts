/**
 * Unified API Client for communicating with the server-side database.
 * Guarantees cross-browser consistency (Safari, Brave, Chrome, Mobile)
 * and persistence across browser sessions and redeployments.
 */

export class ApiClient {
  private static baseUrl = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
    : '/api';

  private static async parseResponse<T>(res: Response, endpoint: string): Promise<T> {
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      let errorMsg = res.statusText;
      if (contentType.includes('application/json')) {
        const err = await res.json().catch(() => null);
        if (err?.error) errorMsg = err.error;
      }
      throw new Error(errorMsg || `HTTP ${res.status}: Request failed for ${endpoint}`);
    }

    if (!contentType.includes('application/json')) {
      throw new Error(`Expected JSON from ${endpoint}, but received ${contentType || 'non-JSON'}`);
    }

    return res.json();
  }

  static async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    return this.parseResponse<T>(res, endpoint);
  }

  static async post<T>(endpoint: string, data?: any): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });

    return this.parseResponse<T>(res, endpoint);
  }

  static async put<T>(endpoint: string, data: any): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return this.parseResponse<T>(res, endpoint);
  }

  static async delete<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    return this.parseResponse<T>(res, endpoint);
  }
}
