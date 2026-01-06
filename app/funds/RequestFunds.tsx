import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from "react-native";
import {
    Building2,
    QrCode,
    ChevronRight,
    Upload,
    Info,
    Copy,
    Calendar,
    CheckCircle2
} from "lucide-react-native";
import { theme } from "@/theme";
import { AnimatedCard } from "@/components/animated/AnimatedCard";
import * as Clipboard from "expo-clipboard";
import { getLatLong } from "@/utils/location";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import {
    getAdminBanksApi,
    getAdminQrsApi,
    GetAdminBanksOptions,
    fetchBankListApi,
} from "../api/funds.api";
import DropDownPicker from "react-native-dropdown-picker";

const { width } = Dimensions.get("window");

const RequestFunds = () => {
    // --- States ---
    const [method, setMethod] = useState<"bank" | "qr">("bank");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form States
    const [amount, setAmount] = useState("");
    const [utr, setUtr] = useState("");
    const [transactionDate, setTransactionDate] = useState("");

    // Dropdown States
    const [openPaymentMode, setOpenPaymentMode] = useState(false);
    const [paymentModeValue, setPaymentModeValue] = useState("UPI");
    const [paymentModes] = useState([
        { label: "UPI", value: "UPI" },
        { label: "IMPS", value: "IMPS" },
        { label: "NEFT", value: "NEFT" },
        { label: "RTGS", value: "RTGS" },
    ]);

    const [openBankPicker, setOpenBankPicker] = useState(false);
    const [selectedBankValue, setSelectedBankValue] = useState(null);

    // Data States
    const [banks, setBanks] = useState<any[]>([]);
    const [qrs, setQrs] = useState<any[]>([]);
    const userToken = useRef<string | null>(null);
    const [bankList, setBankList] = useState<any[]>([]);



    const loadBankList = async () => {
        try {
            setLoading(true);

            // 1. Get Location & Token
            const location = await getLatLong();
            const token = await SecureStore.getItemAsync("userToken");

            if (!location || !token) {
                console.error("Location or Token missing");
                return;
            }

            // 2. Prepare Options (matching FetchBankListOptions interface)
            const options = {
                domain: Constants.expoConfig?.extra?.tenantData?.domain || "laxmeepay.com",
                token: token,
                latitude: String(location.latitude),
                longitude: String(location.longitude),
                payload: {} // Add any specific filters if required by your API
            };

            // 3. Call the API
            const response = await fetchBankListApi(options);
            console.log("==banks==",response)

            // 4. Handle Response
            if (response.success && Array.isArray(response.data)) {
                const formattedBanks = response.data.map((bank: any) => ({
                    label: bank.bankName || bank.name, // Adjust key names based on your API response
                    value: bank.bankId?.toString() || bank.id?.toString(),
                }));
                setBankList(formattedBanks);
            } else {
                console.error("API Error:", response.message);
            }
        } catch (error) {
            console.error("Failed to fetch bank list:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            setLoading(true);
            const location = await getLatLong();
            if (!userToken.current) {
                userToken.current = await SecureStore.getItemAsync("userToken");
            }
            if (!location || !userToken.current) return;

            const options: GetAdminBanksOptions = {
                domain: Constants.expoConfig?.extra?.tenantData?.domain || "laxmeepay.com",
                token: userToken.current,
                latitude: String(location.latitude),
                longitude: String(location.longitude),
            };

            const [bankRes, qrRes] = await Promise.all([
                getAdminBanksApi(options),
                getAdminQrsApi(options),
            ]);

            if (bankRes.success) {
                setBanks(bankRes.data.map((item: any) => ({
                    label: item.bank_name,
                    value: item.id.toString(),
                    id: item.id.toString(),
                    name: item.bank_name,
                    acc: item.account_number,
                    ifsc: item.ifsc_code,
                    holder: item.account_holder_name,
                })));
            }

            if (qrRes.success) {
                setQrs(qrRes.data.map((item: any) => ({
                    id: item.id.toString(),
                    name: item.upi_id,
                    image: item.qr_image,
                })));
            }
        } catch (e) {
            console.error("Fetch Error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPaymentMethods();
        loadBankList();
    }, []);

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        // Add toast notification here
    };

    /* ---------------- COMPONENTS ---------------- */

    const renderPagination = () => {
        const data = method === "bank" ? banks : qrs;
        return (
            <View style={styles.pagination}>
                {data.map((_, i) => (
                    <View key={i} style={[styles.dot, selectedIndex === i && styles.activeDot]} />
                ))}
            </View>
        );
    };

    const Header = (
        <View style={styles.headerContainer}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>

            <View style={styles.methodRow}>
                <TouchableOpacity
                    style={[styles.methodCard, method === "bank" && styles.activeMethod]}
                    onPress={() => { setMethod("bank"); setSelectedIndex(0); }}
                >
                    <View style={[styles.iconCircle, method === "bank" && styles.activeIconCircle]}>
                        <Building2 size={24} color={method === "bank" ? "#FFF" : theme.colors.primary[500]} />
                    </View>
                    <Text style={[styles.methodLabel, method === "bank" && styles.activeMethodLabel]}>Bank Transfer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.methodCard, method === "qr" && styles.activeMethod]}
                    onPress={() => { setMethod("qr"); setSelectedIndex(0); }}
                >
                    <View style={[styles.iconCircle, method === "qr" && styles.activeIconCircle]}>
                        <QrCode size={24} color={method === "qr" ? "#FFF" : theme.colors.primary[500]} />
                    </View>
                    <Text style={[styles.methodLabel, method === "qr" && styles.activeMethodLabel]}>QR Scanner</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.carouselWrapper}>
                <FlatList
                    key={method} // Forces fresh render when switching tabs
                    data={method === "bank" ? banks : qrs}
                    horizontal
                    pagingEnabled
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) => {
                        const index = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
                        setSelectedIndex(index);
                    }}
                    renderItem={({ item }) => (
                        <View style={styles.carouselItem}>
                            {method === "bank" ? (
                                <AnimatedCard style={styles.bankCard}>
                                    <View style={styles.bankHeader}>
                                        <Building2 size={20} color="#FFF" />
                                        <Text style={styles.bankNameText}>{item.name}</Text>
                                    </View>
                                    <DetailItem label="Account Number" value={item.acc} onCopy={() => copyToClipboard(item.acc)} />
                                    <DetailItem label="IFSC Code" value={item.ifsc} onCopy={() => copyToClipboard(item.ifsc)} />
                                    <DetailItem label="Account Holder" value={item.holder} />
                                </AnimatedCard>
                            ) : (
                                <AnimatedCard style={styles.qrCard}>
                                    <View style={styles.qrBadge}><Text style={styles.qrBadgeText}>Scan to Pay</Text></View>
                                    <Image resizeMode="contain" source={{ uri: item.image }} style={styles.qrImage} />
                                    <Text style={styles.qrName}>{item.name}</Text>
                                </AnimatedCard>
                            )}
                        </View>
                    )}
                />
                {renderPagination()}
            </View>
        </View>
    );

    const Footer = (
        <AnimatedCard style={styles.formCard}>
            <Text style={styles.formTitle}>Transaction Details</Text>

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor={theme.colors.text.secondary}
            />

            <Text style={styles.inputLabel}>Payment Mode</Text>
            <DropDownPicker
                open={openPaymentMode}
                value={paymentModeValue}
                items={paymentModes}
                setOpen={setOpenPaymentMode}
                setValue={setPaymentModeValue}
                placeholder="Select mode"
                zIndex={3000}
                zIndexInverse={1000}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}

            />

           
            {paymentModeValue!="UPI" &&  
            <>
            <Text style={styles.inputLabel}>Select Bank *</Text>
            <DropDownPicker
                open={openBankPicker}
                value={selectedBankValue}
                items={bankList} // Using the state populated by the API call
                setOpen={setOpenBankPicker}
                setValue={setSelectedBankValue}
                placeholder="Select destination bank"
                searchable={true}
                loading={loading} // Show loading spinner inside dropdown
                zIndex={2000}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                labelStyle={{ color: '#FFF' }}
                listItemLabelStyle={{ color: '#FFF' }}
            />
            
            </>}
            
           

            <Text style={styles.inputLabel}>UTR / Reference Number</Text>
            <TextInput
                style={styles.input}
                placeholder="12-digit transaction ID"
                value={utr}
                onChangeText={setUtr}
                placeholderTextColor={theme.colors.text.secondary}
            />

            <Text style={styles.inputLabel}>Transaction Date</Text>
            <View style={styles.dateInputRow}>
                <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="DD-MM-YYYY"
                    value={transactionDate}
                    onChangeText={setTransactionDate}
                    placeholderTextColor={theme.colors.text.secondary}
                />
                <TouchableOpacity style={styles.calendarBtn}>
                    <Calendar size={20} color={theme.colors.primary[500]} />
                </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 20 }]}>Payment Proof</Text>
            <TouchableOpacity style={styles.uploadButton}>
                <Upload size={20} color={theme.colors.text.secondary} />
                <Text style={styles.uploadText}>Click to upload</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Submit Request</Text>
                <ChevronRight color="#FFF" size={20} />
            </TouchableOpacity>

            <View style={styles.infoBox}>
                <Info size={16} color={theme.colors.primary[500]} />
                <Text style={styles.infoText}>Requests are usually processed within 30 minutes.</Text>
            </View>
        </AnimatedCard>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <FlatList
                data={[]}
                renderItem={null}
                keyExtractor={() => "request-funds-form"}
                ListHeaderComponent={Header}
                ListFooterComponent={Footer}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            />
        </KeyboardAvoidingView>
    );
};

/* ---------------- HELPERS ---------------- */
const DetailItem = ({ label, value, onCopy }: any) => (
    <View style={styles.detailItem}>
        <View>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
        {onCopy && (
            <TouchableOpacity onPress={onCopy} style={styles.copyBtn}>
                <Copy size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
        )}
    </View>
);

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.dark },
    content: { padding: 16, paddingBottom: 40 },
    headerContainer: { zIndex: 10 },
    sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16 },

    methodRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
    methodCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        alignItems: "center",
        backgroundColor: theme.colors.background.light,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    activeMethod: {
        borderColor: theme.colors.primary[500],
        backgroundColor: theme.colors.primary[500] + '15'
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: theme.colors.neutral[800],
        justifyContent: "center",
        alignItems: "center",
    },
    activeIconCircle: { backgroundColor: theme.colors.primary[500] },
    methodLabel: { marginTop: 10, fontWeight: '600', color: theme.colors.text.secondary },
    activeMethodLabel: { color: theme.colors.primary[500] },

    carouselWrapper: { marginBottom: 20 },
    carouselItem: { width: width - 32 },

    // Pagination
    pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'gray' },
    activeDot: { width: 20, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary[500] },

    // Cards
    bankCard: { padding: 24, backgroundColor: theme.colors.primary[600], borderRadius: 24 },
    bankHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    bankNameText: { fontSize: 20, fontWeight: "800",color:'white' },

    qrCard: { alignItems: "center", backgroundColor: '#FFF', padding: 24, borderRadius: 24 },
    qrBadge: { backgroundColor: theme.colors.primary[50], paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 15 },
    qrBadgeText: { color: theme.colors.primary[600], fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    qrImage: { width: 180, height: 180, marginBottom: 15 },
    qrName: { fontSize: 16, fontWeight: "700", color: theme.colors.text.primary },

    // Form
    formCard: { backgroundColor: theme.colors.background.light, borderRadius: 24, padding: 20, zIndex: 5 },
    formTitle: { fontSize: 18, fontWeight: "700", marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.text.secondary, marginBottom: 8, marginTop: 12 },
    input: {
        backgroundColor: theme.colors.background.dark,
        borderRadius: 14,
        padding: 16,

        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        fontSize: 15
    },
    dropdown: {
        backgroundColor: theme.colors.background.dark,
        borderRadius: 14,
        borderColor: 'rgba(255,255,255,0.1)',
        minHeight: 55
    },
    dropdownContainer: {
        backgroundColor: theme.colors.background.dark,
        borderColor: 'rgba(255,255,255,0.1)',
        elevation: 5
    },
    dateInputRow: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
    calendarBtn: { position: 'absolute', right: 16 },

    uploadButton: {
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        padding: 20,
        borderRadius: 14,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginTop: 5,
        marginBottom: 25
    },
    uploadText: { color: theme.colors.text.secondary, fontWeight: '600' },

    submitButton: {
        backgroundColor: theme.colors.primary[500],
        padding: 18,
        borderRadius: 14,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: 'center',
        gap: 10,
        shadowColor: theme.colors.primary[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    submitButtonText: { color: "#FFF", fontWeight: "800", fontSize: 16 },

    infoBox: { flexDirection: 'row', gap: 10, marginTop: 20, padding: 12, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 12, alignItems: 'center' },
    infoText: { fontSize: 12, color: theme.colors.primary[400], flex: 1 },

    detailItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
    detailLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
    detailValue: { fontSize: 16, fontWeight: '600', marginTop: 2,color:'white' },
    copyBtn: { padding: 4 }
});

export default RequestFunds;