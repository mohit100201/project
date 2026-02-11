import CustomDatePicker from "@/components/ui/CustomDatePicker"
import CustomDropdown from "@/components/ui/CustomDropdown"
import { theme } from "@/theme"
import { router } from "expo-router"
import { Plus } from "lucide-react-native"
import { useEffect, useState, useCallback } from "react"
import { Text, TouchableOpacity, View, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from "react-native"
import Toast from "react-native-toast-message"
import { getLatLong } from '@/utils/location';
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { useBranding } from '@/context/BrandingContext';
import { getPayoutHistoryApi } from '../api/payout.api';

const SendPayoutScreen = () => {
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("");
    const [openStatus, setOpenStatus] = useState(false);
    const [statusValue, setStatusValue] = useState("All");
    const [status] = useState([
        { label: "All", value: "All" },
        { label: "Pending", value: "Pending" },
        { label: "Success", value: "Success" },
        { label: "Failed", value: "Failed" },
    ]);
    
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

     
    

    // helper to format date for API (YYYY-MM-DD)
    const formatDateForApi = (dateStr: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toISOString().split('T')[0];
    };

    const fetchPayoutHistory = useCallback(async (isRefreshing = false) => {
        try {
            if (isRefreshing) setRefreshing(true);
            else setLoading(true);

            const location = await getLatLong();
            const token = await SecureStore.getItemAsync("userToken");

            if (!location || !token) {
                Toast.show({ type: "error", text1: "Auth Error", text2: "Session or Location missing" });
                return;
            }

            const res = await getPayoutHistoryApi({
                token,
                latitude: location.latitude,
                longitude: location.longitude,
                params: {
                    status: statusValue === "All" ? "" : statusValue,
                    start_date: fromDate ? formatDateForApi(fromDate) : "2024-01-01",
                    end_date: toDate ? formatDateForApi(toDate) : "2026-12-31",
                    page: 1,
                    per_page: 50,
                },
            });

            console.log("==res==",res)

            if (res.success) {
                const apiData = res.data?.data || res.data?.items || res.data || [];
                setTransactions(Array.isArray(apiData) ? apiData : []);
            } else {
                Toast.show({ type: "error", text1: "Fetch Failed", text2: res.message });
            }
        } catch (error: any) {
            console.error(error);
            Toast.show({ type: "error", text1: "Error", text2: "Internal server error" });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [fromDate, toDate, statusValue]);

    useEffect(() => {
        fetchPayoutHistory();
    }, [fromDate, toDate, statusValue]);

    const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(date);
};

    const renderPayoutCard = ({ item }: { item: any }) => {
        const statusText = (item.status || "PENDING").toUpperCase();
        const statusColor =
            statusText === "SUCCESS" ? "#16a34a" :
            statusText === "PENDING" ? "#f59e0b" : "#dc2626";

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.dateText}>{formatDisplayDate(item.created_at || item.date)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                    </View>
                </View>
                <Text style={styles.beneficiaryName}>{item.beneficiary_name || item.name || "Unknown Recipient"}</Text>
                <View style={styles.cardFooter}>
                    <Text style={styles.modeText}>Mode: {item.transfer_mode || item.mode || "N/A"}</Text>
                    <Text style={styles.amountText}>
                        ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>Payout History</Text>
                <TouchableOpacity
                    style={styles.requestBtn}
                    activeOpacity={0.7}
                    onPress={() => router.push("/send-payout/RequestPayout")}
                >
                    <Plus size={16} color="#FFF" />
                    <Text style={styles.requestBtnText}>Request Payout</Text>
                </TouchableOpacity>
            </View>

            {/* Filters Section */}
            <View style={styles.filterContainer}>
                <View style={styles.dateRow}>
                    <View style={{ flex: 1 }}>
                        <CustomDatePicker
                            label="From Date"
                            dateValue={fromDate}
                            onDateChange={(val) => setFromDate(val)}
                            theme={theme}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <CustomDatePicker
                            label="To Date"
                            dateValue={toDate}
                            onDateChange={(val) => setToDate(val)}
                            theme={theme}
                        />
                    </View>
                </View>

                <View style={styles.dropdownWrapper}>
                    <CustomDropdown
                        label="Status"
                        open={openStatus}
                        value={statusValue}
                        items={status}
                        setOpen={setOpenStatus}
                        setValue={setStatusValue}
                        placeholder="Select Status"
                        zIndex={3000}
                    />
                </View>
            </View>

            {/* List Section */}
            <View style={{ flex: 1, marginTop: 10 }}>
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={theme.colors.primary[500]} style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={transactions}
                        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                        renderItem={renderPayoutCard}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No transactions found</Text>
                            </View>
                        )}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => fetchPayoutHistory(true)} tintColor={theme.colors.primary[500]} />
                        }
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 20, fontWeight: "800", color: '#1f2937' },
    requestBtn: {
        backgroundColor: theme.colors.primary[500],
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 25,
        gap: 6,
        elevation: 2
    },
    requestBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    filterContainer: { zIndex: 5000 },
    dateRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    dropdownWrapper: { width: "50%" },
    card: { 
        backgroundColor: "#fff", 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 12, 
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 }
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
    dateText: { fontSize: 12, color: "#6b7280" },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: "800" },
    beneficiaryName: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
    cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
    modeText: { fontSize: 13, color: "#6b7280", fontWeight: '500' },
    amountText: { fontSize: 17, fontWeight: "800", color: "#111827" },
    emptyState: { marginTop: 60, alignItems: 'center' },
    emptyText: { color: '#9ca3af', fontSize: 15, fontWeight: '500' }
});

export default SendPayoutScreen;