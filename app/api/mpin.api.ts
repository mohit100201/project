import { apiClient } from "./api.client";

export const sendMpinOtpApi = async (options: {
  domain: string;
  latitude: string;
  longitude: string;
  token: string;
}) => {
  return apiClient({
    endpoint: "/users/mpin/otp",
    method: "POST",
    headers: {
      domain: options.domain,
      latitude: options.latitude,
      longitude: options.longitude,
      Authorization: `Bearer ${options.token}`,
    },
    
  });
};

export const setMpinApi = async (options: {
  domain: string;
  latitude: string;
  longitude: string;
  token: string;
  otp: string;
  mpin: string;
}) => {
  return apiClient({
    endpoint: "/users/mpin",
    method: "POST",
    headers: {
      domain: options.domain,
      latitude: options.latitude,
      longitude: options.longitude,
      Authorization: `Bearer ${options.token}`,
    },
    body: {
      otp: options.otp,
      mpin: options.mpin,
    },
  });
};

export const confirmMpinApi = async (options: {
  domain: string;
  latitude: string;
  longitude: string;
  token: string;
  mpin: string; // The MPIN to be verified
}) => {
  return apiClient({
    endpoint: "/confirm-mpin",
    method: "POST",
    headers: {
      domain: options.domain,
      latitude: options.latitude,
      longitude: options.longitude,
      Authorization: `Bearer ${options.token}`,
    },
    body: {
      mpin: options.mpin,
    },
  });
};

