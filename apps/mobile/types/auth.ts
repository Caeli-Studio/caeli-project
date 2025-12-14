/**
 * Authentication types
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider?: string;
  created_at?: string;

  pseudo?: string;
  avatar_url?: string;

  memberships?: {
    id: string;
    group_id: string;
  }[];
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
}

export interface AuthResponse {
  success: boolean;
  session?: Session;
  user?: User;
  error?: string;
  message?: string;
}

export interface GoogleOAuthResponse {
  success: boolean;
  url: string;
  provider: string;
  error?: string;
  message?: string;
}

export interface SessionResponse {
  success: boolean;
  user?: User;
  error?: string;
  message?: string;
}

export interface SignOutResponse {
  success: boolean;
  message?: string;
  error?: string;
}
