import { apiClient } from "./api.client";

type GetServicesOptions = {
  domain: string;
  latitude: string;
  longitude: string;
  token: string;
  status?: "active" | "inactive";
  type?: "dashboard" | "all"; // ✅ NEW (optional)
  perPage?: number;
};


export const getServicesApi = async (options: GetServicesOptions) => {
  const {
    domain,
    latitude,
    longitude,
    token,
    status = "active",
    type,               // optional
    perPage = 50,
  } = options;

  const params = new URLSearchParams({
    status,
    per_page: String(perPage),
    ...(type ? { type } : {}), // ✅ only add if present
  }).toString();

  return apiClient({
    endpoint: `/services?${params}`,
    method: "GET",
    headers: {
      domain,
      latitude,
      longitude,
      Authorization: `Bearer ${token}`,
    },
  });
};