import { API_BASE_URL } from '@/lib/config';
import { storage } from '@/lib/storage';

/**
 * API Service for making authenticated requests
 */
class ApiService {
  /**
   * Make an authenticated GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    try {
      const accessToken = await storage.getAccessToken();
      const url = `${API_BASE_URL}${endpoint}`;

      console.log(`[API] GET ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });

      console.log(`[API] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API] Error response: ${errorText}`);
        throw new Error(
          `API request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return response.json();
    } catch (error) {
      console.error(`[API] Request error:`, error);
      throw error;
    }
  }

  /**
   * Make an authenticated POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    try {
      const accessToken = await storage.getAccessToken();
      const url = `${API_BASE_URL}${endpoint}`;

      console.log(`[API] POST ${url}`, data);

      const headers: Record<string, string> = {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      };

      // Only set Content-Type if we have data
      if (data !== undefined) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      console.log(`[API] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API] Error response: ${errorText}`);
        throw new Error(
          `API request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return response.json();
    } catch (error) {
      console.error(`[API] Request error:`, error);
      throw error;
    }
  }

  /**
   * Make an authenticated PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const accessToken = await storage.getAccessToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make an authenticated DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const accessToken = await storage.getAccessToken();

    const headers: Record<string, string> = {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    };

    // DELETE requests typically don't have a body, so don't set Content-Type

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    // Handle empty responses (204 No Content)
    const contentLength = response.headers.get('content-length');
    if (response.status === 204 || contentLength === '0') {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Make an authenticated PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const accessToken = await storage.getAccessToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();

// Example usage:
//
// import { apiService } from '@/services/api.service';
//
// // GET request
// const tasks = await apiService.get('/api/tasks');
//
// // POST request
// const newTask = await apiService.post('/api/tasks', {
//   title: 'New Task',
//   description: 'Task description'
// });
//
// // PUT request
// const updatedTask = await apiService.put('/api/tasks/123', {
//   title: 'Updated Task'
// });
//
// // DELETE request
// await apiService.delete('/api/tasks/123');
