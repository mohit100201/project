import { apiClient } from "./api.client";

export const getApkVersion = async (options: {
  
  latitude: string;
  longitude: string;
  token: string; 
}) => {
  return apiClient({
    endpoint: "/apk-version",
    method: "GET",
    headers: {
    
      latitude: options.latitude,
      longitude: options.longitude,
      Authorization: `Bearer ${options.token}`, 
    },
  });
};