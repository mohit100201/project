import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { theme } from "@/theme";
import { User, Smartphone, Search, RefreshCcw } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { getLatLong } from "@/utils/location";
import { fetchDmtSenderApi } from "../../api/dmt.api";
import SenderDetailsForm from "./SenderDetailsForm";
import ManageRecipients from "./ManageRecipients";

export default function DMTScreen() {
  const [selectedPipe, setSelectedPipe] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [loading, setLoading] = useState(false);

  // Track the API response to handle conditional UI
  const [senderResponse, setSenderResponse] = useState<{ errorCode: string | null }>({
    errorCode: null,
  });

  const pipes = [
    { value: "ICICI", label: "ICICI", disabled: true },
    { value: "FINO", label: "FINO", disabled: false },
    { value: "YES", label: "YES Bank", disabled: true },
    { value: "NSDL", label: "NSDL", disabled: false },
  ];

  const handleFetchSender = async () => {
    // 1. Validation
    if (!selectedPipe) {
      Toast.show({ type: "info", text1: "Please select a pipe" });
      return;
    }
    if (customerNumber.length !== 10) {
      Toast.show({ type: "info", text1: "Enter a valid 10-digit mobile number" });
      return;
    }

    try {
      setLoading(true);
      // Reset previous response before new search
      setSenderResponse({ errorCode: null });

      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");

      if (!token) {
        Toast.show({ type: "error", text1: "Session expired, please login again" });
        return;
      }

      const res = await fetchDmtSenderApi({
        token,
        latitude: String(location?.latitude || "0.0"),
        longitude: String(location?.longitude || "0.0"),
        pipe: selectedPipe,
        customerId: customerNumber,
      });

     

      if (res.success) {
        const code = res.data?.raw?.errorCode;
        setSenderResponse({ errorCode: code });

        if (code === "00") {
          Toast.show({ type: "success", text1: "Sender Verified" });
        } else if (code === "V0002") {
          Toast.show({
            type: "info",
            text1: "Registration Required",
            text2: "This mobile number is not registered.",
          });
        }
      } else {
        Toast.show({ type: "error", text1: res.message || "Connection failed" });
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message || "An unexpected error occurred";
      Toast.show({ type: "error", text1: "Error", text2: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSenderResponse({ errorCode: null });
    setCustomerNumber("");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* 1. SENDER SEARCH CARD (Always Visible) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <User size={20} color={theme.colors.primary[500]} />
          <Text style={styles.cardTitle}>Sender Details</Text>
        </View>
        <View style={styles.divider} />

        {/* PIPE PICKER */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Gateway Pipe</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={selectedPipe}
              onValueChange={(itemValue) => setSelectedPipe(itemValue)}
              style={styles.nativePicker}
              dropdownIconColor={theme.colors.primary[500]}
              enabled={!loading}
            >
              <Picker.Item label="Choose a provider" value="" color="#94A3B8" />
              {pipes.map((pipe) => (
                <Picker.Item
                  key={pipe.value}
                  label={pipe.label}
                  value={pipe.value}
                  enabled={!pipe.disabled}
                  color={pipe.disabled ? "#CBD5E1" : "#1E293B"}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* MOBILE NUMBER INPUT */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Customer Mobile Number</Text>
          <View style={styles.inputWrapper}>
            <Smartphone size={18} color="#64748B" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              placeholder="Enter 10 digit number"
              keyboardType="number-pad"
              maxLength={10}
              value={customerNumber}
              onChangeText={setCustomerNumber}
              editable={!loading}
            />
          </View>
        </View>

        {/* SEARCH BUTTON */}
        <TouchableOpacity
          style={[styles.fetchBtn, (loading || !customerNumber) && { opacity: 0.6 }]}
          onPress={handleFetchSender}
          disabled={loading || !customerNumber || !selectedPipe}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Search size={20} color="#FFF" />
              <Text style={styles.fetchBtnText}>Fetch Sender Details</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 2. REGISTRATION FORM (Conditional Rendering - Shows BELOW Search Card) */}
      {(senderResponse.errorCode === "V0002" ||
        senderResponse.errorCode === "V0003" ||
        senderResponse.errorCode === "V0028") && (
        <View style={styles.formContainer}>
          <SenderDetailsForm
            initialMobile={customerNumber}
            initialPipe={selectedPipe}
            errorCode={senderResponse.errorCode}
            setSenderResponse={(value) =>
              setSenderResponse((prev) => ({
                ...prev,
                errorCode: value,
              }))
            }
          />

         
        </View>
      )}

      {/* 3. SUCCESS STATE PLACEHOLDER */}
      {senderResponse.errorCode === "00" && <ManageRecipients customerNumber={customerNumber} selectedPipe={selectedPipe}/>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#334155" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#64748B", marginBottom: 8, marginLeft: 4 },
  pickerBox: {
    backgroundColor: "#FBFDFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    justifyContent: "center",
  },
  nativePicker: { height: 55, width: "100%" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 55,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: "#FBFDFF",
  },
  input: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1E293B" },
  fetchBtn: {
    backgroundColor: theme.colors.primary[500],
    height: 55,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  fetchBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  formContainer: { marginTop: 20 },
  resetLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    gap: 6,
    padding: 10,
  },
  resetText: { color: theme.colors.primary[500], fontWeight: "600", fontSize: 14 },
  successPlaceholder: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    alignItems: "center",
  },
  successText: { color: "#166534", fontWeight: "600" },
});