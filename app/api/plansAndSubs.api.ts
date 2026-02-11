import { apiClient } from "./api.client";

export const getAllPlansApi = async (options: {
  
  latitude: string;
  longitude: string;
  token: string; 
}) => {
  return apiClient({
    endpoint: "/plans",
    method: "GET",
    headers: {
      latitude: options.latitude,
      longitude: options.longitude,
      Authorization: `Bearer ${options.token}`, 
    },
  });
};

export const getAssignedPlanApi = async (options: {
  user_id: string | number;
 
  latitude: string;
  longitude: string;
  token: string;
}) => {
  return apiClient({
    endpoint: `/plan/assigned?user_id=${options.user_id}`,
    method: "GET",
    headers: {
      latitude: options.latitude,
      longitude: options.longitude,
      Authorization: `Bearer ${options.token}`,
    },
  });
};

/**
 * Request a plan upgrade
 * URL: https://api.pinepe.in/api/plan/upgrade
 * Method: POST
 */
export const upgradePlanApi = async (options: {
  user_id: string | number;
  plan_id: string | number;
  
  latitude: string;
  longitude: string;
  token: string;
}) => {
  return apiClient({
    endpoint: "/plan/upgrade",
    method: "POST",
    headers: {
      latitude: options.latitude,
      longitude: options.longitude,
      Authorization: `Bearer ${options.token}`,
    },
    body: {
      user_id: options.user_id,
      plan_id: options.plan_id,
    },
  });
};