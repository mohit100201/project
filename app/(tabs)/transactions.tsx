import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  FlatList,
  RefreshControl,
} from "react-native";
import {
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Clock,
  XCircle,
  Search,
} from "lucide-react-native";
import { theme } from "@/theme";
import { AnimatedCard } from "@/components/animated/AnimatedCard";
import { getLatLong } from "@/utils/location";
import Constants from "expo-constants";
import { useBranding } from '@/context/BrandingContext';
import * as SecureStore from "expo-secure-store";
import { getTransactionsApi } from "../../api/transaction.api";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionDetailsModal } from "@/components/ui/TransactionDetailModal";
import { TransactionFilterModal } from "@/components/ui/TransactionFilterModal";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { TransactionSkeleton } from "@/components/shimmer/TransactionSkeleton";


type FilterType = "All" | "Success" | "Pending" | "Failed";

// Define a constant for card height to optimize rendering
const ITEM_HEIGHT = 100;

export default function TransactionsScreen() {
  const [filter, setFilter] = useState<FilterType>("All");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<{
    type?: "credit" | "debit";
    fromDate?: Date;
    toDate?: Date;
    status?: "completed" | "pending" | "failed";
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

   


  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const userToken = useRef<string | null>(null);

  /* ---------------- HELPERS ---------------- */

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString.replace(" ", "T"));
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "completed": return theme.colors.success[500];
      case "pending": return theme.colors.warning[500];
      case "failed": return theme.colors.error[500];
      default: return theme.colors.text.secondary;
    }
  }, []);

  /* ---------------- API LOGIC ---------------- */

  const fetchTransactions = async (
    targetPage: number = 1,
    isLoadMore: boolean = false,
    isRefreshing: boolean = false
  ) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const location = await getLatLong();
      if (!userToken.current) {
        userToken.current = await SecureStore.getItemAsync("userToken");
      }

      if (!location || !userToken.current) {
        setLoading(false);
        return;
      }

      const payload: any = {
        
        latitude: location.latitude,
        longitude: location.longitude,
        token: userToken.current,
        page: targetPage,
        perPage: 15, // Increased slightly for better screen filling
      };

      const STATUS_MAP: any = { all: undefined, success: "completed", pending: "pending", failed: "failed" };
      const apiStatus = STATUS_MAP[filter.toLowerCase()];
      if (apiStatus) payload.status = apiStatus;
      if (debouncedSearch.trim()) payload.transaction_id = debouncedSearch.trim();
      if (appliedFilters?.type) payload.transaction_type = appliedFilters.type;
      if (appliedFilters?.fromDate) payload.from_date = appliedFilters.fromDate.toISOString().split("T")[0];
      if (appliedFilters?.toDate) payload.to_date = appliedFilters.toDate.toISOString().split("T")[0];

      const res = await getTransactionsApi(payload);

      if (res.success) {
        
        const newItems = res.data.items || [];
        setTransactions(prev => {
          if (targetPage === 1) return newItems;

          const map = new Map<string, any>();

          [...prev, ...newItems].forEach(txn => {
            map.set(txn.transaction_id, txn);
          });

          return Array.from(map.values());
        });
        setHasMore(newItems.length >= 15);
        setPage(targetPage);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  /* ---------------- EFFECTS ---------------- */

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchTransactions(1, false);
  }, [filter, appliedFilters, debouncedSearch]);

  useEffect(() => {
    setTransactions([]);
    setPage(1);
    setHasMore(true);
  }, [filter, appliedFilters, debouncedSearch]);

  const handleRefresh = () => {
    setHasMore(true);
    fetchTransactions(1, false, true);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore && !refreshing) {
      fetchTransactions(page + 1, true);
    }
  };

  /* ---------------- RENDER OPTIMIZATIONS ---------------- */

  const renderItem = useCallback(({ item, index }: { item: any, index: number }) => {
    const credit = item.transaction_type === "credit";
    const statusColor = getStatusColor(item.status);

    return (
      <Pressable
        onPress={() => {
          setSelectedTxn(item);
          setShowTxnModal(true);
        }}
        style={styles.cardContainer}
      >
        <AnimatedCard style={styles.transactionCard} delay={0}>
          <View style={styles.cardRow}>
            <View style={[styles.iconWrapper, {
              backgroundColor: item.status === 'pending' ? theme.colors.warning[50]
                : item.status === 'failed' ? theme.colors.error[50]
                  : credit ? theme.colors.success[50] : theme.colors.error[50]
            }]}>
              {item.status === 'pending' ? <Clock size={18} color={theme.colors.warning[500]} />
                : item.status === 'failed' ? <XCircle size={18} color={theme.colors.error[500]} />
                  : credit ? <ArrowDownLeft size={18} color={theme.colors.success[500]} />
                    : <ArrowUpRight size={18} color={theme.colors.error[500]} />}
            </View>

            <View style={styles.details}>
              <Text style={styles.txnId} numberOfLines={1}>{item.transaction_id}</Text>
              <Text style={styles.txnDate}>{formatDate(item.created_at)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {item.status === "completed" || item.status === "completd"
                    ? "SUCCESS"
                    : item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={[styles.amount, { color: credit ? theme.colors.success[500] : theme.colors.error[500] }]}>
              {credit ? "+" : "-"}₹{Number(item.amount).toFixed(2)}
            </Text>
          </View>
        </AnimatedCard>
      </Pressable>
    );
  }, [formatDate, getStatusColor]);

  // Tell FlatList the exact size of items so it doesn't have to calculate them dynamically
  const getItemLayout = useCallback((data: any, index: number) => (
    { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  ), []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerSafe}>
        <Text style={styles.title}>Transactions</Text>
        <Pressable
          style={[styles.filterIcon, isFilterApplied && { backgroundColor: theme.colors.primary[50] }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={18} color={isFilterApplied ? theme.colors.primary[500] : theme.colors.text.primary} />
        </Pressable>
      </SafeAreaView>

      {/* SEARCH BOX & FILTERS (STAY THE SAME) */}
      <View style={{ marginHorizontal: 16 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["All", "Success", "Pending", "Failed"]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterChip, filter === item && styles.filterChipActive]}
              onPress={() => setFilter(item as FilterType)}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </Pressable>
          )}
          contentContainerStyle={{ alignItems: 'center', height: 50 }}
        />
        <View style={styles.searchBox}>
          <Search size={18} color={theme.colors.text.tertiary} />
          <TextInput
            placeholder="Search by Txn ID"
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={{ flex: 1, marginTop: 10 }}>
        {loading && page === 1 ? (
          <TransactionSkeleton />
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderItem}
            keyExtractor={(item) => `${item.transaction_id}-${item.id}`}
            showsVerticalScrollIndicator={false}
            // --- Performance Props ---
            initialNumToRender={8}     // Load small amount first
            windowSize={11}            // Pre-render 5 screens worth of data ahead
            maxToRenderPerBatch={10}   // Don't overwhelm the UI thread
            removeClippedSubviews={true} // Free up memory for off-screen items
            getItemLayout={getItemLayout} // Skip layout measurement (Fast!)
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5} // Start loading next page when half-way down

            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary[500]} />
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.center}>
                  <Calendar size={64} color={theme.colors.text.tertiary} />
                  <Text style={styles.emptyTitle}>No Transactions</Text>
                </View>
              ) : null
            }
            ListFooterComponent={() => loadingMore ? <ActivityIndicator style={{ padding: 20 }} /> : <View style={{ height: 80 }} />}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: tabBarHeight + 16 }
            ]}
            style={{ marginTop: 16 }}
          />
        )}
      </View>

      {/* MODALS */}
      <TransactionFilterModal visible={showFilterModal} onClose={() => setShowFilterModal(false)} onApply={(f: any) => { setAppliedFilters(f); setIsFilterApplied(true); }} onReset={() => { setAppliedFilters(null); setIsFilterApplied(false); }} />
      <TransactionDetailsModal visible={showTxnModal} transaction={selectedTxn} onClose={() => setShowTxnModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.dark },
  headerSafe: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 24, fontWeight: "700", color: theme.colors.text.primary },
  filterIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: theme.colors.background.light, alignItems: "center", justifyContent: "center" },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.background.light, marginRight: 8, height: 36, justifyContent: 'center' },
  filterChipActive: { backgroundColor: theme.colors.primary[500] },
  filterText: { fontSize: 12, fontWeight: "600", color: theme.colors.text.secondary },
  filterTextActive: { color: "#fff" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, height: 44, paddingHorizontal: 12, borderRadius: 10, backgroundColor: theme.colors.background.light, marginTop: 10 },
  searchInput: { flex: 1, color: theme.colors.text.primary },
  listContent: { paddingHorizontal: 16, flexGrow: 1, paddingBottom: 50, rowGap: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 300 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: theme.colors.text.primary, marginTop: 16 },
  cardContainer: { height: ITEM_HEIGHT, justifyContent: 'center' }, // Fixed height container
  transactionCard: { padding: 16, backgroundColor: theme.colors.background.light, borderRadius: 12 },
  cardRow: { flexDirection: "row", alignItems: "center" },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 12 },
  details: { flex: 1 },
  txnId: { fontSize: 14, fontWeight: "600", color: theme.colors.text.primary },
  txnDate: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 6 },
  statusText: { fontSize: 10, fontWeight: "700" },
  amount: { fontSize: 16, fontWeight: "700" },
});