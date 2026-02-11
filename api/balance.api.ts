import { apiClient } from "./api.client";

type GetWalletBalanceOptions = {
  latitude: string;
  longitude: string;
  token: string;
};

export const getWalletBalanceApi = async (
  options: GetWalletBalanceOptions
) => {
  const { latitude, longitude, token } = options;

  return apiClient({
    endpoint: "/wallet/balance",
    method: "GET",
    headers: {
     
      latitude,
      longitude,
      Authorization: `Bearer ${token}`,
    },
  });
};
