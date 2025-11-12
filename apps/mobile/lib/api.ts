/**
 * API Service pour Caeli Mobile
 * Service de communication avec le backend
 */

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  due_at?: string;
  assigned_to?: string[];
  category_id?: string;
  is_free?: boolean;
  required_count?: number;
}

export interface Task {
  id: string;
  group_id: string;
  title: string;
  description?: string;
  due_at?: string;
  status: 'open' | 'done' | 'cancelled';
  is_free: boolean;
  required_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Member {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  role: string;
}

/**
 * Récupère le token d'authentification
 */
async function getAuthToken(): Promise<string | null> {
  // TODO: Implémenter la récupération du token depuis le stockage sécurisé
  // Pour l'instant, on retourne null (à implémenter avec SecureStore)
  return null;
}

/**
 * Effectue une requête HTTP
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Une erreur est survenue',
        message: data.message,
      };
    }

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: 'Erreur de connexion',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Crée une nouvelle tâche
 */
export async function createTask(
  groupId: string,
  taskData: CreateTaskRequest
): Promise<ApiResponse<Task>> {
  return fetchAPI<Task>(`/groups/${groupId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

/**
 * Récupère les tâches d'un groupe
 */
export async function getTasks(
  groupId: string,
  params?: {
    status?: 'open' | 'done' | 'cancelled';
    assigned_to?: string;
  }
): Promise<ApiResponse<Task[]>> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.assigned_to)
    queryParams.append('assigned_to', params.assigned_to);

  const query = queryParams.toString();
  const endpoint = `/groups/${groupId}/tasks${query ? `?${query}` : ''}`;

  return fetchAPI<Task[]>(endpoint);
}

/**
 * Récupère les membres d'un groupe
 */
export async function getGroupMembers(
  groupId: string
): Promise<ApiResponse<Member[]>> {
  return fetchAPI<Member[]>(`/groups/${groupId}/members`);
}

/**
 * Met à jour une tâche
 */
export async function updateTask(
  groupId: string,
  taskId: string,
  updates: Partial<CreateTaskRequest>
): Promise<ApiResponse<Task>> {
  return fetchAPI<Task>(`/groups/${groupId}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Supprime une tâche
 */
export async function deleteTask(
  groupId: string,
  taskId: string
): Promise<ApiResponse<void>> {
  return fetchAPI<void>(`/groups/${groupId}/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

/**
 * Complète une tâche
 */
export async function completeTask(
  groupId: string,
  taskId: string
): Promise<ApiResponse<Task>> {
  return fetchAPI<Task>(`/groups/${groupId}/tasks/${taskId}/complete`, {
    method: 'POST',
  });
}
