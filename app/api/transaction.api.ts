import { apiClient } from "./api.client";

type GetTransactionsOptions = {
  token: string;

  latitude: string;
  longitude: string;

  page?: number;
  perPage?: number;

  // 🔹 FILTERS (optional)
  transaction_type?: "credit" | "debit";
  from_date?: string; // YYYY-MM-DD
  to_date?: string;   // YYYY-MM-DD
  status?:string;
  search?:string;
};

export const getTransactionsApi = async (
  options: GetTransactionsOptions
) => {
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 10;

  // ✅ Build query params dynamically
  const params = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
  });

  if (options.transaction_type) {
    params.append("transaction_type", options.transaction_type);
  }

  if (options.from_date) {
    params.append("from_date", options.from_date);
  }

  if (options.to_date) {
    params.append("to_date", options.to_date);
  }

  if (options.status) {
    params.append("status", options.status);
  }

  if (options.search) {
    params.append("search", options.search);
  }

  return apiClient({
    endpoint: `/transactions?${params.toString()}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${options.token}`,
      
      latitude: options.latitude,
      longitude: options.longitude,
    },
  });
};
