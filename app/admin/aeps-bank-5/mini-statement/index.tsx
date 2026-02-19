import { useEffect, useState } from "react";
import {
    Text,
    View,
    ScrollView,
    StyleSheet,
    Modal,
    Pressable,
    FlatList
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
import { paysprinBankList, paysprintMiniStatement } from "@/api/paysprint.api";

import { AnimatedCard } from "@/components/animated/AnimatedCard";
import CustomInput from "@/components/ui/CustomInput";
import { AnimatedButton } from "@/components/animated/AnimatedButton";
import DropDownPicker from "react-native-dropdown-picker";
import { theme } from "@/theme";
import { BiometricScanner } from "@/components/ui/BiometricScanner";
import {
    X,
    CheckCircle,
    XCircle,
    Printer,
    Download,
    ArrowRight,
    Calendar,
    IndianRupee,
    Receipt,
    Smartphone,
    Fingerprint
} from "lucide-react-native";
import CustomDropdown3 from "@/components/ui/CustomDropdwon3";

interface MiniStatementForm {
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

// Transaction item interface matching actual API response
interface TransactionItem {
    date: string;        // "24/12"
    amount: number;      // 7
    txnType: string;     // "D" or "C"
    narration: string;   // "POS/W/        "
}

// Response type for mini statement matching actual API response
interface MiniStatementResponse {
    success: boolean;
    code: number;
    message: string;
    data: {
        status: boolean;
        ackno: number;
        datetime: string;
        balanceamount: string;
        bankrrn: number;
        bankiin: string;
        message: string;
        error_code: string;
        ministatement: TransactionItem[];
        response_code: number;
    };
}

const MiniStatement = () => {
    /* ---------------- STATE ---------------- */

    const [bankOptions, setBankOptions] = useState<DropdownItem[]>([]);
    const [bankOpen, setBankOpen] = useState(false);
    const [dropdownKey, setDropdownKey] = useState(0);
const [biometricKey, setBiometricKey] = useState(0);

const handleFullReset = () => {
    // 1. Reset Form (Preserving IP)
    setForm(prev => ({
        mobileno: "",
        aadhaar: "",
        bankIIN: "",
        biometricData: "",
        ipAddress: prev.ipAddress, 
    }));

    // 2. Clear Validation States
    setErrors({});
    setTouched({
        mobileno: false,
        aadhaar: false,
        bankIIN: false,
        biometricData: false,
    });

    // 3. Force Re-mount of custom components
    setDropdownKey(prev => prev + 1);
    setBiometricKey(prev => prev + 1);
};

    const [form, setForm] = useState<MiniStatementForm>({
        mobileno: "",
        aadhaar: "",
        bankIIN: "",
        biometricData: "",
        ipAddress: ""
    });

    const [errors, setErrors] = useState<{
        mobileno?: string;
        aadhaar?: string;
        bankIIN?: string;
        biometricData?: string;
        ipAddress?: string;
    }>({});

    const [touched, setTouched] = useState<{
        mobileno: boolean;
        aadhaar: boolean;
        bankIIN: boolean;
        biometricData: boolean;
    }>({
        mobileno: false,
        aadhaar: false,
        bankIIN: false,
        biometricData: false,
    });

    const [loading, setLoading] = useState(false);

    // Modal states
    const [modalVisible, setModalVisible] = useState(false);
    const [responseData, setResponseData] = useState<MiniStatementResponse | null>(null);

    // Animation value for the modal
    const translateY = useSharedValue(700);

    useEffect(() => {
        translateY.value = modalVisible
            ? withSpring(0, { damping: 18 })
            : withTiming(700);
    }, [modalVisible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    /* ---------------- HELPERS ---------------- */

    const update = (key: keyof MiniStatementForm, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
        // Clear error for this field when user starts typing
        if (errors[key as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [key]: undefined }));
        }
    };

    const parseNPCIData = (data: string[]): TransactionItem[] => {
        if (!data || data.length === 0) return [];

        return data
            .filter(row => row.includes('DR') || row.includes('CR')) // Filter out balance line
            .map(row => {
                // Raw: "/02/26DR TO TRANSFER   000000099900"
                const date = row.substring(0, 6).replace(/\//g, '').trim(); // "02/26"
                const type = row.includes('CR') ? 'C' : 'D';
                const typeIndex = row.indexOf(type === 'C' ? 'CR' : 'DR');

                // Narration is between the Type and the Amount
                const narration = row.substring(typeIndex + 2, row.length - 12).trim();

                // Amount is the last 12 digits (in paisa)
                const amountRaw = row.substring(row.length - 12);
                const amount = parseFloat(amountRaw) / 100;

                return {
                    date: row.substring(0, 6), // Keeps "/02/26"
                    amount,
                    txnType: type,
                    narration: narration || "Transfer"
                };
            });
    };

    const handleBlur = (field: keyof typeof touched) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        // Validate the field on blur
        validateField(field);
    };

    /* ---------------- BANK LIST ---------------- */

    const fetchBankList = async () => {
        try {
            const location = await getLatLong();
            if (!location) {
                Toast.show({
                    type: "error",
                    text1: "Location Required",
                    text2: "Please enable location permission",
                });
                return;
            }

            const token = await SecureStore.getItemAsync("userToken");
            if (!token) throw new Error("User not authenticated");

            const response = await paysprinBankList({
                token,
                latitude: location.latitude,
                longitude: location.longitude,
            });

            if (response?.success) {
                const list: DropdownItem[] =
                    response.data.banklist.data.map((b: any) => ({
                        label: b.bankName,
                        value: b.iinno,
                    }));

                setBankOptions(list);
            } else {
                throw new Error(response?.message || "Failed to fetch banks");
            }
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Bank List Error",
                text2: err.message || "Network Error",
            });
        }
    };

    useEffect(() => {
        fetchBankList();
    }, []);

    useEffect(() => {
        // Dynamic IP fetch
        fetch("https://api.ipify.org?format=json")
            .then(res => res.json())
            .then(data => update("ipAddress", data.ip))
            .catch(() => {
                update("ipAddress", "192.168.1.1"); // Fallback IP
                console.error("IP fetch failed");
            });
    }, []);

    /* ---------------- VALIDATION ---------------- */

    const validateField = (field: keyof typeof touched) => {
        let errorMessage = "";

        switch (field) {
            case "mobileno":
                if (!form.mobileno.trim()) {
                    errorMessage = "Mobile number is required";
                } else if (!/^[6-9]\d{9}$/.test(form.mobileno)) {
                    errorMessage = "Enter valid 10-digit mobile number starting with 6-9";
                }
                break;

            case "aadhaar":
                if (!form.aadhaar.trim()) {
                    errorMessage = "Aadhaar number is required";
                } else if (!/^\d{12}$/.test(form.aadhaar)) {
                    errorMessage = "Enter valid 12-digit Aadhaar number";
                }
                break;

            case "bankIIN":
                if (!form.bankIIN) {
                    errorMessage = "Please select a bank";
                }
                break;

            case "biometricData":
                if (!form.biometricData) {
                    errorMessage = "Biometric scan is required";
                }
                break;
        }

        setErrors(prev => ({ ...prev, [field]: errorMessage }));
        return !errorMessage;
    };

    const validate = () => {
        const mobileValid = validateField("mobileno");
        const aadhaarValid = validateField("aadhaar");
        const bankValid = validateField("bankIIN");
        const biometricValid = validateField("biometricData");

        // Mark all fields as touched
        setTouched({
            mobileno: true,
            aadhaar: true,
            bankIIN: true,
            biometricData: true,
        });

        return mobileValid && aadhaarValid && bankValid && biometricValid;
    };

    /* ---------------- SUBMIT ---------------- */

    const handleSubmit = async () => {
         if (loading) return;
        if (!validate()) {
            Toast.show({
                type: "error",
                text1: "Validation Failed",
                text2: "Please fix the errors before submitting",
            });
            return;
        }

        setLoading(true);

        try {
            // 📍 Get location
            const location = await getLatLong();

            if (!location) {
                Toast.show({
                    type: "error",
                    text1: "Location Required",
                    text2: "Please enable location permission to continue",
                });
                setLoading(false);
                return;
            }

            const token = await SecureStore.getItemAsync("userToken");

            if (!token) {
                throw new Error("User not authenticated");
            }

            const payload = {
                token: token,
                latitude: location.latitude,
                longitude: location.longitude,
                bank: "bank5",
                accessmodetype: "APP",
                piddata: form.biometricData,
                ipaddress: form.ipAddress,
                mobilenumber: form.mobileno,
                adhaarnumber: form.aadhaar,
                nationalbankidentificationnumber: form.bankIIN,
            };

            const res = await paysprintMiniStatement(payload);

            if (!res || typeof res !== "object")
                throw new Error("Invalid server response");

            // Set response data and show modal
            setResponseData(res);
            setModalVisible(true);

            if (res?.success && res.data?.status) {

                const rawNPCI = res.data?.ministatementlist?.npcidata;

                if (rawNPCI && rawNPCI.length > 0) {
                    // Parse raw strings into your TransactionItem format
                    res.data.ministatement = parseNPCIData(rawNPCI);

                    // Extract balance from the last line if available (e.g., "14634.07 CR")
                    const lastLine = rawNPCI[rawNPCI.length - 1];
                    if (lastLine.includes('.') && !res.data.balanceamount) {
                        res.data.balanceamount = lastLine.split(' ')[0];
                    }
                }
                Toast.show({
                    type: "success",
                    text1: "Success",
                    text2: "Mini statement fetched successfully",
                });
                // Reset form on success
                setForm({
                    mobileno: "",
                    aadhaar: "",
                    bankIIN: "",
                    biometricData: "",
                    ipAddress: form.ipAddress, // Keep IP address
                });
                setTouched({
                    mobileno: false,
                    aadhaar: false,
                    bankIIN: false,
                    biometricData: false,
                });
            } else {
                throw new Error(res?.message || "Mini statement failed");
            }
        } catch (err: any) {
            console.log("err", err)
            Toast.show({
                type: "error",
                text1: "Statement Error",
                text2: err.message || "Network Error",
            });
        } finally {
            handleFullReset()
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number | string) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `₹${numAmount.toFixed(2)}`;
    };

    const formatDate = (dateStr: string) => {
        // Already in format "24/12" from API
        return dateStr;
    };

    const handlePrint = () => {
        // Implement print functionality
        Toast.show({
            type: "info",
            text1: "Print",
            text2: "Print functionality coming soon",
        });
    };

    const handleDownload = () => {
        // Implement download functionality
        Toast.show({
            type: "info",
            text1: "Download",
            text2: "Download functionality coming soon",
        });
    };

    // Render transaction item
    const renderTransaction = ({ item, index }: { item: TransactionItem; index: number }) => (
        <View style={styles.transactionItem} key={index}>
            <View style={styles.transactionHeader}>
                <View style={styles.transactionDateTime}>
                    <Calendar size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
                </View>
                <View style={[
                    styles.transactionTypeBadge,
                    item.txnType === 'C' ? styles.creditBadge : styles.debitBadge
                ]}>
                    <Text style={[
                        styles.transactionTypeText,
                        item.txnType === 'C' ? styles.creditText : styles.debitText
                    ]}>
                        {item.txnType === 'C' ? 'CREDIT' : 'DEBIT'}
                    </Text>
                </View>
            </View>

            <Text style={styles.transactionNarration}>{item.narration.trim()}</Text>

            <View style={styles.transactionFooter}>
                <Text style={[
                    styles.transactionAmount,
                    item.txnType === 'C' ? styles.creditAmount : styles.debitAmount
                ]}>
                    {item.txnType === 'C' ? '+' : '-'}{formatCurrency(item.amount)}
                </Text>
            </View>
        </View>
    );

    /* ---------------- UI ---------------- */

    return (
        <>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                <AnimatedCard style={{ marginTop: 16, marginHorizontal: 16 }}>
                    {/* Mobile */}
                    <CustomInput
                        label="Mobile Number"
                        placeholder="Enter mobile number"
                        value={form.mobileno}
                        maxLength={10}
                        keyboardType="number-pad"
                        error={touched.mobileno ? errors.mobileno : undefined}
                        onChangeText={(text) => update("mobileno", text)}
                        onBlur={() => handleBlur("mobileno")}
                        iconStart={Smartphone}
                    />

                    {/* Aadhaar */}
                    <CustomInput
                        label="Aadhaar Number"
                        placeholder="Enter Aadhaar number"
                        value={form.aadhaar}
                        maxLength={12}
                        keyboardType="number-pad"
                        error={touched.aadhaar ? errors.aadhaar : undefined}
                        onChangeText={(text) => update("aadhaar", text)}
                        onBlur={() => handleBlur("aadhaar")}
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

                    {/* Biometric Scanner with reset key */}
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
                            fontSize: 12,
                            marginTop: 4,
                            marginBottom: 8
                        }}>
                            {errors.biometricData}
                        </Text>
                    )}

                    {/* Submit */}
                    <AnimatedButton
                        title="Get Mini Statement"
                        onPress={handleSubmit}
                        variant="primary"
                        size="large"
                        loading={loading}
                        style={{ marginTop: 20 }}

                    />
                </AnimatedCard>
            </ScrollView>

            {/* Response Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.modalContainer, animatedStyle]}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Mini Statement</Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <X size={22} color={theme.colors.text.primary} />
                            </Pressable>
                        </View>

                        {responseData && (
                            <>
                                {/* Status Section */}
                                {responseData.data?.status ? (
                                    <View style={styles.successHeader}>
                                        <CheckCircle size={40} color="#10B981" />
                                        <Text style={styles.successHeaderText}>
                                            Statement Generated Successfully
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.errorHeader}>
                                        <XCircle size={40} color="#EF4444" />
                                        <Text style={styles.errorHeaderText}>
                                            {responseData.data?.message || responseData.message}
                                        </Text>
                                    </View>
                                )}

                                {/* Balance Summary */}
                                {responseData.data?.status && (
                                    <View style={styles.accountSummary}>
                                        <View style={styles.summaryRow}>
                                            <Text style={styles.summaryLabel}>Current Balance</Text>
                                            <Text style={styles.balanceValue}>
                                                {formatCurrency(responseData.data.balanceamount)}
                                            </Text>
                                        </View>
                                        <View style={styles.summaryRow}>
                                            <Text style={styles.summaryLabel}>Date & Time</Text>
                                            <Text style={styles.summaryValue}>
                                                {responseData.data.datetime}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Transaction List */}
                                {responseData.data?.status && responseData.data.ministatement && (
                                    <View style={styles.transactionsContainer}>
                                        <Text style={styles.transactionsTitle}>
                                            Recent Transactions ({responseData.data.ministatement.length})
                                        </Text>

                                        <FlatList
                                            data={responseData.data.ministatement}
                                            renderItem={renderTransaction}
                                            keyExtractor={(item, index) => index.toString()}
                                            showsVerticalScrollIndicator={false}
                                            contentContainerStyle={styles.transactionsList}
                                            ListEmptyComponent={
                                                <Text style={styles.emptyText}>
                                                    No transactions found
                                                </Text>
                                            }
                                        />
                                    </View>
                                )}

                                {/* Transaction Details */}
                                {responseData.data?.status && (
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

                                        {responseData.data?.error_code !== "0" && (
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Error Code:</Text>
                                                <Text style={[styles.detailValue, styles.errorText]}>
                                                    {responseData.data?.error_code}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Action Buttons */}
                                {responseData.data?.status && (
                                    <View style={styles.actionButtons}>
                                        <Pressable
                                            style={[styles.actionButton, styles.printButton]}
                                            onPress={handlePrint}
                                        >
                                            <Printer size={20} color="#FFF" />
                                            <Text style={styles.actionButtonText}>Print</Text>
                                        </Pressable>

                                        <Pressable
                                            style={[styles.actionButton, styles.downloadButton]}
                                            onPress={handleDownload}
                                        >
                                            <Download size={20} color="#FFF" />
                                            <Text style={styles.actionButtonText}>Download</Text>
                                        </Pressable>
                                    </View>
                                )}

                                {/* Done Button */}
                                <Pressable
                                    style={styles.doneButton}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.doneButtonText}>Close</Text>
                                    <ArrowRight color="#FFF" size={18} />
                                </Pressable>
                            </>
                        )}
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    // Modal Styles
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
    successHeader: {
        alignItems: "center",
        marginVertical: 15,
        gap: 8,
    },
    successHeaderText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#10B981",
        textAlign: "center",
    },
    errorHeader: {
        alignItems: "center",
        marginVertical: 15,
        gap: 8,
    },
    errorHeaderText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#EF4444",
        textAlign: "center",
    },
    accountSummary: {
        backgroundColor: "#F3F4F6",
        borderRadius: 12,
        padding: 16,
        marginVertical: 15,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.text.primary,
    },
    balanceValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#10B981",
    },
    transactionsContainer: {
        marginTop: 10,
    },
    transactionsTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: theme.colors.text.primary,
        marginBottom: 12,
    },
    transactionsList: {
        paddingBottom: 400,
    },
    transactionItem: {
        backgroundColor: "#F9FAFB",
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    transactionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    transactionDateTime: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    transactionDate: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginLeft: 4,
    },
    transactionTypeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    creditBadge: {
        backgroundColor: "#D1FAE5",
    },
    debitBadge: {
        backgroundColor: "#FEE2E2",
    },
    transactionTypeText: {
        fontSize: 10,
        fontWeight: "700",
    },
    creditText: {
        color: "#10B981",
    },
    debitText: {
        color: "#EF4444",
    },
    transactionNarration: {
        fontSize: 14,
        fontWeight: "500",
        color: theme.colors.text.primary,
        marginBottom: 6,
    },
    transactionFooter: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    transactionAmount: {
        fontSize: 14,
        fontWeight: "600",
    },
    creditAmount: {
        color: "#10B981",
    },
    debitAmount: {
        color: "#EF4444",
    },
    detailsContainer: {
        marginTop: 15,
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
    errorText: {
        color: "#EF4444",
    },
    emptyText: {
        textAlign: "center",
        color: theme.colors.text.secondary,
        padding: 20,
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

export default MiniStatement;