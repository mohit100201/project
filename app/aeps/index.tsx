import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, NativeModules, TextInput, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { theme } from "@/theme";
import OnboardingForm from "./OnboardingForm";
import * as SecureStore from "expo-secure-store";
import { useBranding } from '@/context/BrandingContext';
import { Hourglass, ShieldCheck, ChevronRight, Building2, User, Mail, Phone, CreditCard } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { getLatLong } from "@/utils/location";
import { getBankItKycStatusApi, Pipe } from "../../api/service.api";
import { useRouter } from "expo-router";

const { AepsModule } = NativeModules;

// Types for API responses
interface AepsResponse {
  statusCode?: string;
  message?: string;
  data?: any;
}

export default function AepsScreen() {
  const router = useRouter();
  const [kycLoading, setKycLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [agentCode, setAgentCode] = useState<string>("");
  const [selectedPipe, setSelectedPipe] = useState<string>("");
  
  // ICICI EKYC fields
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [aadhaarNumber, setAadhaarNumber] = useState<string>("");
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [panNumber, setPanNumber] = useState<string>("");
  
  // Onboarding status state
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState<boolean>(false);

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const fetchKycStatus = async () => {
    try {
      setKycLoading(true);
      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");
      console.log("token", token);

      if (!token) return;

      const res = await getBankItKycStatusApi({
        latitude: location?.latitude || "0.0",
        longitude: location?.longitude || "0.0",
        token,
      });

      if (res.success) {
        setKycStatus(res.data.status);
        console.log("status",res.data.status)
        
        if (res.data.status === "Approved") {
          setAgentCode(res.data.agentCode || "");
          setPipes(res.data.pipes || []);
        } else {
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

  // Function to check onboarding status via API
  const checkOnboardingStatus = async () => {
    if (!agentCode || !selectedPipe) return;
    
    try {
      setCheckingOnboarding(true);
      
      // You'll need to implement this API call in your native module
      // For now, we'll assume it's available
      if (AepsModule.checkOnboardingStatus) {
        const response = await AepsModule.checkOnboardingStatus(
          agentCode,
          "RAMESHWAR LAL JAKHAR261123",
          "7ohd84b9oy"
        );
        
        const status = JSON.parse(response);
        setOnboardingStatus(status);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  // Case 1: ICICI EKYC (startActivityForResult with code 400)
  const startIciciEkyc = async () => {
    if (!mobileNumber || !aadhaarNumber || !emailAddress || !panNumber) {
      Toast.show({
        type: "info",
        text1: "Missing Information",
        text2: "Please fill all ICICI EKYC fields",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      Toast.show({
        type: "info",
        text1: "Starting ICICI EKYC",
        text2: "Please wait...",
      });

      const response = await AepsModule.startIciciEkyc(
        agentCode,
        "RAMESHWAR LAL JAKHAR261123",
        "7ohd84b9oy",
        mobileNumber,
        aadhaarNumber,
        emailAddress,
        panNumber
      );

      const parsed: AepsResponse = JSON.parse(response);
      
      Toast.show({
        type: "success",
        text1: "ICICI EKYC Completed",
        text2: parsed.message || "EKYC process completed",
      });

      // Re-check onboarding status after EKYC
      await checkOnboardingStatus();
      
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "ICICI EKYC Failed",
        text2: error?.message || "EKYC process failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Case 2: NSDL Onboarding (startActivity - no result expected)
  const startNsdlOnboarding = async () => {
    try {
      setSubmitting(true);
      
      Toast.show({
        type: "info",
        text1: "Starting NSDL Onboarding",
        text2: "Please wait...",
      });

      const response = await AepsModule.startNsdlOnboarding(
        agentCode,
        "RAMESHWAR LAL JAKHAR261123",
        "7ohd84b9oy"
      );

      const parsed: AepsResponse = JSON.parse(response);
      
      Toast.show({
        type: "success",
        text1: "NSDL Onboarding Launched",
        text2: parsed.message || "Onboarding screen opened",
      });
      
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "NSDL Onboarding Failed",
        text2: error?.message || "Failed to launch onboarding",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Case 3: AEPS Transaction (startActivityForResult with code 300)
 const startAepsTransaction = async () => {
    if (!selectedPipe) {
      Toast.show({ type: "info", text1: "Please select a pipe" });
      return;
    }

    try {
      setSubmitting(true);
      
      // Call the Native Module
      const response = await AepsModule.startAepsTransaction(
        agentCode,
        "RAMESHWAR LAL JAKHAR261123",
        "7ohd84b9oy",
        selectedPipe
      );

      // LOG 1: Raw string from Android/iOS Native side
      console.log("RAW AEPS SDK RESPONSE:", response);

      const parsed: AepsResponse = JSON.parse(response);

      // LOG 2: Parsed Object
      console.log("PARSED AEPS SDK DATA:", parsed);

      if (parsed.statusCode === "SUCCESS" || parsed.statusCode === "00") {
        Toast.show({
          type: "success",
          text1: "Transaction Successful",
          text2: `Amount: ₹${parsed.data?.transactionAmount || 'N/A'}`,
        });
      } else {
        // Log specifically when status isn't success but didn't throw an error
        console.warn("AEPS SDK returned non-success status:", parsed.statusCode);
      }

    } catch (error: any) {
      // LOG 3: Explicit Error logging
      console.error("AEPS SDK CRITICAL ERROR:", error);
      Toast.show({
        type: "error",
        text1: "Transaction Failed",
        text2: error?.message || "Transaction failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Main launch function that decides which flow to use based on selected pipe
  const launchAepsSdk = async () => {
    // Runtime check
    if (!AepsModule) {
      Toast.show({
        type: "error",
        text1: "AEPS Not Ready",
        text2: "Native AEPS module not available",
      });
      return;
    }

    if (!selectedPipe) {
      Toast.show({ type: "info", text1: "Please select a pipe" });
      return;
    }

    // Check if onboarding status is available
    if (selectedPipe === 'ICICI') {
      // For ICICI, we need to check onboarding status first
      // This would require an API call to check icicionboardstatus and rnfi_onboarding_flag
      Alert.alert(
        "ICICI Transaction",
        "Do you want to proceed with AEPS transaction or complete EKYC first?",
        [
          { text: "AEPS Transaction", onPress: startAepsTransaction },
          { text: "ICICI EKYC", onPress: startIciciEkyc },
          { text: "Cancel", style: "cancel" }
        ]
      );
    } else if (selectedPipe === 'NSDL') {
      // For NSDL, check if onboarding is needed
      Alert.alert(
        "NSDL Transaction",
        "Do you want to proceed with AEPS transaction or complete NSDL onboarding first?",
        [
          { text: "AEPS Transaction", onPress: startAepsTransaction },
          { text: "NSDL Onboarding", onPress: startNsdlOnboarding },
          { text: "Cancel", style: "cancel" }
        ]
      );
    } else {
      // For other pipes, directly start transaction
      startAepsTransaction();
    }
  };

  // Render ICICI EKYC form
  const renderIciciForm = () => {
    if (selectedPipe !== 'ICICI') return null;

    return (
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>ICICI EKYC Details</Text>
        
        <View style={styles.inputGroup}>
          <Phone size={20} color={theme.colors.primary[500]} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        <View style={styles.inputGroup}>
          <CreditCard size={20} color={theme.colors.primary[500]} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Aadhaar Number"
            value={aadhaarNumber}
            onChangeText={setAadhaarNumber}
            keyboardType="numeric"
            maxLength={12}
          />
        </View>

        <View style={styles.inputGroup}>
          <Mail size={20} color={theme.colors.primary[500]} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={emailAddress}
            onChangeText={setEmailAddress}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <User size={20} color={theme.colors.primary[500]} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="PAN Number"
            value={panNumber}
            onChangeText={setPanNumber}
            autoCapitalize="characters"
            maxLength={10}
          />
        </View>

        <TouchableOpacity
          style={[styles.secondaryBtn, submitting && styles.disabledBtn]}
          onPress={startIciciEkyc}
          disabled={submitting}
        >
          <Text style={styles.secondaryBtnText}>Complete ICICI EKYC</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render NSDL onboarding button
  const renderNsdlButton = () => {
    if (selectedPipe !== 'NSDL') return null;

    return (
      <TouchableOpacity
        style={[styles.secondaryBtn, submitting && styles.disabledBtn]}
        onPress={startNsdlOnboarding}
        disabled={submitting}
      >
        <Text style={styles.secondaryBtnText}>Complete NSDL Onboarding</Text>
      </TouchableOpacity>
    );
  };

  if (kycLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text style={styles.loadingText}>Checking KYC Status...</Text>
      </View>
    );
  }

  // Approved State
  if (kycStatus === "Approved") {
    return (
      <View style={styles.mainContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            <View style={styles.iconCircleApproved}>
              <ShieldCheck size={40} color={theme.colors.primary[500]} />
            </View>

            <Text style={styles.statusTitle}>Select Gateway Pipe</Text>
            <Text style={styles.statusDescription}>
              Choose an active gateway provider to proceed.
            </Text>

            {/* Pipe Grid */}
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

                    <View style={[
                      styles.radioOuter,
                      isSelected && { borderColor: theme.colors.primary[500] }
                    ]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Conditional Forms based on selected pipe */}
            {renderIciciForm()}
            {renderNsdlButton()}

            {/* Main Action Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (submitting || !selectedPipe) && styles.disabledBtn
              ]}
              onPress={launchAepsSdk}
              disabled={submitting || !selectedPipe}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.submitBtnText}>
                    {selectedPipe === 'ICICI' ? 'ICICI Transaction' : 
                     selectedPipe === 'NSDL' ? 'NSDL Transaction' : 
                     'Continue Transaction'}
                  </Text>
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

  // InProgress State
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

  if(kycStatus=="Pending"){
    return <OnboardingForm fetchKycStatus={fetchKycStatus} />
  }

  // Default: Show Onboarding Form
  return (
    <View style={styles.formContainer}>
      <OnboardingForm fetchKycStatus={fetchKycStatus} />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  contentContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  formContainer: {
    width: '100%',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.text.primary
  },
  iconCircleApproved: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  statusCard: {
    width: "100%",
    backgroundColor: "#F8F8F8",
    borderRadius: 24,
    padding: 32,
    alignItems: "center"
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24
  },
  statusBadge: {
    marginTop: 30,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center"
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
    marginRight: 8
  },
  statusBadgeText: {
    color: "#F59E0B",
    fontSize: 12,
    fontWeight: "700"
  },
  pipeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    position: 'relative',
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
  radioInner: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary[500]
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
  secondaryBtn: {
    width: '100%',
    backgroundColor: theme.colors.primary[100],
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary[300],
  },
  secondaryBtnText: {
    color: theme.colors.primary[700],
    fontSize: 14,
    fontWeight: '600',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'left',
    width: '100%',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 14,
    color: '#1E293B',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});