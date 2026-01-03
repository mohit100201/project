import { apiClient } from "./api.client";

export interface OperatorCheckOptions {
  mobile: string;
  latitude: string | number;
  longitude: string | number;
  token: string;
  domain:string;
}

export const checkOperatorApi = async (
  options: OperatorCheckOptions
): Promise<any> => {
  const { mobile, latitude, longitude, token } = options;

  return apiClient({
    endpoint: `/plans/operator-check?mobile=${mobile}`,
    method: "GET",
    headers: {
      latitude: String(latitude),
      longitude: String(longitude),
      Authorization: `Bearer ${token}`,
      Domain: options.domain,
      
    },
  });
};

export const checkROffersApi = async (options: {
  mobile: string;
  operator_code: string | number;
  domain: string;
  latitude: string;
  longitude: string;
  token: string;
}) => {
  const { mobile, operator_code, domain, latitude, longitude, token } = options;
  return apiClient({
    endpoint: `/plans/roffer-check?mobile=${mobile}&operator_code=${operator_code}`,
    method: "GET",
    headers: {
      domain,
      latitude,
      longitude,
      Authorization: `Bearer ${token}`,
    },
  });
};


export const checkMobilePlansApi = async (options: {
  operator_code: string | number;
  circle: string | number;
  domain: string;
  latitude: string;
  longitude: string;
  token: string;
}) => {
  const { operator_code, circle, domain, latitude, longitude, token } = options;
  return apiClient({
    endpoint: `/mobile-plans?operator_code=${operator_code}&circle=${circle}`,
    method: "GET",
    headers: {
      domain,
      latitude,
      longitude,
      Authorization: `Bearer ${token}`,
    },
  });
};

export const rechargeRequestApi = async (options: {
  domain: string;
  latitude: string;
  longitude: string;
  token: string;
  mobile: string;
  amount: number | string;
  operator_code: string | number;
}) => {
  return apiClient({
    endpoint: "/spm/recharge",
    method: "POST",
    headers: {
      domain: options.domain,
      latitude: options.latitude,
      longitude: options.longitude,
      Authorization: `Bearer ${options.token}`,
    },
    body: {
      mobile: options.mobile,
      amount: Number(options.amount), // Ensuring it's a number as per your payload
      operator_code: options.operator_code,
    },
  });
};