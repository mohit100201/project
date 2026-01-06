import { apiClient } from "./api.client";

type GetFundRequestsOptions = {
  token: string;
  domain: string;
  latitude: string;
  longitude: string;
  page?: number;
  perPage?: number;
};

export const getFundRequestsApi = async (options: GetFundRequestsOptions) => {
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 10;

  const params = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
  });

  return apiClient({
    endpoint: `/fund/my-requests?${params.toString()}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${options.token}`,
      domain: options.domain,
      latitude: options.latitude,
      longitude: options.longitude,
    },
  });
};


// Define types for better IntelliSense and safety
export interface FetchBankListOptions {
  domain: string;
  token: string;
  latitude: number | string;
  longitude: number | string;
  // If the API requires specific body parameters, add them here
  // Based on the URL, it's a bank list fetch, so body might be empty or filter-based
  payload?: any; 
}

export const fetchBankListApi = async (options: FetchBankListOptions) => {
  const { domain, token, latitude, longitude, payload = {} } = options;

  return apiClient({
    endpoint: "/bankit/fetch-bank-list",
    method: "POST",
    body: payload, // Sending provided payload or empty object
    headers: {
      domain,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};


export type GetAdminBanksOptions = {
  token: string;
  domain: string;
  latitude: string;
  longitude: string;
};

export const getAdminBanksApi = async (options: GetAdminBanksOptions) => {
  return apiClient({
    endpoint: `/admin/banks`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${options.token}`,
      domain: options.domain,
      latitude: options.latitude,
      longitude: options.longitude,
    },
  });
};


export const getAdminQrsApi = async (options: GetAdminBanksOptions) => {
  return apiClient({
    endpoint: `/admin/qrs`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${options.token}`,
      domain: options.domain,
      latitude: options.latitude,
      longitude: options.longitude,
    },
  });
};