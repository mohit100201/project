import { apiClient } from "./api.client";

export const getKycStatusApi = async (options: {
  
  latitude: string;
  longitude: string;
  token: string;
}) => {
  return apiClient({
    endpoint: "/kyc/status",
    method: "GET",
    headers: {
      
      latitude: options.latitude,
      longitude: options.longitude,
      Authorization: `Bearer ${options.token}`,
    },
  });
};