import { apiClient } from "./api.client";

/**
 * Fetch Support Tickets
 * URL: https://api.pinepe.in/api/tickets?per_page=10&page=1
 * Method: GET
 */
export const getTicketsApi = async (options: {
  page: number;
  per_page: number;
  
  latitude: string;
  longitude: string;
  token: string;
}) => {
  return apiClient({
    // Using query parameters for pagination
    endpoint: `/tickets?per_page=${options.per_page}&page=${options.page}`,
    method: "GET",
    headers: {
      
      latitude: options.latitude,
      longitude: options.longitude,
      Authorization: `Bearer ${options.token}`,
    },
  });
};


export const createTicketApi = async (data: {
  subject: string;
  description: string;
  priority: string;
 
  latitude: string;
  longitude: string;
  token: string;
}) => {
  return apiClient({
    endpoint: "/tickets",
    method: "POST",
    headers: {
      
      latitude: data.latitude,
      longitude: data.longitude,
      Authorization: `Bearer ${data.token}`,
    },
    body: {
      subject: data.subject,
      description: data.description,
      priority: data.priority, // "low", "medium", or "high"
    },
  });
};