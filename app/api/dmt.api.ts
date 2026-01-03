import { apiClient } from "./api.client";

/**
 * API to fetch DMT Sender (Customer) details.
 * Used to verify if a mobile number is registered for money transfer.
 */
export const fetchDmtSenderApi = async (options: {
  token: string;
  latitude: string;
  longitude: string;
  pipe: string;        // e.g., "FINO" or "NSDL"
  customerId: string;  // The 10-digit mobile number
}) => {
  return apiClient({
    endpoint: "/bankit/dmt/fetch-sender",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: {
      pipe: options.pipe,
      customerId: options.customerId,
    },
  });
};


/**
 * API to Request OTP for DMT Sender Registration (eKYC).
 * This is called when the user clicks "Send OTP".
 */
export const requestSenderOtpApi = async (options: {
  token: string;
  latitude: string;
  longitude: string;
  payload: {
    uidNumber: string;    // 12 digit Aadhaar
    customerId: string;   // 10 digit Mobile
    name: string;         // Full Name
    pipe: string;         // e.g., "FINO"
    pidData: string;      // The XML string from Mantra/Morpho RD Service
    address: string;      // Full Address
    dateOfBirth: string;  // YYYY-MM-DD
  };
}) => {
  return apiClient({
    endpoint: "/bankit/dmt/sender-otp",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: options.payload,
  });
};


// export const fetchDmtRecipientsApi = async (options: {
//   token: string;
//   latitude: string;
//   longitude: string;
//   pipe: string;        // e.g., "9529911808" (as per your JSON example)
//   customerId: string;  // The 10-digit mobile number
//   search?: string;     // Optional search string
// }) => {
//   return apiClient({
//     endpoint: "/bankit/dmt/fetch-recipients",
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${options.token}`,
//       latitude: options.latitude,
//       longitude: options.longitude,
//     },
//     body: {
//       pipe: options.pipe,
//       customerId: options.customerId,
//       search: options.search || "",
//     },
//   });
// };