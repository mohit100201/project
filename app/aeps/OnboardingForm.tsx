import { AnimatedCard } from "@/components/animated/AnimatedCard";
import CustomDropdownPicker2 from "@/components/ui/AppDropdown";
import CustomDatePicker from "@/components/ui/CustomDatePicker";
import CustomInput from "@/components/ui/CustomInput";
import { theme } from "@/theme";
import { CheckCircle2, CreditCard, Fingerprint, Mail, MapPin, Phone, User, Briefcase, FileText, UploadCloud } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { city } from "../../utils/data";
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { apiClient } from '../../api/api.client';
import { getLatLong } from '@/utils/location';

type OnboardingFormProp = {
  fetchKycStatus: () => void;
};

interface AddressSchema {
  street: string;
  state: string;
  city: string;
  pincode: string;
}

interface OnboardingFormSchema {
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  dob: string;
  gender: string;
  pan_no: string;
  aadhar_no: string;
  bank_name: string;
  account_holder_name: string;
  account_no: string;
  ifsc_code: string;
  address1: AddressSchema;
  address2: AddressSchema;
  address3: AddressSchema;
  aadhar_front?: any;
  aadhar_back?: any;
  pan_card?: any;
  bank_document?: any;
}

type FlatTouchedKeys =
  | "full_name" | "first_name" | "last_name" | "email" | "mobile"
  | "dob" | "gender" | "pan_no" | "aadhar_no"
  | "bank_name" | "account_holder_name" | "account_no" | "ifsc_code"
  | "address1_street" | "address1_city" | "address1_state" | "address1_pincode"
  | "address2_street" | "address2_city" | "address2_state" | "address2_pincode"
  | "address3_street" | "address3_city" | "address3_state" | "address3_pincode" |
  "aadhar_front" | "aadhar_back" | "pan_card" | "bank_document";

type FlatErrorKeys = FlatTouchedKeys;

// Normalize city data for consistent access
const normalizedCityData = (() => {
  const data: Record<string, string[]> = {};
  Object.entries(city).forEach(([stateName, cities]) => {
    data[stateName.trim()] = cities;
  });
  return data;
})();

const STATE_OPTIONS = Object.keys(normalizedCityData)
  .sort()
  .map((stateName) => ({ label: stateName, value: stateName }));

const getCityOptions = (selectedState: string) => {
  if (!selectedState) return [];
  const cities = normalizedCityData[selectedState];
  if (!cities || !Array.isArray(cities)) return [];
  return cities.sort().map((c: string) => ({ label: c, value: c }));
};

type AddressSectionProps = {
  num: 1 | 2 | 3;
  form: OnboardingFormSchema;
  errors: Partial<Record<FlatErrorKeys, string>>;
  touched: Record<FlatTouchedKeys, boolean>;
  updateAddress: (
    addressNum: 1 | 2 | 3,
    field: keyof AddressSchema,
    value: string
  ) => void;
  handleBlur: (field: FlatTouchedKeys) => void;
  validateAddressField: (
    addressNum: 1 | 2 | 3,
    field: "street" | "city" | "state" | "pincode"
  ) => void;
  handleStateChange: (num: 1 | 2 | 3, value: string | null) => void;
  onCopyPrimary?: (targetNum: 2 | 3) => void; // Add this line
};

const AddressSection = React.memo(
  ({
    num,
    form,
    errors,
    touched,
    updateAddress,
    handleBlur,
    validateAddressField,
    handleStateChange,
    onCopyPrimary, // Add this line
  }: AddressSectionProps) => {
    const address = form[`address${num}` as keyof OnboardingFormSchema] as AddressSchema;

    return (
      <View style={{ marginBottom: 20 }}>
        {/* Header Row for Section Label and Copy Button */}
        <View style={styles.sectionRow}>
          <Text style={styles.internalLabel}>Address {num}</Text>
          {num > 1 && onCopyPrimary && (
            <TouchableOpacity
              onPress={() => onCopyPrimary(num as 2 | 3)}
              style={styles.copyBtn}
            >
              <CheckCircle2 size={12} color={theme.colors.primary[500]} />
              <Text style={styles.copyBtnText}>Same as Primary</Text>
            </TouchableOpacity>
          )}
        </View>

        <CustomInput
          label="Street / House No."
          value={address.street}
          onChangeText={(text) => updateAddress(num, "street", text)}
          onBlur={() => {
            handleBlur(`address${num}_street`);
            validateAddressField(num, "street");
          }}
          error={touched[`address${num}_street`] ? errors[`address${num}_street`] : undefined}
          iconStart={MapPin}
        />

        {/* ... rest of the inputs (State, City, Pincode) remain the same */}
        <CustomDropdownPicker2
          label="State"
          items={STATE_OPTIONS}
          value={address.state || null}
          onValueChange={(val) => handleStateChange(num, val)}
          error={touched[`address${num}_state`] ? errors[`address${num}_state`] : undefined}
          listMode="MODAL"
        />

        <CustomDropdownPicker2
          key={`city-${num}-${address.state}`}
          label="City"
          items={getCityOptions(address.state)}
          value={address.city || null}
          disabled={!address.state}
          onValueChange={(val) => {
            if (val) updateAddress(num, "city", val);
          }}
          error={touched[`address${num}_city`] ? errors[`address${num}_city`] : undefined}
          listMode="MODAL"
        />

        <CustomInput
          label="Pincode"
          value={address.pincode}
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={(text) => updateAddress(num, "pincode", text.replace(/[^0-9]/g, ""))}
          onBlur={() => {
            handleBlur(`address${num}_pincode`);
            validateAddressField(num, "pincode");
          }}
          error={touched[`address${num}_pincode`] ? errors[`address${num}_pincode`] : undefined}
          iconStart={MapPin}
        />
      </View>
    );
  }
);


// Upload Button Component
const UploadBtn = ({ label, fileData, onPress, error }: any) => {
  const isUploaded = !!(fileData && fileData?.uri);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.uploadBox, isUploaded && styles.uploadSuccessBox]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {isUploaded ? (
          <CheckCircle2 size={18} color="#27AE60" />
        ) : (
          <UploadCloud size={18} color={theme.colors.primary[500]} />
        )}
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{
            color: isUploaded ? '#27AE60' : theme.colors.primary[500],
            fontWeight: 'bold',
            fontSize: 13
          }}>
            {isUploaded ? "Attached" : "Upload Image"}
          </Text>

        </View>
      </TouchableOpacity>
      {error && <Text style={styles.err}>{error}</Text>}
    </View>
  );
};

const OnboardingForm = ({ fetchKycStatus }: OnboardingFormProp) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<OnboardingFormSchema>({
    full_name: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    dob: "",
    gender: "",
    pan_no: "",
    aadhar_no: "",
    bank_name: "",
    account_holder_name: "",
    account_no: "",
    ifsc_code: "",
    address1: { state: "", city: "", pincode: "", street: "" },
    address2: { state: "", city: "", pincode: "", street: "" },
    address3: { state: "", city: "", pincode: "", street: "" },
  });

  const [errors, setErrors] = useState<Partial<Record<FlatErrorKeys, string>>>({});
  const [touched, setTouched] = useState<Record<FlatTouchedKeys, boolean>>({
    full_name: false, first_name: false, last_name: false, email: false, mobile: false,
    dob: false, gender: false, pan_no: false, aadhar_no: false,
    bank_name: false, account_holder_name: false, account_no: false, ifsc_code: false,
    address1_street: false, address1_city: false, address1_state: false, address1_pincode: false,
    address2_street: false, address2_city: false, address2_state: false, address2_pincode: false,
    address3_street: false, address3_city: false, address3_state: false, address3_pincode: false,
    aadhar_front: false, aadhar_back: false, pan_card: false, bank_document: false,
  });

  // ─── Validators ───────────────────────────────────────────────────────────

  const validatePersonalField = (field: keyof OnboardingFormSchema) => {
    let errorMessage = "";

    switch (field) {
      case "full_name":
        if (!form.full_name.trim()) errorMessage = "Full name is required";
        break;
      case "first_name":
        if (!form.first_name.trim()) errorMessage = "First name is required";
        break;
      case "last_name":
        if (!form.last_name.trim()) errorMessage = "Last name is required";
        break;
      case "email":
        if (!form.email.trim()) errorMessage = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
          errorMessage = "Enter a valid email address";
        break;
      case "mobile":
        if (!form.mobile.trim()) errorMessage = "Mobile number is required";
        else if (!/^[6-9]\d{9}$/.test(form.mobile))
          errorMessage = "Enter valid 10-digit mobile number starting with 6-9";
        break;
      case "dob":
        if (!form.dob) errorMessage = "Date of birth is required";

        break;
      case "gender":
        if (!form.gender) errorMessage = "Please select a gender";
        break;
      case "pan_no":
        if (!form.pan_no.trim()) errorMessage = "PAN number is required";
        else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan_no))
          errorMessage = "Enter a valid PAN number (e.g., ABCDE1234F)";
        break;
      case "aadhar_no":
        if (!form.aadhar_no.trim()) errorMessage = "Aadhaar number is required";
        else if (!/^\d{12}$/.test(form.aadhar_no))
          errorMessage = "Enter valid 12-digit Aadhaar number";
        break;
      case "bank_name":
        if (!form.bank_name.trim()) errorMessage = "Bank name is required";
        break;
      case "account_holder_name":
        if (!form.account_holder_name.trim()) errorMessage = "Account holder name is required";
        break;
      case "account_no":
        if (!form.account_no.trim()) errorMessage = "Account number is required";
        else if (!/^\d{9,18}$/.test(form.account_no))
          errorMessage = "Enter a valid account number";
        break;
      case "ifsc_code":
        if (!form.ifsc_code.trim()) errorMessage = "IFSC code is required";
        else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc_code))
          errorMessage = "Enter a valid IFSC code";
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: errorMessage }));
    return !errorMessage;
  };

  const validateAddressField = (
    addressNum: 1 | 2 | 3,
    field: "street" | "city" | "state" | "pincode"
  ) => {
    const addressKey = `address${addressNum}` as keyof OnboardingFormSchema;
    const address = form[addressKey] as AddressSchema;
    const errorKey = `address${addressNum}_${field}` as FlatErrorKeys;
    let errorMessage = "";

    switch (field) {
      case "street":
        if (!address.street.trim()) errorMessage = "Street address is required";
        break;
      case "city":
        if (!address.city) errorMessage = "Please select a city";
        break;
      case "state":
        if (!address.state) errorMessage = "Please select a state";
        break;
      case "pincode":
        if (!address.pincode.trim()) errorMessage = "Pincode is required";
        else if (!/^\d{6}$/.test(address.pincode))
          errorMessage = "Enter valid 6-digit pincode";
        break;
    }

    setErrors((prev) => ({ ...prev, [errorKey]: errorMessage }));
    return !errorMessage;
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const update = (key: keyof OnboardingFormSchema, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as FlatErrorKeys]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const updateAddress = (addressNum: 1 | 2 | 3, field: keyof AddressSchema, value: string) => {
    const addressKey = `address${addressNum}` as keyof OnboardingFormSchema;
    setForm((prev) => ({
      ...prev,
      [addressKey]: { ...(prev[addressKey] as AddressSchema), [field]: value }
    }));

    const errorKey = `address${addressNum}_${field}` as FlatErrorKeys;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const handleBlur = (field: FlatTouchedKeys) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleStateChange = (addressNum: 1 | 2 | 3, value: string | null) => {
    if (value) {
      const addressKey = `address${addressNum}` as keyof OnboardingFormSchema;
      setForm((prev) => ({
        ...prev,
        [addressKey]: {
          ...(prev[addressKey] as AddressSchema),
          state: value,
          city: "",
        },
      }));

      const stateErrorKey = `address${addressNum}_state` as FlatErrorKeys;
      const cityErrorKey = `address${addressNum}_city` as FlatErrorKeys;

      setTouched((prev) => ({ ...prev, [stateErrorKey]: true }));
      setErrors((prev) => ({
        ...prev,
        [stateErrorKey]: undefined,
        [cityErrorKey]: undefined,
      }));
    }
  };

  const copyPrimaryAddress = (targetNum: 2 | 3) => {
    const primary = form.address1;
    if (!primary?.street || primary.street.trim() === "") {
      Toast.show({
        type: 'error',
        text1: 'Primary Address is empty',
        text2: 'Please fill address 1 first'
      });
      return;
    }

    updateAddress(targetNum, "street", primary.street);
    updateAddress(targetNum, "state", primary.state || "");
    updateAddress(targetNum, "city", primary.city || "");
    updateAddress(targetNum, "pincode", primary.pincode || "");

    Toast.show({ type: 'success', text1: 'Address Copied' });
  };

  const handleUpload = async (field: keyof OnboardingFormSchema, label: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.3,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (!asset.uri) {
          Toast.show({
            type: 'error',
            text1: 'Invalid Image',
            text2: 'Image URI is missing'
          });
          return;
        }

        const fileObj = {
          uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `${field}_${Date.now()}.jpg`,
        };

        setForm(prev => ({ ...prev, [field]: fileObj }));

        const errorKey = field as FlatErrorKeys;
        if (errors[errorKey]) {
          setErrors(prev => ({ ...prev, [errorKey]: undefined }));
        }

        Toast.show({
          type: 'success',
          text1: 'Image Selected',
          text2: `${label} ready to upload.`
        });
      }
    } catch (error: any) {
      console.error("Image upload error:", error);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error?.message || 'Failed to select image'
      });
    }
  };

  const validateAllFields = (): boolean => {
    let isValid = true;

    // Validate personal fields
    const personalFields: (keyof OnboardingFormSchema)[] = [
      'full_name', 'first_name', 'last_name', 'email', 'mobile',
      'dob', 'gender', 'pan_no', 'aadhar_no',
      'bank_name', 'account_holder_name', 'account_no', 'ifsc_code'
    ];

    personalFields.forEach(field => {
      const fieldValid = validatePersonalField(field);
      if (!fieldValid) isValid = false;
    });

    // Validate addresses
    [1, 2, 3].forEach(num => {
      (['street', 'city', 'state', 'pincode'] as const).forEach(field => {
        const fieldValid = validateAddressField(num as 1 | 2 | 3, field);
        if (!fieldValid) isValid = false;
      });
    });

    // Validate documents
    if (!form.aadhar_front?.uri) {
      setErrors(prev => ({ ...prev, aadhar_front: "Aadhaar front image is required" }));
      isValid = false;
    }
    if (!form.aadhar_back?.uri) {
      setErrors(prev => ({ ...prev, aadhar_back: "Aadhaar back image is required" }));
      isValid = false;
    }
    if (!form.pan_card?.uri) {
      setErrors(prev => ({ ...prev, pan_card: "PAN card image is required" }));
      isValid = false;
    }
    if (!form.bank_document?.uri) {
      setErrors(prev => ({ ...prev, bank_document: "Bank document is required" }));
      isValid = false;
    }

    // Mark all as touched
    const allTouched = Object.keys(touched).reduce((acc, key) => {
      acc[key as FlatTouchedKeys] = true;
      return acc;
    }, {} as Record<FlatTouchedKeys, boolean>);

    setTouched(allTouched);

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateAllFields()) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      Toast.show({
        type: "error",
        text1: "Validation Failed",
        text2: "Please fill all required fields correctly"
      });
      return;
    }

    try {
      setLoading(true);

      let location: any = null;
      try {
        location = await getLatLong();
      } catch (locError) {
        console.warn("Location fetch failed:", locError);
      }

      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        Toast.show({ type: "error", text1: "Authentication Error", text2: "User token not found" });
        setLoading(false);
        return;
      }

      const userRaw = await SecureStore.getItemAsync("userData");
      const userId = userRaw ? (() => {
        try { return JSON.parse(userRaw).id; }
        catch { return "70"; }
      })() : "70";

      const formData = new FormData();

      // Personal Fields
      formData.append("full_name", form.full_name);
      formData.append("first_name", form.first_name);
      formData.append("last_name", form.last_name);
      formData.append("email", form.email);
      formData.append("mobile_number", form.mobile);
      formData.append("dob", form.dob);
      formData.append("gender", form.gender);
      formData.append("pan_number", form.pan_no);
      formData.append("aadhaar_number", form.aadhar_no);
      formData.append("user_id", String(userId));

      // Bank Details
      formData.append("bank_name", form.bank_name);
      formData.append("bank_account_holder_name", form.account_holder_name);
      formData.append("bank_account_number", form.account_no);
      formData.append("bank_ifsc_code", form.ifsc_code);

      // Address 1
      formData.append("address", form.address1.street);
      formData.append("state", form.address1.state);
      formData.append("city", form.address1.city);
      formData.append("pincode", form.address1.pincode);

      // Address 2
      formData.append("address1", form.address2.street);
      formData.append("state1", form.address2.state);
      formData.append("city1", form.address2.city);
      formData.append("pincode1", form.address2.pincode);

      // Address 3
      formData.append("address2", form.address3.street);
      formData.append("state2", form.address3.state);
      formData.append("city2", form.address3.city);
      formData.append("pincode2", form.address3.pincode);

      // Documents
      if (form.aadhar_front?.uri) {
        formData.append("aadhaar_doc", {
          uri: form.aadhar_front.uri,
          type: form.aadhar_front.type || "image/jpeg",
          name: form.aadhar_front.name || "aadhar_front.jpg",
        } as any);
      }

      if (form.aadhar_back?.uri) {
        formData.append("aadhaar_back_doc", {
          uri: form.aadhar_back.uri,
          type: form.aadhar_back.type || "image/jpeg",
          name: form.aadhar_back.name || "aadhar_back.jpg",
        } as any);
      }

      if (form.pan_card?.uri) {
        formData.append("pan_doc", {
          uri: form.pan_card.uri,
          type: form.pan_card.type || "image/jpeg",
          name: form.pan_card.name || "pan_card.jpg",
        } as any);
      }

      if (form.bank_document?.uri) {
        formData.append("bank_document", {
          uri: form.bank_document.uri,
          type: form.bank_document.type || "image/jpeg",
          name: form.bank_document.name || "bank_document.jpg",
        } as any);
      }

      const res = await apiClient({
        endpoint: "/bankit/kyc/submit",
        method: "POST",
        body: formData,
        headers: {
          latitude: String(location?.latitude || "0.0"),
          longitude: String(location?.longitude || "0.0"),
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res?.success) {
        Toast.show({ type: "success", text1: "Success", text2: "KYC submitted successfully" });
        fetchKycStatus();
      } else {
        const msg = res?.message?.includes("Duplicate entry")
          ? "KYC already submitted for this account."
          : res?.message || "Submission failed";
        Toast.show({ type: "error", text1: "Submission Failed", text2: msg });
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      Toast.show({
        type: "error",
        text1: "Submission Failed",
        text2: error?.response?.data?.message || error?.message || "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        style={{ marginHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        ref={scrollViewRef}
      >
        {/* Header */}
        <View style={styles.header}>
          <CheckCircle2 size={28} color="#27AE60" />
          <Text style={styles.mainTitle}>KYC Verification</Text>
        </View>

        <View style={{ marginTop: 16, rowGap: 16 }}>

          {/* Personal Details Card */}
          <AnimatedCard>
            <View>
              <View style={styles.sectionTitleRow}>
                <User size={18} color="#333" />
                <Text style={styles.sectionHeader}>Personal Details</Text>
              </View>
              <View style={styles.divider} />

              <View>
                <CustomInput
                  label="Full Name"
                  placeholder="Enter full name"
                  value={form.full_name}
                  error={touched.full_name ? errors.full_name : undefined}
                  onChangeText={(text) => update("full_name", text)}
                  onBlur={() => {
                    handleBlur("full_name");
                    validatePersonalField("full_name");
                  }}
                  iconStart={User}
                />

                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <View style={{ flex: 0.5, marginRight: 5 }}>
                    <CustomInput
                      label="First Name"
                      placeholder="Enter first name"
                      value={form.first_name}
                      error={touched.first_name ? errors.first_name : undefined}
                      onChangeText={(text) => update("first_name", text)}
                      onBlur={() => {
                        handleBlur("first_name");
                        validatePersonalField("first_name");
                      }}
                      iconStart={User}
                      iconSize={16}
                    />
                  </View>
                  <View style={{ flex: 0.5, marginLeft: 5 }}>
                    <CustomInput
                      label="Last Name"
                      placeholder="Enter last name"
                      value={form.last_name}
                      error={touched.last_name ? errors.last_name : undefined}
                      onChangeText={(text) => update("last_name", text)}
                      onBlur={() => {
                        handleBlur("last_name");
                        validatePersonalField("last_name");
                      }}
                      iconStart={User}
                      iconSize={16}
                    />
                  </View>
                </View>

                <CustomInput
                  label="Email"
                  placeholder="Enter email"
                  value={form.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={touched.email ? errors.email : undefined}
                  onChangeText={(text) => update("email", text)}
                  onBlur={() => {
                    handleBlur("email");
                    validatePersonalField("email");
                  }}
                  iconStart={Mail}
                />

                <CustomInput
                  label="Mobile Number"
                  placeholder="Enter mobile number"
                  value={form.mobile}
                  maxLength={10}
                  keyboardType="number-pad"
                  error={touched.mobile ? errors.mobile : undefined}
                  onChangeText={(text) => update("mobile", text)}
                  onBlur={() => {
                    handleBlur("mobile");
                    validatePersonalField("mobile");
                  }}
                  iconStart={Phone}
                />

                <View style={styles.row}>
                  <View style={{ flex: 0.5, marginRight: 5 }}>
                    <CustomDatePicker
                      label="Date of Birth"
                      dateValue={form.dob}
                      onDateChange={(formattedDate) => {
                        // If formattedDate is "04-02-2026"
                        if (formattedDate && formattedDate.includes('-')) {
                          const [day, month, year] = formattedDate.split('-');

                          // Reassemble to "YYYY-MM-DD"
                          const mysqlDate = `${year}-${month}-${day}`;

                          update("dob", mysqlDate);
                        } else {
                          update("dob", formattedDate);
                        }

                        setTouched((prev) => ({ ...prev, dob: true }));
                      }}
                      error={touched.dob ? errors.dob : undefined}
                    />
                  </View>
                  <View style={{ flex: 0.5, marginLeft: 5 }}>
                    <CustomDropdownPicker2
                      label="Gender"
                      placeholder="Select gender"
                      items={[
                        { label: "Male", value: "Male" },
                        { label: "Female", value: "Female" },
                        { label: "Other", value: "Other" },
                      ]}
                      value={form.gender || null}
                      onValueChange={(val) => {
                        update("gender", val as string);
                        setTouched((prev) => ({ ...prev, gender: true }));

                      }}
                      error={touched.gender ? errors.gender : undefined}
                      zIndex={3000}
                      zIndexInverse={1000}
                    />
                  </View>
                </View>

                <CustomInput
                  label="PAN Number"
                  placeholder="Enter PAN number"
                  value={form.pan_no}
                  maxLength={10}
                  autoCapitalize="characters"
                  error={touched.pan_no ? errors.pan_no : undefined}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    update("pan_no", cleaned);
                  }}
                  onBlur={() => {
                    handleBlur("pan_no");
                    validatePersonalField("pan_no");
                  }}
                  iconStart={CreditCard}
                />

                <CustomInput
                  label="Aadhaar Number"
                  placeholder="Enter aadhaar number"
                  value={form.aadhar_no}
                  maxLength={12}
                  keyboardType="number-pad"
                  error={touched.aadhar_no ? errors.aadhar_no : undefined}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    update("aadhar_no", cleaned);
                  }}
                  onBlur={() => {
                    handleBlur("aadhar_no");
                    validatePersonalField("aadhar_no");
                  }}
                  iconStart={Fingerprint}
                />
              </View>
            </View>
          </AnimatedCard>

          {/* Addresses Card */}
          <AnimatedCard>
            <View>
              <View style={styles.sectionTitleRow}>
                <MapPin size={18} color="#333" />
                <Text style={styles.sectionHeader}>Addresses</Text>
              </View>
              <View style={styles.divider} />

              <AddressSection
                num={1}
                form={form}
                errors={errors}
                touched={touched}
                updateAddress={updateAddress}
                handleBlur={handleBlur}
                validateAddressField={validateAddressField}
                handleStateChange={handleStateChange}
              />

              <View style={styles.divider} />
              <AddressSection
                num={2}
                form={form}
                errors={errors}
                touched={touched}
                updateAddress={updateAddress}
                handleBlur={handleBlur}
                validateAddressField={validateAddressField}
                handleStateChange={handleStateChange}
                onCopyPrimary={copyPrimaryAddress}
              />
              <View style={styles.divider} />
              <AddressSection
                num={3}
                form={form}
                errors={errors}
                touched={touched}
                updateAddress={updateAddress}
                handleBlur={handleBlur}
                validateAddressField={validateAddressField}
                handleStateChange={handleStateChange}
                onCopyPrimary={copyPrimaryAddress}
              />
            </View>
          </AnimatedCard>

          {/* Bank Details Card */}
          <AnimatedCard>
            <View>
              <View style={styles.sectionTitleRow}>
                <Briefcase size={18} color="#333" />
                <Text style={styles.sectionHeader}>Bank Details</Text>
              </View>
              <View style={styles.divider} />

              <CustomInput
                label="Bank Name"
                placeholder="Enter bank name"
                value={form.bank_name}
                error={touched.bank_name ? errors.bank_name : undefined}
                onChangeText={(text) => update("bank_name", text)}
                onBlur={() => {
                  handleBlur("bank_name");
                  validatePersonalField("bank_name");
                }}
                iconStart={Briefcase}
              />

              <CustomInput
                label="Account Holder Name"
                placeholder="Enter account holder name"
                value={form.account_holder_name}
                error={touched.account_holder_name ? errors.account_holder_name : undefined}
                onChangeText={(text) => update("account_holder_name", text)}
                onBlur={() => {
                  handleBlur("account_holder_name");
                  validatePersonalField("account_holder_name");
                }}
                iconStart={User}
              />

              <CustomInput
                label="Account Number"
                placeholder="Enter account number"
                value={form.account_no}
                keyboardType="number-pad"
                error={touched.account_no ? errors.account_no : undefined}
                onChangeText={(text) => update("account_no", text)}
                onBlur={() => {
                  handleBlur("account_no");
                  validatePersonalField("account_no");
                }}
                iconStart={FileText}
              />

              <CustomInput
                label="IFSC Code"
                placeholder="Enter IFSC code"
                value={form.ifsc_code}
                autoCapitalize="characters"
                maxLength={11}
                error={touched.ifsc_code ? errors.ifsc_code : undefined}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                  update("ifsc_code", cleaned);
                }}
                onBlur={() => {
                  handleBlur("ifsc_code");
                  validatePersonalField("ifsc_code");
                }}
                iconStart={FileText}
              />
            </View>
          </AnimatedCard>

          {/* Documents Card */}
          <AnimatedCard>
            <View>
              <View style={styles.sectionTitleRow}>
                <FileText size={18} color="#333" />
                <Text style={styles.sectionHeader}>Documents</Text>
              </View>
              <View style={styles.divider} />

              <UploadBtn
                label="Aadhaar Front"
                fileData={form.aadhar_front}
                onPress={() => handleUpload('aadhar_front', 'Aadhaar Front')}
                error={errors.aadhar_front}
              />

              <UploadBtn
                label="Aadhaar Back"
                fileData={form.aadhar_back}
                onPress={() => handleUpload('aadhar_back', 'Aadhaar Back')}
                error={errors.aadhar_back}
              />

              <UploadBtn
                label="PAN Card"
                fileData={form.pan_card}
                onPress={() => handleUpload('pan_card', 'PAN Card')}
                error={errors.pan_card}
              />

              <UploadBtn
                label="Bank Document (Cheque / Passbook)"
                fileData={form.bank_document}
                onPress={() => handleUpload('bank_document', 'Bank Document')}
                error={errors.bank_document}
              />
            </View>
          </AnimatedCard>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit KYC</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Styles
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    marginTop: 16,
    columnGap: 3,
  },
  mainTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: '#1A1A1A',
  },
  sectionTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    columnGap: 3,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color: '#333',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: theme.colors.border.light,
    marginTop: 3,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row' as const,
    columnGap: 5,
    alignItems: 'baseline'
  },
  sectionRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  internalLabel: {
    fontSize: 13,
    fontWeight: 'bold' as const,
    color: theme.colors.primary[500],
  },
  copyBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  copyBtnText: {
    fontSize: 10,
    color: theme.colors.primary[500],
    fontWeight: '700' as const,
    marginLeft: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: theme.colors.text.secondary,
    marginBottom: 8,
    marginTop: 12,
  },
  uploadBox: {
    borderStyle: 'dashed' as const,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F9F9F9',
    minHeight: 55,
  },
  uploadSuccessBox: {
    borderStyle: 'solid' as const,
    borderColor: '#27AE60',
    backgroundColor: '#F0FFF0',
  },
  err: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600' as const,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center' as const,
    marginTop: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});

export default OnboardingForm;
