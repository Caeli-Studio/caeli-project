import { apiService } from './api.service';

class ProfileService {
  updateMyProfile(payload: { pseudo?: string; avatar_url?: string }) {
    return apiService.put('/api/profile/me', payload);
  }

  // ✅ NOUVELLE MÉTHODE
  getMyStats(): Promise<{
    success: boolean;
    completed_tasks: number;
  }> {
    return apiService.get('/api/profile/me/stats');
  }
}

export const profileService = new ProfileService();
