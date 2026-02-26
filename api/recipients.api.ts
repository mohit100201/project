import { apiClient } from "./api.client";

type GetRecipientsOptions = {
  token: string;
  latitude: string;
  longitude: string;
};

export const getRecipients= async (options: GetRecipientsOptions) => {


  return apiClient({
    endpoint: `/recipients`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
  });
};

// api/recipients.api.ts

export const createRecipient = async (token: string, data: any, location: any) => {
  return apiClient({
    endpoint: `/recipients`,
    method: "POST",
    body: data,
    headers: {
      Authorization: `Bearer ${token}`,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
    },
  });
};

export const uploadRecipientDocs = async (token: string, formData: FormData, location: any) => {
  return apiClient({
    endpoint: `/paysprint/payout/upload-document`,
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
    },
  });
};

export const getPaysprintBanks = async (token: string) => {
  return apiClient({
    endpoint: `/paysprint-banks`,
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
};