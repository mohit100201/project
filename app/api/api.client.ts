// src/api/api.client.ts

import { API_CONFIG } from "./api.config";

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

  // console.log(`📤 API Request: ${method} ${endpoint}`);
  // console.log(`📦 Body:`, isFormData ? "[FormData]" : body);

  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method,
    headers: {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();

  if (!response.ok) {
    // console.log(`❌ API Error Response:`, JSON.stringify(json, null, 2));
    
    // ✅ Throw custom error that preserves all response data
    throw new ApiError(
      json.message || "API Error",
      response.status,
      json
    );
  }

  // console.log(`✅ API Success:`, json);
  return json;
};