// src/api/aeps.ts

import { Platform } from "react-native";



/**
 * Get AEPS onboarding details
 */
export const getAepsOnboardingDetails = async () => {
  const url =
    "https://services.bankit.in:8443/AEPSAPI/customer/onboarddetails";

  const agentId = "BC1400036753";
  const username = "TAPIR SECURITIES PRIVATE LIMITED261335";
  const password = "f72qv74ghq";

  // Basic Auth → base64(username:password)
  const base64Auth = btoa(`${username}:${password}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Agent_id: agentId,
        Authorization: `Basic ${base64Auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API Error ${response.status}: ${errorText || response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("AEPS onboarding API error:", error);
    throw error;
  }
};
