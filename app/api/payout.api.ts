import { apiClient } from "./api.client";

export const getPaymentMethodsApi = async (options: {
  domain: string;
  latitude: string;
  longitude: string;
  token: string;
}) => {
  return apiClient({
    endpoint: "/payment-method",
    method: "GET",
    headers: {
      domain: options.domain,
      latitude: options.latitude,
      longitude: options.longitude,
      Authorization: `Bearer ${options.token}`,
    },
  });
};


export const getActiveRecipientsApi = async (options: {
  domain: string;
  latitude: string;
  longitude: string;
  token: string;
}) => {
  return apiClient({
    endpoint: "/recipients/active-list",
    method: "GET",
    headers: {
      domain: options.domain,
      latitude: options.latitude,
      longitude: options.longitude,
      Authorization: `Bearer ${options.token}`,
    },
  });
};

export const doPayoutTransferApi = async (options: {
  token: string;
  latitude: string;
  longitude: string;
 payload: {
    amount: number;         // Changed to number for "numeric" validation
    transferMode: string;   // IMPS, NEFT, RTGS, UPI
    bankName: string;
    bankAccount: string;
    ifsc: string;
    phone: string;
    name: string;
    email: string;
    remarks: string;
    recipient_id: string | number;
  };
}) => {
  return apiClient({
    endpoint: "/neokred/transfer",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: options.payload,
  });
};

export const getPayoutHistoryApi = async (options: {
  token: string;
  domain: string;
  latitude: string | number;
  longitude: string | number;
  params: {
    status?: string;
    start_date: string;
    end_date: string;
    page: number;
    per_page: number;
  };
}) => {
  // Construct query string
  const query = new URLSearchParams({
    status: options.params.status || "",
    start_date: options.params.start_date,
    end_date: options.params.end_date,
    page: options.params.page.toString(),
    per_page: options.params.per_page.toString(),
  }).toString();

  console.log("==query==",query);

  return apiClient({
    endpoint: `/payouts?${query}`,
    method: "GET",
    headers: {
      domain: options.domain,
      latitude: String(options.latitude),
      longitude: String(options.longitude),
      Authorization: `Bearer ${options.token}`,
    },
  });
};