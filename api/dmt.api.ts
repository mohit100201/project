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

/**
 *
 * create sender after OTP verification
 */
export const createSenderApi = async (options: {
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
    otp: string;          // OTP received on mobile
  };
}) => {
  return apiClient({
    endpoint: "/bankit/dmt/create-sender",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: options.payload,
  });
};




export const fetchDmtRecipientsApi = async (options: {
  token: string;
  latitude: string;
  longitude: string;
  pipe: string;        // e.g., "9529911808" (as per your JSON example)
  customerId: string;  // The 10-digit mobile number
  search?: string;     // Optional search string
}) => {
  return apiClient({
    endpoint: "/bankit/dmt/fetch-recipients",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: {
      pipe: options.pipe,
      customerId: options.customerId,
      search: options.search || "",
    },
  });
};


export const getDmtTransactionOTP = async (options: {
  token: string;
  latitude: string;
  longitude: string;
  pipe: string;      
  amount: string;  
  name: string;  
  clientRefId:string;
  customerId:string;
  recipientId:string;

}) => {
  return apiClient({
    endpoint: "/bankit/dmt/dmt-transaction-otp",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: {
      pipe: options.pipe,
      customerId: options.customerId,
      amount: options.amount,
      name: options.name,
      clientRefId:options.clientRefId,
      recipientId:options.recipientId
    },
  });
};

export const transferDmtAmount = async (options: {
  token: string;
  latitude: string;
  longitude: string;
  pipe: string;
  otp: string;
  amount: string;
  customerId: string;
  recipientId: string;
  name: string;
  clientRefId: string;
}) => {
  return apiClient({
    endpoint: "/bankit/dmt/transfer",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: {
      pipe: options.pipe,
      otp: options.otp,
      amount: options.amount,
      customerId: options.customerId,
      recipientId: options.recipientId,
      name: options.name,
      clientRefId: options.clientRefId,
    },
  });
};


export const addRecipientApi = async (options: {
  token: string;
  latitude: string;
  longitude: string;
  recipientName: string;
  mobileNo: string;
  bankName: string; // This is the Bank Code (e.g., '1718')
  accountNo: string;
  ifsc: string;
  pipe: string;
  customerId: string;
}) => {
  return apiClient({
    endpoint: "/bankit/dmt/add-recipient",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: {
      recipientName: options.recipientName,
      mobileNo: options.mobileNo,
      bankName: options.bankName, 
      accountNo: options.accountNo,
      ifsc: options.ifsc,
      pipe: options.pipe,
      customerId: options.customerId,
    },
  });
};

export const deleteRecipientApi = async (options: {
  token: string;
  latitude: string;
  longitude: string;
  customerId: string;
  recipientId: string;
}) => {
  return apiClient({
    endpoint: "/bankit/dmt/delete-recipient",
    method: "POST", // Per your shared request details
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: {
      customerId: options.customerId,
      recipientId: options.recipientId,
    },
  });
};