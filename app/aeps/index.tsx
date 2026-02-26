import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, NativeModules, TextInput, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { theme } from "@/theme";
import OnboardingForm from "./OnboardingForm";
import * as SecureStore from "expo-secure-store";
import { useBranding } from '@/context/BrandingContext';
import { Hourglass, ShieldCheck, ChevronRight, Building2, User, Mail, Phone, CreditCard, RefreshCw, X } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { getLatLong } from "@/utils/location";
import { getBankItKycStatusApi, Pipe } from "../../api/service.api";
import { useRouter } from "expo-router";
import { fetchOnboardDetails } from "@/api/aeps.api";

const { AepsModule } = NativeModules;

// Types for API responses
interface AepsResponse {
  statusCode?: string;
  message?: string;
  data?: any;
}

interface OnboardingStatus {
  NSDLOnboardingFlag: string;
  finoRegistrationFlag: string;
  icicionboardstatus: string;
  rnfi_onboarding_flag: string;
  paySp_onboarding_flag: string;
  finoonboardstatus: string;
  paysprint_Phy_Onboarding: string;
  yesonboardstatus: string;
  status: string;
}

interface TransactionResult {
  visible: boolean;
  statusCode: string;
  message: string;
  data: any;
  type: 'AEPS' | 'ICICI_EKYC' | 'NSDL';
}

// Onboarding Required Screen Component
const OnboardingRequiredScreen = ({ message, onRefresh }: { message: string, onRefresh: () => void }) => {
  return (
    <View style={styles.onboardingRequiredContainer}>
      <View style={styles.onboardingRequiredCard}>
        <Building2 size={60} color={theme.colors.primary[500]} />
        
        <Text style={styles.onboardingRequiredTitle}>Onboarding Incomplete</Text>
        
        <Text style={styles.onboardingRequiredMessage}>
          {message || "Your onboarding is not complete. Please complete your onboarding on the website to continue."}
        </Text>
        
        <View style={styles.onboardingRequiredInfoBox}>
          <Text style={styles.onboardingRequiredInfoText}>
            • Visit our website to complete your onboarding{'\n'}
            • Complete KYC verification{'\n'}
            • Submit required documents{'\n'}
            • Wait for approval (2-3 working days)
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.onboardingRequiredButton}
          onPress={onRefresh}
        >
          <RefreshCw size={20} color="#FFF" />
          <Text style={styles.onboardingRequiredButtonText}>Refresh Status</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState<boolean>(false);
  
  // Onboarding required state for 401/A0001 error
  const [onboardingRequired, setOnboardingRequired] = useState<boolean>(false);
  const [onboardingMessage, setOnboardingMessage] = useState<string>("");

  // Transaction result state
  const [transactionResult, setTransactionResult] = useState<TransactionResult>({
    visible: false,
    statusCode: '',
    message: '',
    data: null,
    type: 'AEPS'
  });

  useEffect(() => {
    fetchKycStatus();
  }, []);

  useEffect(() => {
    if (agentCode) {
      checkOnboardingStatus();
    }
  }, [agentCode]);

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
        console.log("status", res.data.status);

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
    if (!agentCode) return;

    try {
      setCheckingOnboarding(true);
      setOnboardingRequired(false); // Reset onboarding required state

      const res = await fetchOnboardDetails(
        agentCode,
        "RAMESHWAR LAL JAKHAR261123",
        "7ohd84b9oy"
      );

      console.log("API RESPONSE from bankit:", res);

      // Check if response contains error status A0001 (not onboarded)
      if (res?.status === "A0001") {
        setOnboardingRequired(true);
        setOnboardingMessage(res.message || "Agent is not onboarded with us.");
        setOnboardingStatus(null);
        Toast.show({
          type: "error",
          text1: "Onboarding Required",
          text2: res.message || "Please complete onboarding on website",
        });
        return;
      }

      // Check if response status is "00" (success)
      if (res?.status === "00") {
        setOnboardingStatus(res.data);
        Toast.show({
          type: "success",
          text1: "Onboarding Status",
          text2: `ICICI: ${res.data.icicionboardstatus === "1" ? "Onboarded" : "Pending"}, NSDL: ${res.data.NSDLOnboardingFlag === "1" ? "Onboarded" : "Pending"}`,
        });
      } else if (res && !res.data) {
        // Handle case where response exists but no data property
        console.log("Response without data property:", res);
        // If the response itself is the status object
        setOnboardingStatus(res);
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to check onboarding status",
          text2: "Invalid response format",
        });
      }

    } catch (error: any) {
      console.error('Failed to check onboarding status:', error);

      // Check if error contains 401 or A0001
      if (error?.status === 401 || 
          error?.statusCode === 401 || 
          error?.response?.status === 401 ||
          error?.message?.includes("A0001") || 
          error?.message?.includes("not onboarded")) {
        
        setOnboardingRequired(true);
        setOnboardingMessage("Agent is not onboarded with us. Please complete onboarding on website.");
        setOnboardingStatus(null);
        return;
      }

      // Check if error.response exists (Axios error)
      if (error.response && error.response.data) {
        console.log("Error response data:", error.response.data);
        if (error.response.data?.status === "A0001") {
          setOnboardingRequired(true);
          setOnboardingMessage(error.response.data.message || "Agent is not onboarded with us.");
          setOnboardingStatus(null);
          return;
        }
        setOnboardingStatus(error.response.data);
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to check onboarding status",
          text2: error?.message || "Network error",
        });
      }
    } finally {
      setCheckingOnboarding(false);
    }
  };

  // Check if user is eligible for transactions with ICICI pipe
  const isIciciEligibleForTransaction = (): boolean => {
    if (!onboardingStatus) return false;
    return onboardingStatus.icicionboardstatus === "1" &&
      onboardingStatus.rnfi_onboarding_flag === "1";
  };

  // Check if NSDL onboarding is needed
  const isNsdlOnboardingNeeded = (): boolean => {
    if (!onboardingStatus) return true; // If no status, assume needed
    return onboardingStatus.NSDLOnboardingFlag === "0";
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
      
      // Show transaction result
      setTransactionResult({
        visible: true,
        statusCode: parsed.statusCode || 'SUCCESS',
        message: parsed.message || 'ICICI EKYC completed',
        data: parsed.data || {},
        type: 'ICICI_EKYC'
      });

      // Clear form fields
      setMobileNumber("");
      setAadhaarNumber("");
      setEmailAddress("");
      setPanNumber("");

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
      
      // Show transaction result
      setTransactionResult({
        visible: true,
        statusCode: parsed.statusCode || 'SUCCESS',
        message: parsed.message || 'NSDL Onboarding launched',
        data: parsed.data || {},
        type: 'NSDL'
      });

      // Re-check onboarding status after NSDL onboarding
      await checkOnboardingStatus();

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
      
      // Show transaction result
      setTransactionResult({
        visible: true,
        statusCode: parsed.statusCode || '',
        message: parsed.message || '',
        data: parsed.data || {},
        type: 'AEPS'
      });

    } catch (error: any) {
      // LOG 3: Explicit Error logging
      console.error("AEPS SDK CRITICAL ERROR:", error);
      
      // Show error in transaction result
      setTransactionResult({
        visible: true,
        statusCode: 'ERROR',
        message: error?.message || 'Transaction failed',
        data: {},
        type: 'AEPS'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle ICICI pipe selection flow based on onboarding status
  const handleIciciFlow = () => {
    if (!onboardingStatus) {
      Alert.alert(
        "Checking Onboarding Status",
        "Please wait while we check your onboarding status.",
        [{ text: "OK" }]
      );
      return;
    }

    const iciciStatus = onboardingStatus.icicionboardstatus;
    const rnfiStatus = onboardingStatus.rnfi_onboarding_flag;

    if (iciciStatus === "1" && rnfiStatus === "1") {
      // Both pipes are onboarded - directly proceed to transaction
      startAepsTransaction();
    } else {
      // Need to complete EKYC first
      let message = "You need to complete ICICI EKYC first.";

      if (iciciStatus === "0") {
        message = "ICICI onboarding is pending. Please complete EKYC.";
      } else if (rnfiStatus === "0") {
        message = "RNFI onboarding is pending. Please complete EKYC.";
      }

      Alert.alert(
        "Onboarding Required",
        message,
        [
          { text: "Start EKYC", onPress: () => setSelectedPipe('ICICI') },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  // Handle NSDL pipe selection flow based on onboarding status
  const handleNsdlFlow = () => {
    if (!onboardingStatus) {
      Alert.alert(
        "Checking Onboarding Status",
        "Please wait while we check your onboarding status.",
        [{ text: "OK" }]
      );
      return;
    }

    const nsdlStatus = onboardingStatus.NSDLOnboardingFlag;

    if (nsdlStatus === "1") {
      // NSDL is onboarded - directly proceed to transaction
      startAepsTransaction();
    } else {
      // Need to complete NSDL onboarding first
      Alert.alert(
        "Onboarding Required",
        "NSDL onboarding is pending. Would you like to complete it now?",
        [
          { text: "Start NSDL Onboarding", onPress: startNsdlOnboarding },
          { text: "Cancel", style: "cancel" }
        ]
      );
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

    // Check if onboarding status is loading
    if (checkingOnboarding) {
      Toast.show({
        type: "info",
        text1: "Please wait",
        text2: "Checking onboarding status...",
      });
      return;
    }

    // Route based on selected pipe
    if (selectedPipe === 'ICICI') {
      handleIciciFlow();
    } else if (selectedPipe === 'NSDL') {
      handleNsdlFlow();
    } else {
      // For other pipes, directly start transaction
      startAepsTransaction();
    }
  };

  // Close transaction result modal
  const closeTransactionResult = () => {
    setTransactionResult(prev => ({ ...prev, visible: false }));
  };

  // Render transaction result modal
  const renderTransactionResult = () => {
    if (!transactionResult.visible) return null;

    const getTitle = () => {
      switch (transactionResult.type) {
        case 'AEPS': return 'AEPS Transaction Result';
        case 'ICICI_EKYC': return 'ICICI EKYC Result';
        case 'NSDL': return 'NSDL Onboarding Result';
        default: return 'Transaction Result';
      }
    };

    const getStatusColor = () => {
      if (transactionResult.statusCode === 'SUCCESS' || transactionResult.statusCode === '00') {
        return '#10B981';
      } else if (transactionResult.statusCode === 'ERROR' || transactionResult.statusCode?.startsWith('4')) {
        return '#EF4444';
      } else {
        return '#F59E0B';
      }
    };

    const renderDataFields = () => {
      const data = transactionResult.data;
      if (!data || Object.keys(data).length === 0) return null;

      return Object.entries(data).map(([key, value]) => {
        // Skip empty values
        if (!value) return null;
        
        // Format key for display
        const displayKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .replace(/_/g, ' ');
        
        return (
          <View key={key} style={styles.resultRow}>
            <Text style={styles.resultLabel}>{displayKey}:</Text>
            <Text style={styles.resultValue}>{String(value)}</Text>
          </View>
        );
      });
    };

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{getTitle()}</Text>
            <TouchableOpacity onPress={closeTransactionResult} style={styles.closeButton}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {transactionResult.statusCode || 'PENDING'}
            </Text>
          </View>

          {transactionResult.message ? (
            <Text style={styles.resultMessage}>{transactionResult.message}</Text>
          ) : null}

          <ScrollView style={styles.resultDataContainer}>
            {renderDataFields()}
          </ScrollView>

          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={closeTransactionResult}
          >
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render onboarding status info
  const renderOnboardingStatus = () => {
    if (!onboardingStatus || checkingOnboarding) {
      return (
        <View style={styles.statusInfoContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary[500]} />
          <Text style={styles.statusInfoText}>Checking onboarding status...</Text>
        </View>
      );
    }

    if (selectedPipe === 'ICICI') {
      const iciciStatus = onboardingStatus.icicionboardstatus;
      const rnfiStatus = onboardingStatus.rnfi_onboarding_flag;

      return (
        <View style={styles.statusInfoContainer}>
          <Text style={styles.statusInfoTitle}>ICICI Onboarding Status:</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>ICICI Bank:</Text>
            <Text style={[styles.statusValue, iciciStatus === "1" ? styles.statusSuccess : styles.statusPending]}>
              {iciciStatus === "1" ? "✓ Onboarded" : "✗ Pending"}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>RNFI:</Text>
            <Text style={[styles.statusValue, rnfiStatus === "1" ? styles.statusSuccess : styles.statusPending]}>
              {rnfiStatus === "1" ? "✓ Onboarded" : "✗ Pending"}
            </Text>
          </View>
          {iciciStatus === "1" && rnfiStatus === "1" && (
            <Text style={styles.statusReadyText}>✓ Ready for transactions</Text>
          )}
        </View>
      );
    }

    if (selectedPipe === 'NSDL') {
      const nsdlStatus = onboardingStatus.NSDLOnboardingFlag;

      return (
        <View style={styles.statusInfoContainer}>
          <Text style={styles.statusInfoTitle}>NSDL Onboarding Status:</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>NSDL:</Text>
            <Text style={[styles.statusValue, nsdlStatus === "1" ? styles.statusSuccess : styles.statusPending]}>
              {nsdlStatus === "1" ? "✓ Onboarded" : "✗ Pending"}
            </Text>
          </View>
          {nsdlStatus === "1" && (
            <Text style={styles.statusReadyText}>✓ Ready for transactions</Text>
          )}
        </View>
      );
    }

    return null;
  };

  // Render ICICI EKYC form
  const renderIciciForm = () => {
    if (selectedPipe !== 'ICICI') return null;

    // Don't show form if already onboarded
    if (onboardingStatus?.icicionboardstatus === "1" &&
      onboardingStatus?.rnfi_onboarding_flag === "1") {
      return null;
    }

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
          {submitting ? (
            <ActivityIndicator color={theme.colors.primary[700]} />
          ) : (
            <Text style={styles.secondaryBtnText}>Complete ICICI EKYC</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Render NSDL onboarding button
  const renderNsdlButton = () => {
    if (selectedPipe !== 'NSDL') return null;

    // Don't show button if already onboarded
    if (onboardingStatus?.NSDLOnboardingFlag === "1") {
      return null;
    }

    return (
      <TouchableOpacity
        style={[styles.secondaryBtn, submitting && styles.disabledBtn]}
        onPress={startNsdlOnboarding}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={theme.colors.primary[700]} />
        ) : (
          <Text style={styles.secondaryBtnText}>Complete NSDL Onboarding</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Render refresh button
  const renderRefreshButton = () => {
    return (
      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={checkOnboardingStatus}
        disabled={checkingOnboarding}
      >
        <RefreshCw size={16} color={theme.colors.primary[500]} />
        <Text style={styles.refreshBtnText}>Refresh Status</Text>
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

  // Show onboarding required screen if API returns A0001 or 401
  if (onboardingRequired) {
    return (
      <OnboardingRequiredScreen 
        message={onboardingMessage} 
        onRefresh={() => {
          setOnboardingRequired(false);
          checkOnboardingStatus();
        }} 
      />
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

            {/* Refresh Button */}
            {renderRefreshButton()}

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

            {/* Onboarding Status Display */}
            {renderOnboardingStatus()}

            {/* Conditional Forms based on selected pipe */}
            {renderIciciForm()}
            {renderNsdlButton()}

            {/* Main Action Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (submitting || !selectedPipe || checkingOnboarding) && styles.disabledBtn
              ]}
              onPress={launchAepsSdk}
              disabled={submitting || !selectedPipe || checkingOnboarding}
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

        {/* Transaction Result Modal */}
        {renderTransactionResult()}
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

  if (kycStatus === "Pending") {
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
  statusInfoText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#64748B',
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
  statusInfoContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusSuccess: {
    color: '#10B981',
  },
  statusPending: {
    color: '#F59E0B',
  },
  statusReadyText: {
    marginTop: 8,
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
    textAlign: 'center',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  refreshBtnText: {
    marginLeft: 4,
    fontSize: 12,
    color: theme.colors.primary[500],
    fontWeight: '600',
  },
  // Modal styles for transaction result
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 20,
  },
  resultDataContainer: {
    maxHeight: 300,
    marginVertical: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  resultLabel: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  resultValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    textAlign: 'right',
  },
  modalButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Onboarding required screen styles
  onboardingRequiredContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  onboardingRequiredCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  onboardingRequiredTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  onboardingRequiredMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  onboardingRequiredInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  onboardingRequiredInfoText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  onboardingRequiredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  onboardingRequiredButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});