import { apiClient } from "./api.client";

type GetWalletBalanceOptions = {
  domain: string;
  latitude: string;
  longitude: string;
  token: string;
};

export const getWalletBalanceApi = async (
  options: GetWalletBalanceOptions
) => {
  const { domain, latitude, longitude, token } = options;

  return apiClient({
    endpoint: "/wallet/balance",
    method: "GET",
    headers: {
      domain,
      latitude,
      longitude,
      Authorization: `Bearer ${token}`,
    },
  });
};
