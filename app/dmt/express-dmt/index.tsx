import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/context/ThemeProvider";
import { 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  Building2, 
  IndianRupee, 
  Send 
} from "lucide-react-native";
import CustomDropdown from "@/components/ui/CustomDropdown";
import CustomInput from "@/components/ui/CustomInput";
import { getLatLong } from "@/utils/location";
import * as SecureStore from "expo-secure-store";
import { paysprinBankList } from "@/api/paysprint.api";
import Toast from "react-native-toast-message";
import { expressTransactionApi } from "@/api/dmt.api";

interface DropdownItem {
  label: string;
  value: string;
}

const ExpressDMT = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [bankOptions, setBankOptions] = useState<DropdownItem[]>([]);
  
  
  
  // Form States
  const [formData, setFormData] = useState({
    recipientName: "",
    phoneNumber: "",
    email: "",
    accountNumber: "",
    ifscCode: "",
    amount: "",
    selectedBankName: "",
  });

  // Error & Touched States
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData | 'transferMode' | 'bank', string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof typeof formData | 'transferMode' | 'bank', boolean>>>({});

  // Dropdown UI States
  const [modeOpen, setModeOpen] = useState(false);
  const [modeValue, setModeValue] = useState<string | null>(null);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankValue, setBankValue] = useState<string | null>(null);

  const [modes] = useState([
    { label: "IMPS", value: "imps" },
    { label: "NEFT", value: "neft" },
    { label: "RTGS", value: "rtgs" },
  ]);

  // ─── Validators ───────────────────────────────────────────────────────────

  const validateField = (field: string, value: any) => {
    let error = "";
    switch (field) {
      case "recipientName":
        if (!value.trim()) error = "Recipient name is required";
        break;
      case "phoneNumber":
        if (!/^[6-9]\d{9}$/.test(value)) error = "Enter valid 10-digit mobile number";
        break;
      case "email":
        if (!value.trim()) error = "Email address is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email format";
        break;
      case "accountNumber":
        if (!value || value.length < 9) error = "Enter valid account number";
        break;
      case "ifscCode":
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) error = "Enter valid IFSC (e.g. SBIN0001234)";
        break;
      case "amount":
        const amt = parseFloat(value);
        if (isNaN(amt) || amt <= 0) error = "Enter a valid amount";
        else if (amt > 50000) error = "Maximum limit is ₹50,000";
        break;
      case "transferMode":
        if (!value) error = "Please select transfer mode";
        break;
      case "bank":
        if (!value) error = "Please select a bank";
        break;
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) validateField(field, value);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'transferMode') validateField(field, modeValue);
    else if (field === 'bank') validateField(field, bankValue);
    else validateField(field, (formData as any)[field]);
  };

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const location = await getLatLong();
        const token = await SecureStore.getItemAsync("userToken");
        if (!location || !token) return;

        const res = await paysprinBankList({
          token,
          latitude: location.latitude,
          longitude: location.longitude,
        });

        if (res?.success) {
          const list = res.data.banklist.data.map((b: any) => ({
            label: b.bankName,
            value: b.iinno,
          }));
          setBankOptions(list);
        }
      } catch (error) {
        Toast.show({ type: "error", text1: "Bank List Error", text2: "Unable to fetch bank list" });
      }
    })();
  }, []);

 const handleTransfer = async () => {
    // 1. Run all validations
    const isNameValid = validateField("recipientName", formData.recipientName);
    const isPhoneValid = validateField("phoneNumber", formData.phoneNumber);
    const isEmailValid = validateField("email", formData.email);
    const isAccountValid = validateField("accountNumber", formData.accountNumber);
    const isIfscValid = validateField("ifscCode", formData.ifscCode);
    const isAmountValid = validateField("amount", formData.amount);
    const isModeValid = validateField("transferMode", modeValue);
    const isBankValid = validateField("bank", bankValue);

    // 2. Mark all fields as touched to trigger the red borders/error messages
    setTouched({
      recipientName: true,
      phoneNumber: true,
      email: true,
      accountNumber: true,
      ifscCode: true,
      amount: true,
      transferMode: true,
      bank: true,
    });

    // 3. Exit if any validation fails
    if (
      !isNameValid ||
      !isPhoneValid ||
      !isEmailValid ||
      !isAccountValid ||
      !isIfscValid ||
      !isAmountValid ||
      !isModeValid ||
      !isBankValid
    ) {
      Toast.show({
        type: "error",
        text1: "Validation Failed",
        text2: "Please correct the errors in red before proceeding",
      });
      return;
    }

    setLoading(true);

    try {
      // 4. Fetch necessary data (Location and Token)
      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");

      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Session expired, please login again",
        });
        return;
      }

      // 5. Call the Express Transaction API
      const res = await expressTransactionApi({
        token,
        latitude: String(location?.latitude || "0.0"),
        longitude: String(location?.longitude || "0.0"),
        transferMode: modeValue!, // 'imps', 'neft', or 'rtgs'
        name: formData.recipientName,
        phone: formData.phoneNumber,
        email: formData.email,
        bank_account: formData.accountNumber,
        ifsc: formData.ifscCode,
        amount: parseFloat(formData.amount),
        bank_name: formData.selectedBankName,
      });

      // 6. Handle Success/Failure
      if (res?.success) {
        Toast.show({
          type: "success",
          text1: "Transfer Success",
          text2: res.message || "Your transaction has been initiated.",
        });

        // Optional: Reset form after successful transfer
        setFormData({
          recipientName: "",
          phoneNumber: "",
          email: "",
          accountNumber: "",
          ifscCode: "",
          amount: "",
          selectedBankName: "",
        });
        setModeValue(null);
        setBankValue(null);
        setTouched({});
        setErrors({});
      } else {
        Toast.show({
          type: "error",
          text1: "Transaction Failed",
          text2: res?.message || "Internal server error",
        });
      }
    } catch (error: any) {
      console.error("Transfer Error:", error);
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: error?.message || "Unable to reach the server",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
    >
      <ScrollView 
        style={{ flex: 1, backgroundColor: theme.colors.background.main }} 
        contentContainerStyle={{ paddingBottom: 40 }}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginHorizontal: 16, marginTop: 16 }}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>Express Money Transfer</Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Transfer funds via IMPS or RTGS.</Text>

          <View style={styles.card}>
            <CustomInput
              label="Recipient Name"
              placeholder="Enter full name"
              iconStart={User}
              value={formData.recipientName}
              onChangeText={(val) => handleInputChange("recipientName", val)}
              onBlur={() => handleBlur("recipientName")}
              error={touched.recipientName ? errors.recipientName : undefined}
            />

            <CustomInput
              label="Phone Number"
              placeholder="10-digit mobile number"
              iconStart={Phone}
              keyboardType="number-pad"
              maxLength={10}
              value={formData.phoneNumber}
              onChangeText={(val) => handleInputChange("phoneNumber", val)}
              onBlur={() => handleBlur("phoneNumber")}
              error={touched.phoneNumber ? errors.phoneNumber : undefined}
            />

            <CustomInput
              label="Email Address"
              placeholder="example@mail.com"
              iconStart={Mail}
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(val) => handleInputChange("email", val)}
              onBlur={() => handleBlur("email")}
              error={touched.email ? errors.email : undefined}
            />

            <View style={{ zIndex: 3000 }}>
              <CustomDropdown
                label="Transfer Mode"
                open={modeOpen}
                value={modeValue}
                items={modes}
                setOpen={setModeOpen}
                setValue={setModeValue}
                placeholder="Select Mode"
                onClose={() => handleBlur("transferMode")}
                error={touched.transferMode ? errors.transferMode : undefined}
              />
            </View>

            <View style={{ zIndex: 2000 }}>
              <CustomDropdown
                label="Select Bank"
                open={bankOpen}
                value={bankValue}
                items={bankOptions}
                listMode='MODAL'
                setOpen={setBankOpen}
                setValue={(callback: any) => {
                    const val = callback(bankValue);
                    setBankValue(val);
                    const selected = bankOptions.find(b => b.value === val);
                    if(selected) handleInputChange("selectedBankName", selected.label);
                    handleBlur("bank");
                }}
                placeholder="Choose recipient bank"
                searchable={true}
                loading={bankOptions.length === 0}
                error={touched.bank ? errors.bank : undefined}
              />
            </View>

            <CustomInput
              label="Account Number"
              placeholder="Enter account number"
              iconStart={CreditCard}
              keyboardType="number-pad"
              value={formData.accountNumber}
              onChangeText={(val) => handleInputChange("accountNumber", val)}
              onBlur={() => handleBlur("accountNumber")}
              error={touched.accountNumber ? errors.accountNumber : undefined}
            />

            <CustomInput
              label="IFSC Code"
              placeholder="SBIN0001234"
              iconStart={Building2}
              autoCapitalize="characters"
              value={formData.ifscCode}
              onChangeText={(val) => handleInputChange("ifscCode", val.toUpperCase())}
              onBlur={() => handleBlur("ifscCode")}
              error={touched.ifscCode ? errors.ifscCode : undefined}
            />

            <CustomInput
              label="Amount (₹)"
              placeholder="0.00"
              iconStart={IndianRupee}
              keyboardType="decimal-pad"
              value={formData.amount}
              onChangeText={(val) => handleInputChange("amount", val)}
              onBlur={() => handleBlur("amount")}
              error={touched.amount ? errors.amount : undefined}
            />

            <TouchableOpacity 
              style={[
                styles.submitBtn, 
                { backgroundColor: theme.colors.primary[500] },
                loading && { opacity: 0.7 }
              ]}
              onPress={handleTransfer}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Send size={20} color="#FFF" />
                  <Text style={styles.submitBtnText}>Transfer Money Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    elevation: 3,
  },
  submitBtn: {
    height: 55,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 10,
  },
  submitBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});

export default ExpressDMT;