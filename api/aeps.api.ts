import axios from "axios";
import { Buffer } from "buffer";

export const fetchOnboardDetails = async (
  agentId: string,
  developerId: string,
  password: string
) => {
  try {
    // ✅ Create Basic Auth token
    const authToken = Buffer.from(
      `${developerId}:${password}`
    ).toString("base64");

    const response = await axios.get(
      "https://services.bankit.in:8443/AEPSAPI/customer/onboarddetails",
      {
        headers: {
          Agent_id: agentId,
          Authorization: `Basic ${authToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );
   

    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data?.message || "API Error"
      );
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error(error.message || "Something went wrong");
    }
  }
};