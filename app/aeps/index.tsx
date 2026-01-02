import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { theme } from "@/theme";
import OnboardingForm from "./OnboardingForm";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Hourglass, ShieldCheck, ChevronRight } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { getLatLong } from "@/utils/location";
import { getBankItKycStatusApi, Pipe } from "../api/service.api"; // Ensure Pipe is exported from your service
import { apiClient } from "../api/api.client";
import { useRouter } from "expo-router";

export default function AepsScreen() {
  const router = useRouter();
  const [kycLoading, setKycLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [agentCode, setAgentCode] = useState("");
  const [selectedPipe, setSelectedPipe] = useState("");

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const fetchKycStatus = async () => {
    try {
      setKycLoading(true);
      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");
      const tenantData = Constants.expoConfig?.extra?.tenantData;
      const domainName = tenantData?.domain || "pinepe.in";

      if (!token) return;

      const res = await getBankItKycStatusApi({
        domain: domainName,
        latitude: location?.latitude || "0.0",
        longitude: location?.longitude || "0.0",
        token,
      });

      if (res.success) {
        setKycStatus(res.data.status);
        console.log("==status==", res)
        // Fix: Use Type Narrowing for Approved status
        if (res.data.status === "Approved") {
          setAgentCode(res.data.agentCode || "");
          setPipes(res.data.pipes || []);
        } else {
          // Reset data if status is not Approved
          setAgentCode("");
          setPipes([]);
        }
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to load KYC status" });
    } finally {
      setKycLoading(false);
    }
  };

  const handlePostToken = async () => {
    if (!selectedPipe) {
      Toast.show({ type: "info", text1: "Please select a pipe type" });
      return;
    }

    try {
      setSubmitting(true);
      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");

      const res = await apiClient({
        endpoint: "/bankit/kyc/token",
        method: "POST",
        body: { agentCode, pipe: selectedPipe },
        headers: {
          Authorization: `Bearer ${token}`,
          latitude: String(location?.latitude || "0.0"),
          longitude: String(location?.longitude || "0.0"),
        },
      });

      console.log("==resToken==",res)

      if (res.success && res.data.loginUrl) {
        router.push({
          pathname: "/aeps/WebView", // Matches your case-sensitive filename
          params: { url: res.data.loginUrl },
        });
      } else {
        Toast.show({ type: "error", text1: res.message || "Token generation failed" });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Connection Error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (kycLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text style={styles.loadingText}>Checking KYC Status...</Text>
      </View>
    );
  }

  // 1. Approved State: Show Select Pipe Card
  if (kycStatus === "Approved") {
    return (
      <View style={styles.container}>
        <View style={styles.approvedCard}>
          <View style={styles.iconCircleApproved}>
            <ShieldCheck size={40} color={theme.colors.primary[500]} />
          </View>
          <Text style={styles.statusTitle}>Select Pipe</Text>
          <Text style={styles.statusDescription}>Select your preferred gateway pipe to initiate AEPS transactions.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Pipe Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedPipe}
                onValueChange={(val) => setSelectedPipe(val)}
                dropdownIconColor="#FFF"
                mode="dropdown" // Explicitly set dropdown mode
                style={{ color: "#FFF", backgroundColor: "transparent" }} // Label color when closed
              >
                <Picker.Item
                  label="Select Pipe Type"
                  value=""
                  color="#94A3B8"
                />
                {pipes.map((pipe, index) => (
                  <Picker.Item
                    key={index}
                    label={`${pipe.value} ${!pipe.is_active ? "(Inactive)" : ""}`}
                    value={pipe.value}
                    enabled={pipe.is_active}
                    // Force color to black/dark for the dropdown list visibility
                    color={pipe.is_active ? "#000000" : "#A0AEC0"}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={handlePostToken}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.submitBtnText}>Submit</Text>
                <ChevronRight size={20} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.agentCodeText}>Agent Code: {agentCode}</Text>
      </View>
    );
  }

  // 2. InProgress State
  if (kycStatus === "InProgress") {
    return (
      <View style={styles.container}>
        <View style={styles.statusCard}>
          <View style={styles.iconCircle}>
            <Hourglass size={50} color={theme.colors.primary[500]} />
          </View>
          <Text style={styles.statusTitle}>KYC In Progress</Text>
          <Text style={styles.statusDescription}>
            Your verification is being processed. It usually takes <Text style={{ color: theme.colors.primary[500], fontWeight: 'bold' }}>2–3 working days.</Text>
          </Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusBadgeText}>Status: InProgress</Text>
          </View>
        </View>
      </View>
    );
  }

  // 3. Default: Pending, Not Found, or Rejected (Show Onboarding Form)
  return (
    <View style={styles.formContainer}>
      <OnboardingForm onSubmissionSuccess={fetchKycStatus} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', alignItems: "center", justifyContent: "center", padding: 20 },
  formContainer: { flex: 1, },
  loadingText: { marginTop: 10, color: theme.colors.text.primary },
  approvedCard: { width: "100%", backgroundColor: "#1E293B", borderRadius: 24, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)" },
  iconCircleApproved: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(79, 70, 229, 0.1)", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  inputGroup: { width: "100%", marginTop: 20, marginBottom: 25 },
  fieldLabel: { color: "#94A3B8", fontSize: 13, marginBottom: 8, fontWeight: "600", marginLeft: 4 },
  pickerContainer: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
    justifyContent: "center",
    height: 55, // Ensure consistent height
  },
  submitBtn: { width: "100%", backgroundColor: theme.colors.primary[500], paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  btnContent: { flexDirection: "row", alignItems: "center" },
  submitBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16, marginRight: 8 },
  statusCard: { width: "100%", backgroundColor: "#585a5eff", borderRadius: 24, padding: 32, alignItems: "center" },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(79, 70, 229, 0.1)", justifyContent: "center", alignItems: "center", marginBottom: 24 },
  statusTitle: { fontSize: 22, fontWeight: "800", color: "#FFFFFF", marginBottom: 12 },
  statusDescription: { fontSize: 14, color: "#94A3B8", textAlign: "center", lineHeight: 22 },
  statusBadge: { marginTop: 30, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: "rgba(245, 158, 11, 0.1)", borderRadius: 100, flexDirection: "row", alignItems: "center" },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#F59E0B", marginRight: 8 },
  statusBadgeText: { color: "#F59E0B", fontSize: 12, fontWeight: "700" },
  agentCodeText: { marginTop: 20, color: "#475569", fontSize: 12 },
});