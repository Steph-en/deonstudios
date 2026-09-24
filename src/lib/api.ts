/**
 * Unified API Client for communicating with the server-side database.
 * Guarantees cross-browser consistency (Safari, Brave, Chrome, Mobile)
 * and persistence across browser sessions and redeployments.
 */

export class ApiClient {
  private static baseUrl = '/api';

  static async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}: Failed to fetch ${endpoint}`);
    }

    return res.json();
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

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}: Failed to post to ${endpoint}`);
    }

    return res.json();
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

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}: Failed to update ${endpoint}`);
    }

    return res.json();
  }

  static async delete<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}: Failed to delete ${endpoint}`);
    }

    return res.json();
  }
}
