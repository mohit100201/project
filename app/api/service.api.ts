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

// Define the request parameters (matching your wallet balance logic)
type GetKycStatusOptions = {
  domain: string;
  latitude: string;
  longitude: string;
  token: string;
};

export type Pipe = {
  value: string;
  is_active: boolean;
};

// Define a discriminated union for the data object
export type KycStatusData = 
  | {
      status: "Approved";
      agentCode: string;
      pipes: Pipe[];
    }
  | {
      status: "Pending" | "InProgress" | "Rejected" | "Not Found";
      agentCode?: never; // Ensures you don't accidentally access these
      pipes?: never;
    };

export type KycStatusResponse = {
  success: boolean;
  message: string;
  data: KycStatusData;
};

export const getBankItKycStatusApi = async (
  options: GetKycStatusOptions
): Promise<KycStatusResponse> => {
  const { domain, latitude, longitude, token } = options;

  return apiClient({
    endpoint: "/bankit/kyc/status",
    method: "GET",
    headers: {
      domain,
      latitude,
      longitude,
      Authorization: `Bearer ${token}`,
    },
  });
};

type SubmitKycOptions = {
  domain: string;
  latitude: string;
  longitude: string;
  token: string;
  formData: any; // This will be the FormData object from the UI
};

export const submitKycApi = async (options: SubmitKycOptions) => {
  const { domain, latitude, longitude, token, formData } = options;

  
  return apiClient({
    endpoint: "/bankit/kyc/submit",
    method: "POST",
    body: formData, // Pass the FormData object directly
    headers: {
      domain,
      latitude,
      longitude,
      Authorization: `Bearer ${token}`,
      // "Content-Type": "multipart/form-data",
    },
  });
};

type TokenRequestOptions = {
  agentCode: string;
  pipe: string;
  domain: string;
  token: string;
  latitude: string;
  longitude: string;
};

export const getAepsTokenApi = async (options: TokenRequestOptions) => {
  const { agentCode, pipe, domain, token, latitude, longitude } = options;

  return apiClient({
    endpoint: "/bankit/kyc/token",
    method: "POST",
    body: {
      agentCode,
      pipe,
    },
    headers: {
      domain,
      latitude,
      longitude,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};