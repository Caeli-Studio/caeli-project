import { apiService } from "./api.service";

export function updateMyProfile(payload: { 
    display_name?: string ;
    avatar_url? : string;
}) {
  return apiService.put("/api/profile/me", payload);
}
