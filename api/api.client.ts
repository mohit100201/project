// src/api/api.client.ts

import { API_CONFIG } from "./api.config";
import { getApiHeaders } from "./api.header";

type ApiRequestOptions = {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
};

// ✅ Custom error class to preserve response data
class ApiError extends Error {
  response: {
    status: number;
    data: any;
  };

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = "ApiError";
    this.response = {
      status,
      data,
    };
  }
}

export const apiClient = async ({
  endpoint,
  method = "POST",
  body,
  headers = {},
}: ApiRequestOptions) => {
  const isFormData = body instanceof FormData;

  
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method,
    headers: {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...getApiHeaders(),
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

 

  const json = await response.json();
  console.log("body",JSON.stringify(body))

  console.log("API Response:", {
    endpoint,
    method,
    status: response.status,
    data: json,
  });

  if (!response.ok) {
   
    
    // ✅ Throw custom error that preserves all response data
    throw new ApiError(
      json.message || "API Error",
      response.status,
      json
    );
  }

  
  return json;
};