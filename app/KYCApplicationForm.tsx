import { AnimatedCard } from "@/components/animated/AnimatedCard";
import CustomDropdownPicker2 from "@/components/ui/AppDropdown";
import CustomDatePicker from "@/components/ui/CustomDatePicker";
import CustomInput from "@/components/ui/CustomInput";
import { theme } from "@/theme";
import { CheckCircle2, User, MapPin, FileText, Briefcase, UploadCloud, CreditCard, Fingerprint, Phone, Mail } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { getLatLong } from '@/utils/location';
import { city } from "@/utils/data";
import { businessTypes } from "@/utils/businessTypesData";
import { apiClient } from "@/api/api.client";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
    onKycSubmitted?: () => void;
};

interface KYCFormSchema {
    // Personal Details
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    dob: string;
    pan_no: string;
    aadhar_no: string;

    // Business Details
    business_name: string;
    business_type: string;
    is_GST_registered: "Yes" | "No" | "";
    GST_number: string;

    // Address
    permanent_address: string;
    state: string;
    city: string;
    pincode: string;

    // Documents
    aadhar_front?: any;
    aadhar_back?: any;
    pan_card?: any;
    passport_size_photo?: any;
}

type FlatTouchedKeys = keyof KYCFormSchema |
    "aadhar_front" | "aadhar_back" | "pan_card" | "passport_size_photo";

type FlatErrorKeys = FlatTouchedKeys;

// Normalize city data
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

const GST_OPTIONS = [
    { label: "Yes", value: "Yes" },
    { label: "No", value: "No" },
];

const BUSINESS_TYPE_OPTIONS = businessTypes.map(bt => ({
    label: bt.label,
    value: bt.value
}));

// Upload Button Component
const UploadBtn = ({ label, fileData, onPress, error }: any) => {
    const isUploaded = !!(fileData && fileData?.uri);
    return (
        <View style={{}}>
            <Text style={[styles.label, {marginBottom: 8,marginTop: 16,}]}>{label}</Text>
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

const KYCApplicationForm = ({ onKycSubmitted }: Props) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState<KYCFormSchema>({
        first_name: "",
        last_name: "",
        email: "",
        mobile: "",
        dob: "",
        pan_no: "",
        aadhar_no: "",
        business_name: "",
        business_type: "",
        is_GST_registered: "",
        GST_number: "",
        permanent_address: "",
        state: "",
        city: "",
        pincode: "",
    });

    const [errors, setErrors] = useState<Partial<Record<FlatErrorKeys, string>>>({});
    const [touched, setTouched] = useState<Record<FlatTouchedKeys, boolean>>({
        first_name: false,
        last_name: false,
        email: false,
        mobile: false,
        dob: false,
        pan_no: false,
        aadhar_no: false,
        business_name: false,
        business_type: false,
        is_GST_registered: false,
        GST_number: false,
        permanent_address: false,
        state: false,
        city: false,
        pincode: false,
        aadhar_front: false,
        aadhar_back: false,
        pan_card: false,
        passport_size_photo: false,
    });

    // ─── Validators ───────────────────────────────────────────────────────────

    const validatePersonalField = (field: keyof KYCFormSchema) => {
        let errorMessage = "";

        switch (field) {
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
            case "business_name":
                if (!form.business_name.trim()) errorMessage = "Business name is required";
                break;
            case "business_type":
                if (!form.business_type) errorMessage = "Please select business type";
                break;
            case "is_GST_registered":
                if (!form.is_GST_registered) errorMessage = "Please select GST availability";
                break;
            case "GST_number":
                if (form.is_GST_registered === "Yes" && !form.GST_number.trim()) {
                    errorMessage = "GST number is required";
                } else if (form.GST_number && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.GST_number)) {
                    errorMessage = "Enter a valid GST number";
                }
                break;
            case "permanent_address":
                if (!form.permanent_address.trim()) errorMessage = "Address is required";
                break;
            case "city":
                if (!form.city) errorMessage = "Please select a city";
                break;
            case "state":
                if (!form.state) errorMessage = "Please select a state";
                break;
            case "pincode":
                if (!form.pincode.trim()) errorMessage = "Pincode is required";
                else if (!/^\d{6}$/.test(form.pincode))
                    errorMessage = "Enter valid 6-digit pincode";
                break;
        }

        setErrors((prev) => ({ ...prev, [field]: errorMessage }));
        return !errorMessage;
    };

    // ─── Helpers ──────────────────────────────────────────────────────────────

    const update = (key: keyof KYCFormSchema, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));

        // Clear error when field is updated
        if (errors[key as FlatErrorKeys]) {
            setErrors((prev) => ({ ...prev, [key]: undefined }));
        }

        // Special handling for GST
        if (key === "is_GST_registered" && value === "No") {
            setForm(prev => ({ ...prev, GST_number: "" }));
            setErrors(prev => ({ ...prev, GST_number: undefined }));
        }
    };

    const handleBlur = (field: FlatTouchedKeys) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const handleUpload = async (field: keyof KYCFormSchema, label: string) => {
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

        // Validate all fields
        const fieldsToValidate: (keyof KYCFormSchema)[] = [
            'first_name', 'last_name', 'email', 'mobile', 'dob', 'pan_no', 'aadhar_no',
            'business_name', 'business_type', 'is_GST_registered',
            'permanent_address', 'state', 'city', 'pincode'
        ];

        fieldsToValidate.forEach(field => {
            const fieldValid = validatePersonalField(field);
            if (!fieldValid) isValid = false;
        });

        // Validate GST number if applicable
        if (form.is_GST_registered === "Yes") {
            const gstValid = validatePersonalField("GST_number");
            if (!gstValid) isValid = false;
        }

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
        if (!form.passport_size_photo?.uri) {
            setErrors(prev => ({ ...prev, passport_size_photo: "Passport size photo is required" }));
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
            formData.append("first_name", form.first_name);
            formData.append("last_name", form.last_name);
            formData.append("email", form.email);
            formData.append("mobile_number", form.mobile);
            formData.append("dob", form.dob);
            formData.append("pan_number", form.pan_no);
            formData.append("aadhaar_number", form.aadhar_no);
            formData.append("user_id", String(userId));

            // Business Details
            formData.append("business_name", form.business_name);
            formData.append("business_type", form.business_type);
            formData.append("is_GST_registered", form.is_GST_registered);
            if (form.is_GST_registered === "Yes") {
                formData.append("GST_number", form.GST_number);
            }

            // Address
            formData.append("permanent_address", form.permanent_address);
            formData.append("state", form.state);
            formData.append("city", form.city);
            formData.append("pincode", form.pincode);

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

            if (form.passport_size_photo?.uri) {
                formData.append("passport_photo", {
                    uri: form.passport_size_photo.uri,
                    type: form.passport_size_photo.type || "image/jpeg",
                    name: form.passport_size_photo.name || "passport_photo.jpg",
                } as any);
            }

            const res = await apiClient({
                endpoint: "/kyc/submit",
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
                onKycSubmitted?.();
            } else {
                Toast.show({ type: "error", text1: "Submission Failed", text2: res?.message || "Submission failed" });
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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
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
                        <Text style={styles.mainTitle}>KYC Application</Text>
                    </View>

                    <View style={{ marginTop: 16, rowGap: 16 }}>

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
                                    label="Passport Size Photo"
                                    fileData={form.passport_size_photo}
                                    onPress={() => handleUpload('passport_size_photo', 'Passport Size Photo')}
                                    error={errors.passport_size_photo}
                                />
                            </View>
                        </AnimatedCard>

                        {/* Personal Details Card */}
                        <AnimatedCard>
                            <View>
                                <View style={styles.sectionTitleRow}>
                                    <User size={18} color="#333" />
                                    <Text style={styles.sectionHeader}>Personal Details</Text>
                                </View>
                                <View style={styles.divider} />

                                <View style={styles.row}>
                                    <View style={{ flex: 0.5, marginRight: 5 }}>
                                        <CustomInput
                                            label="First Name"
                                            placeholder="Enter first name"
                                            value={form.first_name}
                                            onChangeText={(text) => update("first_name", text)}
                                            onBlur={() => {
                                                handleBlur("first_name");
                                                validatePersonalField("first_name");
                                            }}
                                            error={touched.first_name ? errors.first_name : undefined}
                                            iconStart={User}
                                        />
                                    </View>
                                    <View style={{ flex: 0.5, marginLeft: 5 }}>
                                        <CustomInput
                                            label="Last Name"
                                            placeholder="Enter last name"
                                            value={form.last_name}
                                            onChangeText={(text) => update("last_name", text)}
                                            onBlur={() => {
                                                handleBlur("last_name");
                                                validatePersonalField("last_name");
                                            }}
                                            error={touched.last_name ? errors.last_name : undefined}
                                            iconStart={User}
                                        />
                                    </View>
                                </View>

                                <CustomInput
                                    label="Email"
                                    placeholder="Enter email"
                                    value={form.email}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    onChangeText={(text) => update("email", text)}
                                    onBlur={() => {
                                        handleBlur("email");
                                        validatePersonalField("email");
                                    }}
                                    error={touched.email ? errors.email : undefined}
                                    iconStart={Mail}
                                />

                                <CustomInput
                                    label="Mobile Number"
                                    placeholder="Enter mobile number"
                                    value={form.mobile}
                                    maxLength={10}
                                    keyboardType="number-pad"
                                    onChangeText={(text) => update("mobile", text)}
                                    onBlur={() => {
                                        handleBlur("mobile");
                                        validatePersonalField("mobile");
                                    }}
                                    error={touched.mobile ? errors.mobile : undefined}
                                    iconStart={Phone}
                                />


                                <CustomDatePicker
                                    label="Date of Birth"
                                    dateValue={form.dob}
                                    onDateChange={(formattedDate) => {
                                        if (formattedDate && formattedDate.includes('-')) {
                                            const [day, month, year] = formattedDate.split('-');
                                            const mysqlDate = `${year}-${month}-${day}`;
                                            update("dob", mysqlDate);
                                        } else {
                                            update("dob", formattedDate);
                                        }
                                        handleBlur("dob");
                                    }}
                                    error={touched.dob ? errors.dob : undefined}
                                />


                                <CustomInput
                                    label="PAN Number"
                                    placeholder="Enter pan number"
                                    value={form.pan_no}
                                    maxLength={10}
                                    autoCapitalize="characters"
                                    onChangeText={(text) => {
                                        const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                                        update("pan_no", cleaned);
                                    }}
                                    onBlur={() => {
                                        handleBlur("pan_no");
                                        validatePersonalField("pan_no");
                                    }}
                                    error={touched.pan_no ? errors.pan_no : undefined}
                                    iconStart={CreditCard}
                                />

                                <CustomInput
                                    label="Aadhaar Number"
                                    placeholder="Enter aadhaar number"
                                    value={form.aadhar_no}
                                    maxLength={12}
                                    keyboardType="number-pad"
                                    onChangeText={(text) => {
                                        const cleaned = text.replace(/[^0-9]/g, '');
                                        update("aadhar_no", cleaned);
                                    }}
                                    onBlur={() => {
                                        handleBlur("aadhar_no");
                                        validatePersonalField("aadhar_no");
                                    }}
                                    error={touched.aadhar_no ? errors.aadhar_no : undefined}
                                    iconStart={Fingerprint}
                                />
                            </View>
                        </AnimatedCard>

                        {/* Business Details Card */}
                        <AnimatedCard>
                            <View>
                                <View style={styles.sectionTitleRow}>
                                    <Briefcase size={18} color="#333" />
                                    <Text style={styles.sectionHeader}>Business Details</Text>
                                </View>
                                <View style={styles.divider} />

                                <CustomInput
                                    label="Business Name"
                                    placeholder="Enter business name"
                                    value={form.business_name}
                                    onChangeText={(text) => update("business_name", text)}
                                    onBlur={() => {
                                        handleBlur("business_name");
                                        validatePersonalField("business_name");
                                    }}
                                    error={touched.business_name ? errors.business_name : undefined}
                                    iconStart={Briefcase}
                                />

                                <CustomDropdownPicker2
                                    label="Business Type"
                                    items={BUSINESS_TYPE_OPTIONS}
                                    value={form.business_type || null}
                                    onValueChange={(val) => {
                                        if (val) {
                                            update("business_type", val as string);
                                            handleBlur("business_type");
                                        }
                                    }}
                                    error={touched.business_type ? errors.business_type : undefined}
                                    listMode="MODAL"
                                />

                                <CustomDropdownPicker2
                                    label="GST Registered?"
                                    items={GST_OPTIONS}
                                    value={form.is_GST_registered || null}
                                    onValueChange={(val) => {
                                        if (val) {
                                            update("is_GST_registered", val as "Yes" | "No");
                                            handleBlur("is_GST_registered");
                                        }
                                    }}
                                    error={touched.is_GST_registered ? errors.is_GST_registered : undefined}
                                    listMode="MODAL"
                                    
                                />

                                {form.is_GST_registered === "Yes" && (
                                    <CustomInput
                                        label="GST Number"
                                        placeholder="Enter gst number"
                                        value={form.GST_number}
                                        autoCapitalize="characters"
                                        maxLength={15}
                                        onChangeText={(text) => {
                                            const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                                            update("GST_number", cleaned);
                                        }}
                                        onBlur={() => {
                                            handleBlur("GST_number");
                                            validatePersonalField("GST_number");
                                        }}
                                        error={touched.GST_number ? errors.GST_number : undefined}
                                        iconStart={FileText}
                                    />
                                )}
                            </View>
                        </AnimatedCard>

                        {/* Address Card */}
                        <AnimatedCard>
                            <View>
                                <View style={styles.sectionTitleRow}>
                                    <MapPin size={18} color="#333" />
                                    <Text style={styles.sectionHeader}>Address Details</Text>
                                </View>
                                <View style={styles.divider} />

                                <CustomInput
                                    label="Permanent Address"
                                    placeholder="Enter permanent address"
                                    value={form.permanent_address}
                                    onChangeText={(text) => update("permanent_address", text)}
                                    onBlur={() => {
                                        handleBlur("permanent_address");
                                        validatePersonalField("permanent_address");
                                    }}
                                    error={touched.permanent_address ? errors.permanent_address : undefined}
                                    iconStart={MapPin}
                                />

                                <CustomDropdownPicker2
                                    label="State"
                                    items={STATE_OPTIONS}
                                    value={form.state || null}
                                    onValueChange={(val) => {
                                        if (val) {
                                            update("state", val as string);
                                            update("city", ""); // Reset city when state changes
                                            handleBlur("state");
                                        }
                                    }}
                                    error={touched.state ? errors.state : undefined}
                                    listMode="MODAL"
                                />

                                <CustomDropdownPicker2
                                    key={`city-${form.state}`}
                                    label="City"
                                    items={getCityOptions(form.state)}
                                    value={form.city || null}
                                    disabled={!form.state}
                                    onValueChange={(val) => {
                                        if (val) {
                                            update("city", val as string);
                                            handleBlur("city");
                                        }
                                    }}
                                    error={touched.city ? errors.city : undefined}
                                    listMode="MODAL"
                                />

                                <CustomInput
                                    label="Pincode"
                                    placeholder="Enter pincode"
                                    value={form.pincode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    onChangeText={(text) => update("pincode", text.replace(/[^0-9]/g, ""))}
                                    onBlur={() => {
                                        handleBlur("pincode");
                                        validatePersonalField("pincode");
                                    }}
                                    error={touched.pincode ? errors.pincode : undefined}
                                    iconStart={MapPin}
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
        </SafeAreaView>
    );
};

// Styles (reuse from OnboardingForm)
const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
        columnGap: 3,
    },
    mainTitle: {
        fontSize: theme.typography.fontSizes.lg,
        fontWeight: theme.typography.fontWeights.semibold,
        color: '#1A1A1A',
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
        flexDirection: 'row',
        columnGap: 5,
        alignItems: 'baseline'
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.secondary,

    },
    uploadBox: {
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        padding: 12,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        minHeight: 48,
    },
    uploadSuccessBox: {
        borderStyle: 'solid',
        borderColor: '#27AE60',
        backgroundColor: '#F0FFF0',
    },
    err: {
        color: '#EF4444',
        fontSize: 11,
        marginTop: 4,
        fontWeight: '600',
    },
    submitBtn: {
        backgroundColor: theme.colors.primary[500],
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
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
        fontWeight: '600',
    },
});

export default KYCApplicationForm;