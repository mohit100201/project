import { theme } from "@/theme";
import { router, useFocusEffect } from "expo-router";
import { Plus, Calendar, Hash, MessageSquare, AlertCircle } from "lucide-react-native";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from "react-native"
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { useBranding } from '@/context/BrandingContext';
import { useCallback, useEffect, useState } from 'react';
import { getLatLong } from "@/utils/location";
import { getTicketsApi } from "../../api/complaintsTickets.api";
import TicketSkeleton from "@/components/shimmer/TicketSkeleton";


const MyComplaints = () => {
    const [tickets, setTickets] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

     
    

    const fetchTickets = async (pageNumber = 1, isRefreshing = false) => {
        try {
            if (isRefreshing) setRefreshing(true);
            else setLoading(true);

            const location = await getLatLong();
            const token = await SecureStore.getItemAsync("userToken");

            const res = await getTicketsApi({
                page: pageNumber,
                per_page: 10,
               
                latitude: location?.latitude?.toString() || "0",
                longitude: location?.longitude?.toString() || "0",
                token: token || "",
            });

            if (res.success) {
                setTickets(pageNumber === 1 ? res.data.items : [...tickets, ...res.data.items]);
                setPagination(res.data.meta);
            }
        } catch (err) {
            console.error("Ticket fetch error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchTickets(1); // Call your existing fetch function
        }, [])
    );

    const onRefresh = () => {
        fetchTickets(1, true);
    };

    const getStatusStyle = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'open': return { bg: '#ecfdf5', text: '#10b981' };
            case 'closed': return { bg: '#f1f5f9', text: '#64748b' };
            case 'pending': return { bg: '#fffbeb', text: '#f59e0b' };
            default: return { bg: '#f3f4f6', text: '#374151' };
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#3b82f6';
            default: return '#64748b';
        }
    };

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

    const renderTicketItem = ({ item }: { item: any }) => {
        const statusStyle = getStatusStyle(item.status);
        const priorityColor = getPriorityStyle(item.priority);

        return (
            <View style={styles.ticketCard}>
                {/* Header: Ticket ID & Status */}
                <View style={styles.cardHeader}>
                    <View style={styles.idBadge}>
                        <Hash size={12} color="#64748B" />
                        {/* <Text style={styles.ticketIdText}>{item.ticket_number}</Text> */}
                        <Text style={styles.ticketIdText}>{item.id}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Subject */}
                <Text style={styles.subjectText}>{item.subject}</Text>

                {/* Description */}
                <View style={styles.descRow}>
                    <MessageSquare size={14} color="#94A3B8" style={{ marginTop: 2 }} />
                    <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>
                </View>

                <View style={styles.divider} />

                {/* Footer: Priority & Date */}
                <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                        <AlertCircle size={14} color={priorityColor} />
                        <Text style={[styles.footerText, { color: priorityColor, fontWeight: '700' }]}>
                            {item.priority.toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Calendar size={14} color="#94A3B8" />
                        <Text style={styles.footerText}>
                            {formatDisplayDate(item.created_at)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.headerTitle}>Support Tickets</Text>
                    <Text style={styles.headerSubtitle}>Manage your complaints</Text>
                </View>
                <TouchableOpacity
                    style={styles.requestBtn}
                    activeOpacity={0.7}
                    onPress={() => router.push("/complain-tickets/createTicket")} // Ensure path is correct
                >
                    <Plus size={16} color="#FFF" />
                    <Text style={styles.requestBtnText}>New Ticket</Text>
                </TouchableOpacity>
            </View>

            {loading && tickets.length === 0 ? (
                <>
                    <TicketSkeleton />
                    <TicketSkeleton />
                    <TicketSkeleton />
                    <TicketSkeleton />

                </>

            ) : (
                <FlatList
                    data={tickets}
                    renderItem={renderTicketItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary[500]]} />
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No tickets found.</Text>
                            </View>
                        ) : null
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,

    },
    headerTitle: { fontSize: 20, fontWeight: "900", color: '#1e293b' },
    headerSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
    requestBtn: {
        backgroundColor: theme.colors.primary[500],
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 6,
    },
    requestBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    listContent: { padding: 16, paddingBottom: 100 },
    ticketCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    idBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    ticketIdText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '800' },
    subjectText: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
    descRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    descText: { fontSize: 13, color: '#475569', flex: 1, lineHeight: 18 },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' }
});

export default MyComplaints;