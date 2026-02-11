import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
  NativeModules,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as SecureStore from "expo-secure-store";
import DateTimePicker from "@react-native-community/datetimepicker";
import { theme } from "@/theme";
import {
  User,
  Smartphone,
  Calendar,
  Lock,
  Fingerprint,
  MapPin,
  ChevronRight,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { createSenderApi, requestSenderOtpApi } from "../../api/dmt.api";
import { getLatLong } from "@/utils/location";

// Asset Imports - Ensure these paths are correct for your project
const MANTRA_IMG = require("../../assets/images/Mantra.png");
const MORPHO_IMG = require("../../assets/images/Morpho.jpg");

interface FormInputs {
  uidNumber: string;
  customerId: string;
  name: string;
  pipe: string;
  address: string;
  dateOfBirth: string;
  otp: string;
}

interface SenderProp {
  setSenderResponse: (value: string) => void;
  errorCode?: string;
  initialMobile?: string;
  initialPipe?: string;
}

export default function SenderDetailsForm({
  setSenderResponse,
  errorCode,
  initialMobile,
  initialPipe,
}: SenderProp) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [biometricDevice, setBiometricDevice] = useState<"Mantra" | "Morpho">("Mantra");
  const [biometricData, setBiometricData] = useState<string | null>(null);
  const { MantraRD } = NativeModules;

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormInputs>({
    defaultValues: {
      name: "",
      customerId: initialMobile || "",
      uidNumber: "",
      pipe: initialPipe || "FINO",
      address: "",
      dateOfBirth: "",
      otp: "",
    },
  });

  const selectedPipe = watch("pipe");
  const dobValue = watch("dateOfBirth");
  const isDirectCreate = !isOtpStep && (errorCode === "V0003" || errorCode === "V0028");
  const [isScanning, setIsScanning] = useState(false);

  // Handle Date Selection
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setValue("dateOfBirth", formattedDate, { shouldValidate: true });
    }
  };

  const handleStartScan = async () => {
    if (biometricDevice !== "Mantra") {
      Toast.show({
        type: "info",
        text1: "Unsupported Device",
        text2: "Only Mantra is supported currently",
      });
      return;
    }

    try {
      setIsScanning(true);
      setBiometricData(null);

      if (!MantraRD) {
        Toast.show({
          type: "error",
          text1: "Device Error",
          text2: "Mantra RD Service not linked",
        });
        return;
      }

      Toast.show({
        type: "info",
        text1: "Place Finger on Scanner",
        text2: "Waiting for Mantra device...",
      });

      const pidXml: string = await MantraRD.captureFingerprint();

      if (!pidXml || !pidXml.includes("<PidData")) {
        Toast.show({
          type: "error",
          text1: "Scan Failed",
          text2: "Invalid biometric data received",
        });
        return;
      }

      setBiometricData(pidXml);

      Toast.show({
        type: "success",
        text1: "Fingerprint Captured",
        text2: "Biometric data received successfully",
      });

    } catch (error: any) {
      console.error("Mantra Scan Error:", error);

      Toast.show({
        type: "error",
        text1: "Scan Failed",
        text2: error?.message || "Fingerprint capture failed",
      });

    } finally {
      setIsScanning(false);
    }
  };



const onSubmit = async (data: FormInputs) => {
  if (!biometricData) {
    Toast.show({
      type: "error",
      text1: "Biometric Required",
      text2: "Please scan your finger before proceeding",
    });
    return;
  }

  setIsSubmitting(true);

  try {
    const location = await getLatLong();
    const token = await SecureStore.getItemAsync("userToken");

    if (!token) {
      Toast.show({
        type: "error",
        text1: "Session Expired",
        text2: "Please login again",
      });
      return;
    }

    // 🔹 STEP 1: SEND OTP
    if (!isOtpStep) {
      const payload = {
        uidNumber: data.uidNumber,
        customerId: data.customerId,
        name: data.name,
        pipe: data.pipe,
        pidData: biometricData,
        address: data.address,
        dateOfBirth: data.dateOfBirth,
      };

      const res = await requestSenderOtpApi({
        token,
        latitude: String(location?.latitude || "0.0"),
        longitude: String(location?.longitude || "0.0"),
        payload,
      });

      if (res.success || res.status === "Success") {
        setIsOtpStep(true);
        Toast.show({
          type: "success",
          text1: "OTP Sent",
          text2: "Please enter the OTP received on mobile",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "OTP Failed",
          text2: res.message || "Unable to send OTP",
        });
      }

      return;
    }

    // 🔹 STEP 2: VERIFY OTP & CREATE SENDER
    const createPayload = {
      uidNumber: data.uidNumber,
      customerId: data.customerId,
      name: data.name,
      pipe: data.pipe,
      pidData: biometricData,
      address: data.address,
      dateOfBirth: data.dateOfBirth,
      otp: data.otp,
    };

    const res = await createSenderApi({
      token,
      latitude: String(location?.latitude || "0.0"),
      longitude: String(location?.longitude || "0.0"),
      payload: createPayload,
    });

    if (res.success || res.status === "Success") {
      Toast.show({
        type: "success",
        text1: "Sender Created",
        text2: "Registration completed successfully",
      });

      // 🔥 IMPORTANT: inform parent to refresh sender
      setSenderResponse("00");
    } else {
      Toast.show({
        type: "error",
        text1: "Verification Failed",
        text2: res.message || "Invalid OTP",
      });
    }

  } catch (error: any) {
    Toast.show({
      type: "error",
      text1: "Network Error",
      text2: error.message || "Something went wrong",
    });
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {isOtpStep ? "Verify OTP" : "eKYC Registration"}
        </Text>
        <View style={styles.divider} />

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Full Name */}
          <InputLabel label="Full Name" icon={<User size={14} color="#64748B" />} />
          <Controller
            control={control}
            name="name"
            rules={{ required: "Name is required" }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Full Name as per Aadhaar"
              />
            )}
          />

          {/* Mobile */}
          <InputLabel label="Mobile" icon={<Smartphone size={14} color="#64748B" />} />
          <Controller
            control={control}
            name="customerId"
            render={({ field: { value } }) => (
              <TextInput style={[styles.input, styles.readOnly]} value={value} editable={false} />
            )}
          />

          {/* Date of Birth Trigger */}
          <InputLabel label="Date of Birth" icon={<Calendar size={14} color="#64748B" />} />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowDatePicker(true)}
            style={[styles.input, styles.datePickerContainer, errors.dateOfBirth && styles.inputError]}
          >
            <Text style={{ color: dobValue ? "#1E293B" : "#94A3B8" }}>
              {dobValue || "YYYY-MM-DD"}
            </Text>
            <Calendar size={18} color={theme.colors.primary[500]} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dobValue ? new Date(dobValue) : new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={onDateChange}
            />
          )}

          {/* Aadhaar Number */}
          <InputLabel label="Aadhaar Number" icon={<Lock size={14} color="#64748B" />} />
          <Controller
            control={control}
            name="uidNumber"
            rules={{ required: "Aadhaar is required", minLength: 12 }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.uidNumber && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="12 Digit Aadhaar Number"
                keyboardType="number-pad"
                maxLength={12}
              />
            )}
          />

          {/* Address */}
          <InputLabel label="Address" icon={<MapPin size={14} color="#64748B" />} />
          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={value}
                onChangeText={onChange}
                placeholder="Residential Address"
                multiline
                numberOfLines={3}
              />
            )}
          />

          {/* Biometric Device Selection */}
          {!isOtpStep && !isDirectCreate && (
            <View style={styles.biometricBox}>
              <Text style={styles.sectionLabel}>Select Device & Scan</Text>
              <View style={styles.deviceRow}>
                <TouchableOpacity
                  style={[styles.deviceBtn, biometricDevice === "Mantra" && styles.deviceBtnActive]}
                  onPress={() => setBiometricDevice("Mantra")}
                >
                  <Image source={MANTRA_IMG} style={styles.deviceIcon} resizeMode="contain" />
                  <Text style={[styles.deviceText, biometricDevice === "Mantra" && styles.deviceTextActive]}>Mantra</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deviceBtn, biometricDevice === "Morpho" && styles.deviceBtnActive]}
                  onPress={() => setBiometricDevice("Morpho")}
                >
                  <Image source={MORPHO_IMG} style={styles.deviceIcon} resizeMode="contain" />
                  <Text style={[styles.deviceText, biometricDevice === "Morpho" && styles.deviceTextActive]}>Morpho</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.scanBtn} onPress={handleStartScan}>
                <Fingerprint color="#FFF" size={20} />
                <Text style={styles.scanBtnText}>Start Fingerprint Scan</Text>
              </TouchableOpacity>
              {biometricData && <Text style={styles.scanSuccess}>Data Captured ✓</Text>}
            </View>
          )}

          {/* OTP Section */}
          {isOtpStep && (
            <View style={styles.otpSection}>
              <InputLabel label="Enter OTP" icon={<Smartphone size={14} color={theme.colors.primary[500]} />} />
              <Controller
                control={control}
                name="otp"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="number-pad"
                    maxLength={4}
                    placeholder="4 Digit OTP"
                  />
                )}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isOtpStep ? "Verify & Register" : isDirectCreate ? "Create Sender" : "Send OTP"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const InputLabel = ({ label, icon }: { label: string; icon: any }) => (
  <View style={styles.labelRow}>
    {icon}
    <Text style={styles.labelText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  title: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6, marginTop: 10 },
  labelText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  input: {
    height: 48,
    backgroundColor: "#FBFDFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#1E293B",
  },
  inputError: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 12,
  },
  readOnly: { backgroundColor: "#F1F5F9", color: "#94A3B8" },
  textArea: { height: 80, textAlignVertical: "top", paddingTop: 10 },
  biometricBox: { marginTop: 15, padding: 12, backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 10 },
  deviceRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  deviceBtn: {
    flex: 1,
    height: 75,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFF"
  },
  deviceBtnActive: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[500],
    borderWidth: 1.5,
  },
  deviceIcon: { width: 40, height: 40, marginBottom: 4 },
  deviceText: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  deviceTextActive: { color: theme.colors.primary[600] },
  scanBtn: { backgroundColor: "#334155", height: 45, borderRadius: 8, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  scanBtnText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  scanSuccess: { color: "#10B981", fontSize: 12, marginTop: 5, textAlign: "center", fontWeight: "600" },
  otpSection: { marginTop: 15, padding: 12, backgroundColor: "#F0F9FF", borderRadius: 10 },
  submitBtn: { backgroundColor: theme.colors.primary[500], height: 50, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 20, marginBottom: 10 },
  submitBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});