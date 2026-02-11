// src/api/auth.api.ts

import { apiClient } from "./api.client";

type LoginPayload = {
  login: string;
  password: string;
};

export const loginApi = async (
  payload: LoginPayload,
  options: {
    
    latitude: string;
    longitude: string;
  }
) => {
  return apiClient({
    endpoint: "/login",
    method: "POST",
    body: payload,
    headers: {
      
      latitude: options.latitude,
      longitude: options.longitude,
    },
  });
};


export const forgotPasswordApi = async (
  payload: { login: string },
  options: {
   
    latitude: string;
    longitude: string;
  }
) => {
  return apiClient({
    endpoint: "/forgot-password",
    method: "POST",
    body: payload,
    headers: {
     
      latitude: options.latitude,
      longitude: options.longitude,
    },
  });
};

export const resetPasswordApi = async (
  payload: {
    login: string;
    otp: string;
    new_password: string;
    new_password_confirmation: string;
  },
  options: {
   
    latitude: string;
    longitude: string;
  }
) => {
  return apiClient({
    endpoint: "/reset-password",
    method: "POST",
    body: payload,
    headers: {
      
      latitude: options.latitude,
      longitude: options.longitude,
    },
  });
};


export const registerApi = async (
  payload: {
    name: string;
    email: string;
    phone: string;
    role: string;
    password: string;
    password_confirmation: string;
  },
  options: {
    
    latitude: string;
    longitude: string;
  }
) => {
  return apiClient({
    endpoint: "/register",
    method: "POST",
    body: payload,
    headers: {
      
      latitude: options.latitude,
      longitude: options.longitude,
    },
  });
};

export const verifyOtpApi = async (
  payload: {
    login: string;
    otp: string;
  },
  options: {
    
    latitude?: string;
    longitude?: string;
    flow: "login" | "signup" | "forgot";
  }
) => {
  const endpoint =
    options.flow === "login" || options.flow === "signup"
      ? "/verify-otp-login"
      : "/verify-otp";

  return apiClient({
    endpoint,
    method: "POST",
    body: payload,
    headers: {
      
      ...(options.latitude ? { latitude: options.latitude } : {}),
      ...(options.longitude ? { longitude: options.longitude } : {}),
    },
  });
};

export const logoutApi = async (
  options: {
    token: string;
    
    latitude: string;
    longitude: string;
  }
) => {
  return apiClient({
    endpoint: "/logout",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
     
      latitude: options.latitude,
      longitude: options.longitude,
    },
  });
};
