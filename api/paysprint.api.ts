import { apiClient } from "./api.client";

export const fetchOnboardingStatus = async (options: {
  token: string;
  latitude: string;
  longitude: string;
  bank: string,

}) => {
  return apiClient({
    endpoint: "/paysprint/onboard-status",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: {
      bank: options.bank
    },
  });
};

export const paysprintOnboard = async (options: {
  token: string;
  latitude: string;
  longitude: string;
  mobile: string;
  aadhaar: string;
  email: string;
  dob: string;
  callback: string;
}) => {
  return apiClient({
    endpoint: "/paysprint/onboard",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: {
      mobile: options.mobile,
      aadhaar: options.aadhaar,
      email: options.email,
      dob: options.dob,
      callback: options.callback
    },
  });
};

export const paysprintEkyc = async (options: {
  token: string;
  latitude: string;
  longitude: string;
  bank: string,
  piddata: string;
  annual_income: string;
  nature_of_bussiness: string;
  accessmode:string;

}) => {
  return apiClient({
    endpoint: "/paysprint/activate-merchant",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: {
      bank: options.bank,
      piddata: options.piddata,
      annual_income: options.annual_income,
      nature_of_bussiness: options.nature_of_bussiness,
      accessmode: options.accessmode
    },
  });
};

export const paysprin2FA = async (options: {
  token: string;
  latitude: string;
  longitude: string;
  bank: string,
  piddata: string;
  accessmodetype: string;
  ipaddress: string;

}) => {
  return apiClient({
    endpoint: "/paysprint/aeps-auth",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: {
      bank: options.bank,
      piddata: options.piddata,
      accessmodetype: options.accessmodetype,
      ipaddress: options.ipaddress
    },
  });
};

export const paysprinBankList = async (options: {
  token: string;
  latitude: string;
  longitude: string;

}) => {
  return apiClient({
    endpoint: "/paysprint/aeps/bank-list",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: {

    },
  });
};

export const paysprintBalanceEnquiry = async (options: {
  token: string;
  latitude: string;
  longitude: string;
  bank: string,
  accessmodetype: string;
  piddata: string;
  ipaddress: string;
  mobilenumber: string;
  adhaarnumber: string;
  nationalbankidentificationnumber: string;

}) => {
  return apiClient({
    endpoint: "/paysprint/aeps/balance-enquiry",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: {
      bank: options.bank,
      piddata: options.piddata,
      accessmodetype: options.accessmodetype,
      ipaddress: options.ipaddress,
      mobilenumber: options.mobilenumber,
      adhaarnumber: options.adhaarnumber,
      nationalbankidentificationnumber: options.nationalbankidentificationnumber
    },
  });
};
export const paysprintCashWithdrawal = async (options: {
  token: string;
  latitude: string;
  longitude: string;
  bank: string,
  accessmodetype: string;
  piddata: string;
  amount: number;
  mobilenumber: string;
  adhaarnumber: string;
  nationalbankidentificationnumber: string;
  ipaddress: string;

}) => {
  return apiClient({
    endpoint: "/paysprint/aeps/cash-withdraw",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: {
      bank: options.bank,
      piddata: options.piddata,
      accessmodetype: options.accessmodetype,
      mobilenumber: options.mobilenumber,
      adhaarnumber: options.adhaarnumber,
      nationalbankidentificationnumber: options.nationalbankidentificationnumber,
      amount: options.amount,
      ipaddress: options.ipaddress,

    },
  });
};
export const paysprintMiniStatement = async (options: {
  token: string;
  latitude: string;
  longitude: string;
  bank: string,
  accessmodetype: string;
  piddata: string;
  mobilenumber: string;
  adhaarnumber: string;
  nationalbankidentificationnumber: string;
  ipaddress: string;

}) => {
  return apiClient({
    endpoint: "/paysprint/aeps/mini-statement",
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
      latitude: options.latitude,
      longitude: options.longitude,
    },
    body: {
      bank: options.bank,
      piddata: options.piddata,
      accessmodetype: options.accessmodetype,
      mobilenumber: options.mobilenumber,
      adhaarnumber: options.adhaarnumber,
      nationalbankidentificationnumber: options.nationalbankidentificationnumber,
      ipaddress: options.ipaddress,

    },
  });
};



