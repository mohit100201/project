import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    Pressable,
    Platform
} from "react-native";
import {
    Hash,
    CreditCard,
    Calendar,
    AlertCircle,
    X,
    Maximize2,
    Inbox,
    ChevronRight,
    Plus
} from "lucide-react-native";
import Constants from "expo-constants";
import { useBranding } from '@/context/BrandingContext';
import * as SecureStore from "expo-secure-store";
import { getLatLong } from "@/utils/location";
import { theme } from "@/theme";
import { AnimatedCard } from "@/components/animated/AnimatedCard";
import { getFundRequestsApi } from "../../api/funds.api";
import { router } from "expo-router";
import FundCardSkeleton from "@/components/shimmer/FundCardSkeleton";
// Import your new separate skeleton component


const FundsScreen = () => {
    // --- States ---
    const userToken = useRef<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [fundRequests, setFundRequests] = useState<any[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

     

    // --- API Logic ---
    const fetchFundRequests = async (targetPage = 1, isLoadMore = false, isRefreshing = false) => {
        if (isLoadMore && (loadingMore || !hasMore)) return;

        try {
            if (isRefreshing) setRefreshing(true);
            else if (isLoadMore) setLoadingMore(true);
            else setLoading(true);

            const location = await getLatLong();
            if (!userToken.current) {
                userToken.current = await SecureStore.getItemAsync("userToken");
            }

            if (!location || !userToken.current) return;

            const res = await getFundRequestsApi({
              
                latitude: location.latitude,
                longitude: location.longitude,
                token: userToken.current,
                page: targetPage,
                perPage: 10,
            });

            if (res.success) {
                const newItems = res.data.items || [];
                setFundRequests((prev) => {
                    if (targetPage === 1) return newItems;
                    const map = new Map();
                    [...prev, ...newItems].forEach((item) => map.set(item.id.toString(), item));
                    return Array.from(map.values());
                });
                setHasMore(newItems.length === 10);
                setPage(targetPage);
            }
        } catch (err) {
            console.error("Fund Fetch error:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchFundRequests(1);
    }, []);

    // --- Callbacks ---
    const handleLoadMore = useCallback(() => {
        if (hasMore && !loadingMore && !loading && !refreshing) {
            fetchFundRequests(page + 1, true);
        }
    }, [page, hasMore, loadingMore, loading, refreshing]);

    const onRefresh = useCallback(() => {
        fetchFundRequests(1, false, true);
    }, []);

    // --- Render Helpers ---
    const renderFundCard = ({ item, index }: { item: any, index: number }) => {
        const statusKey = item.status.toLowerCase() as keyof typeof theme.colors.status;
        const config = theme.colors.status[statusKey] || theme.colors.status.pending;

        return (
            <AnimatedCard style={styles.card} delay={index * 50}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.amountLabel}>Requested Amount</Text>
                        <Text style={styles.amountText}>₹{parseFloat(item.amount).toFixed(2)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
                        <View style={[styles.statusDot, { backgroundColor: config.main }]} />
                        <Text style={[styles.statusText, { color: config.main }]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailsGrid}>
                    <DetailRow icon={<Hash size={14} color={theme.colors.text.tertiary} />} label="Reference Number" value={item.utr_number} />
                    <DetailRow icon={<CreditCard size={14} color={theme.colors.text.tertiary} />} label="Payment Mode" value={item.method.toUpperCase()} />
                    <DetailRow
                        icon={<Calendar size={14} color={theme.colors.text.tertiary} />}
                        label="Date"
                        value={new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    />
                </View>

                {statusKey === 'rejected' && item.reject_reason && (
                    <View style={styles.rejectBox}>
                        <AlertCircle size={16} color={theme.colors.status.rejected.main} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rejectTitle}>Rejection Reason</Text>
                            <Text style={styles.rejectText}>{item.reject_reason}</Text>
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    onPress={() => setPreviewImage(item.file)}
                    style={styles.imagePreviewContainer}
                    activeOpacity={0.9}
                >
                    <Image source={{ uri: item.file }} style={styles.proofImage} resizeMode="cover" />
                    <View style={styles.imageOverlay}>
                        <View style={styles.viewButton}>
                            <Maximize2 size={14} color="#FFF" />
                            <Text style={styles.viewButtonText}>View Proof</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </AnimatedCard>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}></Text>
                <TouchableOpacity
                    style={styles.addFundButton}
                    activeOpacity={0.7}
                    onPress={() => { router.push("/funds/RequestFunds") }}
                >
                    <Plus size={16} color="#FFF" />
                    <Text style={styles.addFundText}>Request Fund</Text>
                </TouchableOpacity>
            </View>

            {/* Content Section */}
            {loading && page === 1 ? (
                // Show Shimmer when loading first page
                <View style={styles.listContent}>
                    <FundCardSkeleton count={5} />
                </View>
            ) : (
                <FlatList
                    data={fundRequests}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderFundCard}
                    contentContainerStyle={[styles.listContent]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[theme.colors.primary[500]]}
                            tintColor={theme.colors.primary[500]}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.2}
                    ListEmptyComponent={
                        <View style={[styles.emptyContainer]}>
                            <Inbox size={64} color={theme.colors.neutral[300]} strokeWidth={1} />
                            <Text style={styles.emptyTitle}>No Requests Found</Text>
                            <Text style={styles.emptySub}>Your fund history is currently empty.</Text>
                        </View>
                    }
                    ListFooterComponent={() =>
                        loadingMore ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                                <Text style={styles.loaderText}>Loading more requests...</Text>
                            </View>
                        ) : <View style={{ height: 100 }} />
                    }
                    removeClippedSubviews={Platform.OS === 'android'}
                />
            )}

            {/* Image Preview Modal */}
            <Modal visible={!!previewImage} transparent animationType="fade" statusBarTranslucent>
                <View style={styles.modalContainer}>
                    <Pressable style={styles.closeButton} onPress={() => setPreviewImage(null)}>
                        <X color="#FFF" size={28} />
                    </Pressable>
                    {previewImage && (
                        <Image source={{ uri: previewImage }} style={styles.fullImage} resizeMode="contain" />
                    )}
                </View>
            </Modal>
        </View>
    );
};

const DetailRow = ({ icon, label, value }: any) => (
    <View style={styles.detailRow}>
        <View style={styles.iconCircle}>{icon}</View>
        <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{value || 'N/A'}</Text>
        </View>
        <ChevronRight size={14} color={theme.colors.neutral[200]} />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.dark },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16, 
        margin: 16 
    },
    headerTitle: { fontSize: 20, fontWeight: '600', color: theme.colors.text.primary },
    listContent: { padding: theme.layout.screenPadding },
    card: {
        backgroundColor: theme.colors.background.light,
        padding: theme.layout.cardPadding,
        marginBottom: theme.spacing[4],
        borderRadius: theme.borderRadius.card,
        ...theme.shadows?.sm,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
    amountLabel: { ...theme.typography.variants.label, color: theme.colors.text.tertiary, marginBottom: 2 },
    amountText: { ...theme.typography.variants.h2, color: theme.colors.text.primary, fontWeight: '800' },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { fontSize: 11, fontWeight: "700" },
    divider: { height: 1, backgroundColor: theme.colors.border.light, marginBottom: 16 },
    detailsGrid: { gap: 12 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.neutral[50], justifyContent: 'center', alignItems: 'center' },
    detailLabel: { ...theme.typography.variants.caption, color: theme.colors.text.tertiary },
    detailValue: { ...theme.typography.variants.bodyBold, color: theme.colors.text.primary },
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
    rejectTitle: { fontSize: 11, fontWeight: '700', color: theme.colors.status.rejected.main, marginBottom: 2 },
    rejectText: { fontSize: 12, color: theme.colors.status.rejected.main, opacity: 0.8, lineHeight: 16 },
    imagePreviewContainer: {
        height: 140,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 16,
        backgroundColor: theme.colors.neutral[900]
    },
    proofImage: { width: '100%', height: '100%', opacity: 0.8 },
    imageOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)'
    },
    viewButtonText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
    fullImage: { width: '100%', height: '80%' },
    closeButton: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
    emptyTitle: { ...theme.typography.variants.h2, color: theme.colors.text.primary, marginTop: 16 },
    emptySub: { ...theme.typography.variants.body, color: theme.colors.text.secondary, marginTop: 8 },
    footerLoader: { paddingVertical: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
    loaderText: { ...theme.typography.variants.caption, color: theme.colors.text.secondary },
    addFundButton: {
        backgroundColor: theme.colors.primary[500],
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        gap: 6,
    },
    addFundText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});

export default FundsScreen;