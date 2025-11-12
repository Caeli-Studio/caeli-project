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
    const accessToken = await storage.getAccessToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make an authenticated POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const accessToken = await storage.getAccessToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
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
