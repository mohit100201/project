import { useEffect, useState } from "react";
import {
    Text,
    View,
    ScrollView,
    StyleSheet,
    Modal,
    Pressable,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { getLatLong } from "@/utils/location";
import { paysprinBankList, paysprintBalanceEnquiry } from "@/api/paysprint.api";

import { AnimatedCard } from "@/components/animated/AnimatedCard";
import CustomInput from "@/components/ui/CustomInput";
import { AnimatedButton } from "@/components/animated/AnimatedButton";
import DropDownPicker from "react-native-dropdown-picker";
import { theme } from "@/theme";
import { BiometricScanner } from "@/components/ui/BiometricScanner";
import { X, CheckCircle, XCircle, Smartphone, Fingerprint } from "lucide-react-native";
import CustomDropdown3 from "@/components/ui/CustomDropdwon3";

/* ---------------- TYPES ---------------- */

interface BalanceEnquiryForm {
    mobileno: string;
    aadhaar: string;
    bankIIN: string;
    biometricData: string;
    ipAddress: string;
}

interface DropdownItem {
    label: string;
    value: string;
}

interface BalanceEnquiryResponse {
    success?: boolean;
    code?: number;
    message?: string;
    data?: {
        response_code?: number;
        status?: boolean;
        message?: string;
        ackno?: number;
        amount?: number;
        balanceamount?: string;
        bankrrn?: number;
        bankiin?: string;
        mobile?: string;
        errorcode?: number;
    };
}

/* ---------------- COMPONENT ---------------- */

const BalanceEnquiry = () => {
    /* ---------- STATE ---------- */

    const [bankOptions, setBankOptions] = useState<DropdownItem[]>([]);
    const [bankOpen, setBankOpen] = useState(false);
    const [dropdownKey, setDropdownKey] = useState(0);
const [biometricKey, setBiometricKey] = useState(0);

const handleFullReset = () => {
    // 1. Reset Form Fields
    setForm(prev => ({
        mobileno: "",
        aadhaar: "",
        bankIIN: "",
        biometricData: "",
        ipAddress: prev.ipAddress, // Preserve IP
    }));

    // 2. Clear Validation States
    setErrors({});
    setTouched({
        mobileno: false,
        aadhaar: false,
        bankIIN: false,
        biometricData: false,
    });

    // 3. Increment Keys to force unmount/remount of internal components
    setDropdownKey(prev => prev + 1);
    setBiometricKey(prev => prev + 1);
};

    const [form, setForm] = useState<BalanceEnquiryForm>({
        mobileno: "",
        aadhaar: "",
        bankIIN: "",
        biometricData: "",
        ipAddress: "",
    });

    const [errors, setErrors] = useState<any>({});
    const [touched, setTouched] = useState<any>({
        mobileno: false,
        aadhaar: false,
        bankIIN: false,
        biometricData: false,
    });

    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [responseData, setResponseData] =
        useState<BalanceEnquiryResponse | null>(null);

    /* ---------- ANIMATION ---------- */

    const translateY = useSharedValue(700);

    useEffect(() => {
        translateY.value = modalVisible
            ? withSpring(0, { damping: 18 })
            : withTiming(700);
    }, [modalVisible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    /* ---------- HELPERS ---------- */

    const update = (key: keyof BalanceEnquiryForm, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((p: any) => ({ ...p, [key]: undefined }));
    };

    const validateField = (field: string) => {
        let msg = "";

        if (field === "mobileno") {
            if (!/^[6-9]\d{9}$/.test(form.mobileno))
                msg = "Enter valid 10-digit mobile number";
        }

        if (field === "aadhaar") {
            if (!/^\d{12}$/.test(form.aadhaar))
                msg = "Enter valid 12-digit Aadhaar number";
        }

        if (field === "bankIIN" && !form.bankIIN) {
            msg = "Please select a bank";
        }

        if (field === "biometricData" && !form.biometricData) {
            msg = "Biometric scan required";
        }

        setErrors((p: any) => ({ ...p, [field]: msg }));
        return !msg;
    };

    const validate = () => {
        const mobileValid = validateField("mobileno");
        const aadhaarValid = validateField("aadhaar");
        const bankValid = validateField("bankIIN");
        const biometricValid = validateField("biometricData");

        setTouched({
            mobileno: true,
            aadhaar: true,
            bankIIN: true,
            biometricData: true,
        });

        return mobileValid && aadhaarValid && bankValid && biometricValid;
    };


    /* ---------- BANK LIST ---------- */

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
                    setBankOptions(
                        res.data.banklist.data.map((b: any) => ({
                            label: b.bankName,
                            value: b.iinno,
                        }))
                    );
                }
            } catch {
                Toast.show({
                    type: "error",
                    text1: "Bank List Error",
                    text2: "Unable to fetch bank list",
                });
            }
        })();
    }, []);

    /* ---------- IP ---------- */

    useEffect(() => {
        fetch("https://api.ipify.org?format=json")
            .then(r => r.json())
            .then(d => setForm(p => ({ ...p, ipAddress: d.ip })))
            .catch(() =>
                setForm(p => ({ ...p, ipAddress: "192.168.1.1" }))
            );
    }, []);

    /* ---------- SUBMIT ---------- */

    const handleSubmit = async () => {
        if (loading) return;
        if (!validate()) return;

        setLoading(true);

        try {
            const location = await getLatLong();
            const token = await SecureStore.getItemAsync("userToken");

            if (!location || !token) throw new Error("Missing requirements");

            const res = await paysprintBalanceEnquiry({
                token,
                latitude: location.latitude,
                longitude: location.longitude,
                bank: "bank5",
                accessmodetype: "APP",
                piddata: form.biometricData,
                ipaddress: form.ipAddress,
                mobilenumber: form.mobileno,
                adhaarnumber: form.aadhaar,
                nationalbankidentificationnumber: form.bankIIN,
            });

            if (!res || typeof res !== "object")
                throw new Error("Invalid server response");

            setResponseData(res);
            setModalVisible(true);

            if (res?.success && res?.data?.status) {
                Toast.show({ type: "success", text1: "Balance fetched" });
                setForm(p => ({
                    ...p,
                    mobileno: "",
                    aadhaar: "",
                    bankIIN: "",
                    biometricData: "",
                }));
            } else {
                throw new Error(res?.data?.message || res?.message);
            }
        } catch (e: any) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: e.message || "Something went wrong",
            });
        } finally {
            handleFullReset()
            setLoading(false);
        }
    };

    /* ---------- FORMAT ---------- */

    const formatCurrency = (val?: string | number) => {
        if (!val) return "₹0.00";
        const n = parseFloat(String(val).replace(/,/g, ""));
        return isNaN(n) ? "₹0.00" : `₹${n.toFixed(2)}`;
    };

    const isSuccess = responseData?.data?.status === true;

    /* ---------- UI ---------- */

    return (
        <>
            <ScrollView>
                <AnimatedCard style={{ margin: 16 }}>
                    <CustomInput
                        label="Mobile Number"
                        placeholder="Enter mobile number"
                        value={form.mobileno}
                        keyboardType="number-pad"
                        maxLength={10}
                        error={touched.mobileno ? errors.mobileno : undefined}
                        onChangeText={t => update("mobileno", t)}
                        iconStart={Smartphone}
                    />

                    <CustomInput
                        label="Aadhaar Number"
                        placeholder="Enter aadhaar number"
                        value={form.aadhaar}
                        keyboardType="number-pad"
                        maxLength={12}
                        error={touched.aadhaar ? errors.aadhaar : undefined}
                        onChangeText={t => update("aadhaar", t)}
                        iconStart={Fingerprint}
                    />

                    <CustomDropdown3
                        label="Select Bank"
                        value={form.bankIIN}
                        items={bankOptions}
                        placeholder="Choose your bank"
                        error={touched.bankIIN ? errors.bankIIN : undefined}
                        onSelect={(item) =>
                            setForm(prev => ({ ...prev, bankIIN: item.value }))
                        }
                    />

                    <BiometricScanner
                        key={biometricKey}
                        wadh=""
                        onScanSuccess={(data) => {
                            update("biometricData", data);
                            setErrors((prev:any) => ({ ...prev, biometricData: undefined }));
                        }}
                        onScanError={() => {
                            update("biometricData", "");
                            setErrors((prev:any) => ({
                                ...prev,
                                biometricData: "Biometric scan failed. Please try again."
                            }));
                        }}
                    />
                    {touched.biometricData && errors.biometricData && (
                        <Text style={{
                            color: "#EF4444",
                            fontSize: 11,
                            marginTop: 4,
                            fontWeight: "600",
                        }}>
                            {errors.biometricData}
                        </Text>
                    )}

                    <AnimatedButton
                        title="Submit"
                        loading={loading}
                        onPress={handleSubmit}
                        style={{marginTop:16}}
                    />
                </AnimatedCard>
            </ScrollView>

            {/* Response Modal - Sliding up/down like DmtTransferModal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.modalContainer, animatedStyle]}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Balance Enquiry Result</Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <X size={22} color={theme.colors.text.primary} />
                            </Pressable>
                        </View>

                        {responseData && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Status Icon */}
                                <View style={styles.statusIconContainer}>
                                    {responseData.data?.status ? (
                                        <CheckCircle size={60} color="#10B981" />
                                    ) : (
                                        <XCircle size={60} color="#EF4444" />
                                    )}
                                </View>

                                {/* Status Message */}
                                <View style={[
                                    styles.statusBadge,
                                    responseData.data?.status ? styles.successBadge : styles.errorBadge
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        responseData.data?.status ? styles.successText : styles.errorText
                                    ]}>
                                        {responseData.data?.message || responseData.message}
                                    </Text>
                                </View>

                                {/* Response Details */}
                                <View style={styles.detailsContainer}>
                                    <Text style={styles.sectionTitle}>Transaction Details</Text>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Acknowledgment No:</Text>
                                        <Text style={styles.detailValue}>{responseData.data?.ackno}</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Bank RRN:</Text>
                                        <Text style={styles.detailValue}>{responseData.data?.bankrrn}</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Bank IIN:</Text>
                                        <Text style={styles.detailValue}>{responseData.data?.bankiin}</Text>
                                    </View>

                                    <View style={styles.divider} />

                                    <Text style={styles.sectionTitle}>Balance Information</Text>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Current Balance:</Text>
                                        <Text style={styles.balanceValue}>
                                            {formatCurrency(responseData.data?.balanceamount || "0")}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Amount:</Text>
                                        <Text style={styles.detailValue}>
                                            {formatCurrency(responseData?.data?.balanceamount)}
                                        </Text>
                                    </View>

                                    <View style={styles.divider} />

                                    <Text style={styles.sectionTitle}>Additional Information</Text>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Mobile:</Text>
                                        <Text style={styles.detailValue}>
                                            {responseData.data?.mobile || form.mobileno || "N/A"}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Response Code:</Text>
                                        <Text style={styles.detailValue}>{responseData.data?.response_code}</Text>
                                    </View>

                                    {responseData.data?.errorcode !== 0 && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Error Code:</Text>
                                            <Text style={[styles.detailValue, styles.errorText]}>
                                                {responseData.data?.errorcode}
                                            </Text>
                                        </View>
                                    )}
                                </View>


                            </ScrollView>
                        )}
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    // Modal Styles - Matching DmtTransferModal
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: "flex-end",
    },
    modalContainer: {
        backgroundColor: theme.colors.background.light,
        borderTopLeftRadius: theme.borderRadius?.["2xl"] || 24,
        borderTopRightRadius: theme.borderRadius?.["2xl"] || 24,
        padding: theme.spacing[6] || 24,
        maxHeight: "85%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: theme.typography?.fontSizes?.["2xl"] || 24,
        fontWeight: "800",
        color: theme.colors.text.primary,
    },
    statusIconContainer: {
        alignItems: "center",
        marginVertical: 15,
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: "center",
        marginBottom: 20,
    },
    successBadge: {
        backgroundColor: "#D1FAE5",
    },
    errorBadge: {
        backgroundColor: "#FEE2E2",
    },
    statusText: {
        fontSize: 14,
        fontWeight: "600",
    },
    successText: {
        color: "#10B981",
    },
    errorText: {
        color: "#EF4444",
    },
    detailsContainer: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: theme.colors.text.primary,
        marginBottom: 12,
        marginTop: 16,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: "500",
        color: theme.colors.text.primary,
        flex: 1,
        textAlign: "right",
    },
    balanceValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#10B981",
        flex: 1,
        textAlign: "right",
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(0,0,0,0.1)",
        marginVertical: 15,
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
        marginBottom: 15,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        flex: 0.48,
    },
    printButton: {
        backgroundColor: "#6366F1",
    },
    downloadButton: {
        backgroundColor: "#8B5CF6",
    },
    actionButtonText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 8,
    },
    doneButton: {
        marginTop: 10,
        backgroundColor: theme.colors.primary[600],
        height: 56,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        shadowColor: theme.colors.primary[600],
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
        marginBottom: 20,
    },
    doneButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "800",
    },
});

export default BalanceEnquiry;