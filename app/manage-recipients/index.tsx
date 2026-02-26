import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    Pressable,
    Platform,
    StatusBar
} from "react-native";
import {
    CreditCard,
    Calendar,
    AlertCircle,
    X,
    Maximize2,
    Inbox,
    ChevronRight,
    Plus,
    Building2,
    CheckCircle2,
    User,
    ShieldCheck
} from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import { getLatLong } from "@/utils/location";
import { theme } from "@/theme";
import { AnimatedCard } from "@/components/animated/AnimatedCard";
import { router } from "expo-router";
import FundCardSkeleton from "@/components/shimmer/FundCardSkeleton";
import { getRecipients } from "@/api/recipients.api";

// Assuming your base URL for images
const IMAGE_BASE_URL = "https://your-api-domain.com/storage/";

const ManageRecipients = () => {
    // --- States ---
    const userToken = useRef<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [recipients, setRecipients] = useState<any[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // --- API Logic ---
    const fetchRecipientsData = async () => {
        try {
            setLoading(true);
            const location = await getLatLong();

            if (!userToken.current) {
                userToken.current = await SecureStore.getItemAsync("userToken");
            }

            if (!location || !userToken.current) return;

            const res = await getRecipients({
                latitude: location.latitude,
                longitude: location.longitude,
                token: userToken.current,
            });

            if (res.status === "success" || res.success) {
                setRecipients(res.data || []);
            }
        } catch (err) {
            console.error("Recipient Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipientsData();
    }, []);

    // --- Render Helpers ---
    const renderRecipientCard = ({ item, index }: { item: any, index: number }) => {
        // Determine status colors from your theme
        const statusKey = item.status.toLowerCase() as keyof typeof theme.colors.status;
        const config = theme.colors.status[statusKey] || theme.colors.status.pending;

        return (
            <AnimatedCard style={styles.card} delay={index * 50}>
                {/* 1. Header: Bank Name & Verification Status */}
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.bankLabel}>{item.bank_name}</Text>
                        <Text style={styles.holderName}>{item.account_holder_name}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
                        {item.is_paysprint_verified && (
                            <ShieldCheck size={12} color={config.main} style={{ marginRight: 4 }} />
                        )}
                        <Text style={[styles.statusText, { color: config.main }]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* 2. Body: Account Details */}
                <View style={styles.detailsGrid}>
                    <DetailRow
                        icon={<CreditCard size={14} color={theme.colors.text.tertiary} />}
                        label="Account Number"
                        value={item.account_number}
                    />
                    <DetailRow
                        icon={<Building2 size={14} color={theme.colors.text.tertiary} />}
                        label="IFSC Code"
                        value={item.ifsc_code}
                    />
                </View>
            </AnimatedCard>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header Section */}
            <View style={[styles.header,{marginTop:16}]}>
                <View>
                    <Text style={styles.headerTitle}></Text>

                </View>
                <TouchableOpacity
                    style={{
                        backgroundColor: theme.colors.primary[500],
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: 20,
                        gap: 6,
                    }}
                    activeOpacity={0.7}
                    onPress={() => { router.push("/manage-recipients/AddRecipients") }}
                >
                    <Plus size={16} color="#FFF" />
                    <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>Add Recipients</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.listContent}>
                    <FundCardSkeleton count={5} />
                </View>
            ) : (
                <FlatList
                    data={recipients}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderRecipientCard}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Inbox size={60} color={theme.colors.neutral[400]} strokeWidth={1} />
                            <Text style={styles.emptyTitle}>No Recipients Added</Text>
                            <Text style={styles.emptySub}>Add a beneficiary to start transfers.</Text>
                        </View>
                    }
                    ListFooterComponent={<View style={{ height: 100 }} />}
                />
            )}

            {/* Document Preview Modal */}
            <Modal visible={!!previewImage} transparent animationType="fade" statusBarTranslucent>
                <View style={styles.modalContainer}>
                    <Pressable style={styles.closeButton} onPress={() => setPreviewImage(null)}>
                        <X color="#FFF" size={28} />
                    </Pressable>
                    {previewImage && (
                        <Image
                            source={{ uri: previewImage }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
};

// Internal Helper Components
const DetailRow = ({ icon, label, value }: any) => (
    <View style={styles.detailRow}>
        <View style={styles.iconCircle}>{icon}</View>
        <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value || 'N/A'}</Text>
        </View>
        <ChevronRight size={14} color={theme.colors.neutral[300]} />
    </View>
);

const HashIcon = ({ size, color }: any) => (
    <Text style={{ fontSize: size, color: color, fontWeight: '900' }}>#</Text>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.dark },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,

    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text.primary },
    headerSub: { fontSize: 13, color: theme.colors.text.tertiary, marginTop: 2 },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary[500],
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: theme.colors.primary[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    listContent: { padding: 16 },
    card: {
        backgroundColor: theme.colors.background.light,
        padding: 16,
        marginBottom: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
    bankRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    bankLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.text.tertiary, textTransform: 'uppercase' },
    holderName: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1
    },
    statusText: { fontSize: 10, fontWeight: "800" },
    divider: { height: 1, backgroundColor: theme.colors.border.light, marginVertical: 12 },
    detailsGrid: { gap: 14 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.neutral[50], justifyContent: 'center', alignItems: 'center' },
    detailLabel: { fontSize: 11, color: theme.colors.text.tertiary, marginBottom: 1 },
    detailValue: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary },
    rejectBox: {
        flexDirection: 'row',
        backgroundColor: theme.colors.status.rejected.bg,
        padding: 12,
        borderRadius: 10,
        marginTop: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: theme.colors.status.rejected.border
    },
    rejectTitle: { fontSize: 11, fontWeight: '700', color: theme.colors.status.rejected.main },
    rejectText: { fontSize: 12, color: theme.colors.status.rejected.main, opacity: 0.8 },
    documentActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light
    },
    docButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.primary[50],
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10
    },
    docButtonText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary[600] },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
    fullImage: { width: '100%', height: '70%' },
    closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 8 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary, marginTop: 16 },
    emptySub: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 4 },
});

export default ManageRecipients;