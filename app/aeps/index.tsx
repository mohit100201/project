import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { theme } from "@/theme";
import OnboardingForm from "./OnboardingForm";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Hourglass, ShieldCheck, ChevronRight, Building2 } from "lucide-react-native";
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

      console.log("==resToken==", res)

      if (res.success && res.data.loginUrl) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const targetUrl = res.data.loginUrl;

        router.push({
          pathname: "/aeps/WebView",
          params: {
            url: targetUrl,
            pipe: selectedPipe // Pass the bank name here for the header
          },
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
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            {/* Top Icon Section */}
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.colors.primary[50], // Very light hint of color
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <ShieldCheck size={40} color={theme.colors.primary[500]} />
            </View>

            <Text style={styles.statusTitle}>Select Gateway Pipe</Text>
            <Text style={styles.statusDescription}>
              Choose an active gateway provider to proceed.
            </Text>

            {/* GRID OF PIPE CARDS - COMPLETELY FLAT */}
            <View style={styles.pipeGrid}>
              {pipes.map((pipe, index) => {
                const isActive = pipe.is_active;
                const isSelected = selectedPipe === pipe.value;

                return (
                  <TouchableOpacity
                    key={index}
                    disabled={!isActive || submitting}
                    onPress={() => setSelectedPipe(pipe.value)}
                    style={[
                      styles.pipeCard,
                      isSelected && { borderColor: theme.colors.primary[500], borderWidth: 2 },
                      !isActive && { opacity: 0.4 }
                    ]}
                  >
                    {!isActive && (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>SOON</Text>
                      </View>
                    )}

                    <Building2
                      size={28}
                      color={!isActive ? "#94A3B8" : isSelected ? theme.colors.primary[500] : "#475569"}
                    />

                    <Text style={[
                      styles.pipeLabel,
                      isSelected && { color: theme.colors.primary[500], fontWeight: '800' }
                    ]}>
                      {pipe.value}
                    </Text>

                    {/* Minimal Radio indicator */}
                    <View style={[
                      styles.radioOuter,
                      isSelected && { borderColor: theme.colors.primary[500] }
                    ]}>
                      {isSelected && <View style={{
                        height: 8,
                        width: 8,
                        borderRadius: 4,
                        backgroundColor: theme.colors.primary[500]
                      }} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (submitting || !selectedPipe) && { opacity: 0.6, backgroundColor: "#CBD5E1" }
              ]}
              onPress={handlePostToken}
              disabled={submitting || !selectedPipe}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.submitBtnText}>Continue Transaction</Text>
                  <ChevronRight size={20} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.agentCodeText}>Agent Code: {agentCode}</Text>
          </View>
        </ScrollView>
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

  statusCard: { width: "100%", backgroundColor: "#585a5eff", borderRadius: 24, padding: 32, alignItems: "center" },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(79, 70, 229, 0.1)", justifyContent: "center", alignItems: "center", marginBottom: 24 },
  statusBadge: { marginTop: 30, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: "rgba(245, 158, 11, 0.1)", borderRadius: 100, flexDirection: "row", alignItems: "center" },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#F59E0B", marginRight: 8 },
  statusBadgeText: { color: "#F59E0B", fontSize: 12, fontWeight: "700" },


  disabledText: {
    color: '#94A3B8',
  },
  selectedText: {
    color: theme.colors.primary[700],
  },

  radioOuterSelected: {
    borderColor: theme.colors.primary[500],
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary[500],
  },
  pipeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF', // Force white
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0', // Very light grey border
    alignItems: 'center',
    position: 'relative',
    // No shadow to avoid dark outlines
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  comingSoonText: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '800',
  },
  pipeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginTop: 12,
    marginBottom: 10,
  },
  radioOuter: {
    height: 16,
    width: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  submitBtn: {
    width: '100%',
    backgroundColor: theme.colors.primary[500],
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentCodeText: {
    marginTop: 25,
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  pipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
});