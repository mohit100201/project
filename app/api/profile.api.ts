import { apiClient } from "./api.client";


export const getProfileApi = async (options: {
  
  latitude: string;
  longitude: string;
  token: string; 
}) => {
  return apiClient({
    endpoint: "/profile",
    method: "GET",
    headers: {
    
      latitude: options.latitude,
      longitude: options.longitude,
      Authorization: `Bearer ${options.token}`, 
    },
  });
};


export const uploadProfilePhotoApi = async (options: {
 
  latitude: string;
  longitude: string;
  token: string;
  imageUri: string;
}) => {
  const formData = new FormData();

  const extension =
    options.imageUri.split(".").pop()?.toLowerCase() || "jpg";

  const mimeType =
    extension === "png"
      ? "image/png"
      : extension === "webp"
      ? "image/webp"
      : "image/jpeg";

  formData.append("photo", {
    uri: options.imageUri,
    name: `profile.${extension}`,
    type: mimeType,
  } as any);

  return apiClient({
    endpoint: "/profile/photo",
    method: "POST",
    body: formData,
    headers: {
      
      latitude: options.latitude,
      longitude: options.longitude,
      Authorization: `Bearer ${options.token}`,
    },
  });
};


type UpdateProfilePayload = {
  name: string;
  phone: string;
  city?: string;
  state?: string;
  address?: string;
};

export const updateProfileApi = async (options: {
 
  latitude: string;
  longitude: string;
  token: string;
  payload: UpdateProfilePayload;
}) => {
  return apiClient({
    endpoint: "/users/profile",
    method: "POST",
    body: options.payload,
    headers: {
      Authorization: `Bearer ${options.token}`,
      
      latitude: options.latitude,
      longitude: options.longitude,
    },
  });
};