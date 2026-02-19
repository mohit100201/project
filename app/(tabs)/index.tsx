import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Zap,
  Clock, XCircle, User, Plus
} from 'lucide-react-native';

import { useAuth } from '@/context/AuthContext';
import { AnimatedCard } from '@/components/animated/AnimatedCard';
import { getLatLong } from '@/utils/location';
import * as SecureStore from "expo-secure-store";
import { getTransactionsApi } from '../../api/transaction.api';
import Constants from "expo-constants";
import { useBranding } from '@/context/BrandingContext';
import Toast from 'react-native-toast-message';
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { Link, router } from 'expo-router';
import { getServicesApi } from '../../api/service.api';
import { getProfileApi } from '../../api/profile.api';
import { getWalletBalanceApi } from '../../api/balance.api';
import { ServiceItem } from './services';
import { VALID_ROUTES } from '@/utils/routes';
import { useTheme } from '@/context/ThemeProvider';
import { AppTheme } from '@/theme/theme';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);


const TransactionSkeleton = ({ styles }: { styles: any }) => (
  <View style={styles.transactionCard}>
    <View style={styles.cardRow}>
      <ShimmerPlaceholder style={styles.shimmerIcon} />
      <View style={styles.details}>
        <ShimmerPlaceholder style={styles.shimmerTitle} />
        <ShimmerPlaceholder style={styles.shimmerDate} />
      </View>
      <ShimmerPlaceholder style={styles.shimmerAmount} />
    </View>
  </View>
);
const EmptyState = ({
  icon,
  title,
  subtitle,
  styles
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  styles:any
}) => (
  <View style={styles.emptyState}>
    {icon}
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
  </View>
);

export default function HomeScreen() {
  const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

   


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchTransactions = async (pageNumber = 1) => {
    try {
      setTransactionsLoading(true);
      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");
     

      if (!location || !token) return;

      const res = await getTransactionsApi({
       
        latitude: location.latitude,
        longitude: location.longitude,
        token,
        page: pageNumber,
        perPage: 5,
      });

      if (res.success) {
        setTransactions(res.data.items || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleServicePress = (service: ServiceItem) => {
    const url = service.url?.trim();

    // External URL
    if (url && url.startsWith("http")) {
      Linking.openURL(url);
      return;
    }

    if (url && url.startsWith("/")) {
      if (VALID_ROUTES.includes(url)) {
        router.push(url as any);
      } else {
        router.push("/CommingSoon");
      }
      return;
    }

    // Fallback
    router.push("/CommingSoon");


  };

  const fetchServices = async () => {
    try {
      setServicesLoading(true);

      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");
      

      if (!location || !token) return;

      const res = await getServicesApi({
        
        latitude: location.latitude,
        longitude: location.longitude,
        token,
        status: "active",
        perPage: 5,
      });

     

      if (res.success) {
        setServices(res.data.items || []);
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to load services",
      });
    } finally {
      setServicesLoading(false);
    }
  };


  const fetchProfile = async () => {
    try {
      setProfileLoading(true);

      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");
      
      if (!location || !token) return;

      const res = await getProfileApi({
        
        latitude: location.latitude,
        longitude: location.longitude,
        token,
      });
     

      if (res.success) {
        setProfileData(res.data);
      }
    } catch (err: any) {
      
      Toast.show({
        type: "error",
        text1: "Failed to fetch profile",
        text2: err.message || "Something went wrong",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      setBalanceLoading(true);

      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");
     

      if (!location || !token) return;

      const res = await getWalletBalanceApi({
        
        latitude: location.latitude,
        longitude: location.longitude,
        token,
      });

      if (res.success) {
        setBalance(res.data.wallet_balance);
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to load wallet balance",
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchServices();
    fetchProfile()
    fetchWalletBalance()
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.primary[700]]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.userName}>
                  {profileData?.user?.name}
                </Text>  
          </View>
          <TouchableOpacity style={[styles.avatar,]} onPress={()=>router.push("/(tabs)/profile")}>
            {profileData?.user?.photo ? (
              <Image
                source={{ uri: profileData.user.photo }}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <User size={32} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <AnimatedCard style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIconContainer}>
              <Wallet size={22} color={theme.colors.primary[500]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceSubLabel}>Wallet</Text>
            </View>
          </View>

          {balanceLoading ? (
            <ShimmerPlaceholder style={styles.balanceShimmer} />
          ) : (
            <Text style={styles.balanceAmount}>₹{Number(balance ?? 0).toFixed(2)}</Text>
          )}

          <View style={styles.balanceFooter}>
            <TouchableOpacity
              style={styles.addFundButton}
              onPress={() => {
                router.push({
                  pathname: "/send-payout/RequestPayout",
                  params: {
                    heading: "Move to Bank"
                  }
                });
              }}
              activeOpacity={0.7}

            >
              <Plus size={16} color="#FFF" />
              <Text style={styles.addFundText}>Move to Bank</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addFundButton}
              onPress={() => { router.push('/funds' as any) }}
              activeOpacity={0.7}

            >
              <Plus size={16} color="#FFF" />
              <Text style={styles.addFundText}>Add Funds</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Services</Text>
          <TouchableOpacity style={{ flex: 0.5, alignItems: 'flex-end' }} onPress={() => { router.push("/(tabs)/services") }}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.servicesGrid}>
          {servicesLoading ? (
            [...Array(5)].map((_, i) => (
              <AnimatedCard key={i} style={styles.serviceCard}>
                <ShimmerPlaceholder style={styles.shimmerIcon} />
                <ShimmerPlaceholder style={styles.shimmerText} />
                <ShimmerPlaceholder style={styles.shimmerCategory} />
              </AnimatedCard>
            ))
          ) : services.length === 0 ? (
            <EmptyState
              icon={<Zap size={36} color={theme.colors.text.tertiary} />}
              title="No services available"
              subtitle="Please check back later"
              styles={styles}
            />
          ) : services.map((service, index) => (

            <TouchableOpacity
              key={service.id}
              onPress={() => handleServicePress(service)}
              style={{width:"47%",padding:4}}
            >

              <AnimatedCard
                key={service.id}
                delay={index * 100}
              >
                <View style={[styles.serviceIconContainer,{}]}>
                  <Image
                    source={{ uri: service.image }}
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                  />
                </View>

                <Text style={styles.serviceName} numberOfLines={1}>
                  {service.name}
                </Text>

                {/* CATEGORY */}
                <Text style={styles.serviceCategory} numberOfLines={1}>
                  {service.category}
                </Text>
              </AnimatedCard>

            </TouchableOpacity>



          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity style={{ flex: 0.5, alignItems: 'flex-end' }} onPress={() => { router.push("/(tabs)/transactions") }}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* LOADING STATE */}
        {transactionsLoading ? (
          <>
            <TransactionSkeleton styles={styles} />
            <TransactionSkeleton styles={styles} />
            <TransactionSkeleton styles={styles} />
            <TransactionSkeleton styles={styles} />
          
          </>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<Clock size={36} color={theme.colors.text.tertiary} />}
            title="No transactions yet"
            subtitle="Your recent transactions will appear here"
            styles={styles}
          />
        ) : (
          transactions.map((item, index) => {
            const credit = item.type === 'credit';
            const statusColor =
              item.status === 'pending' ? theme.colors.warning[500] :
                item.status === 'failed' ? theme.colors.error[500] :
                  theme.colors.success[500];

            return (
              <AnimatedCard key={item.id || index} style={styles.transactionCard} delay={index * 100}>
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
                        {item.status === "completed" || item.status === "completd" ? "SUCCESS" : item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.amount, { color: credit ? theme.colors.success[500] : theme.colors.error[500] }]}>
                    {credit ? "+" : "-"}₹{Number(item.amount).toFixed(2)}
                  </Text>
                </View>
              </AnimatedCard>
            );
          })
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.main },
  header: { paddingTop: theme.spacing[12], paddingHorizontal: theme.spacing[6], paddingBottom: theme.spacing[8] },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[6] },
  greeting: { fontSize: theme.typography.fontSizes.md, color: theme.colors.text.inverse, opacity: 0.9 },
  userName: { fontSize: theme.typography.fontSizes['2xl'], fontWeight: theme.typography.fontWeights.bold, color: theme.colors.text.inverse, marginTop: theme.spacing[1] },
  profileImage: { width: 48, height: 48, borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.text.inverse, justifyContent: 'center', alignItems: 'center' },
  profileInitial: { fontSize: theme.typography.fontSizes.xl, fontWeight: theme.typography.fontWeights.bold, color: theme.colors.primary[500] },
  balanceCard: { backgroundColor: theme.colors.background.main },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[2] },
  balanceIconContainer: { width: 32, height: 32, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primary[50], justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing[2] },
  balanceLabel: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.text.secondary },
  balanceAmount: { fontSize: theme.typography.fontSizes['4xl'], fontWeight: theme.typography.fontWeights.bold, color: theme.colors.text.primary, marginBottom: theme.spacing[6] },
  actions: { flexDirection: 'row', gap: theme.spacing[4] },
  actionButton: { flex: 1, alignItems: 'center' },
  actionIcon: { width: 48, height: 48, borderRadius: theme.borderRadius.full, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing[2] },
  actionText: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.text.secondary, fontWeight: theme.typography.fontWeights.medium },
  content: { paddingHorizontal: theme.spacing[6], paddingTop: theme.spacing[6] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[4] },
  sectionTitle: { fontSize: theme.typography.fontSizes.xl, fontWeight: theme.typography.fontWeights.bold, color: theme.colors.text.primary },
  seeAllText: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.primary[500], fontWeight: theme.typography.fontWeights.semibold },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[4], marginBottom: theme.spacing[8] },
  serviceCard: { width: '47%', padding: theme.spacing[4] },
  serviceIconContainer: { width: 48, height: 48, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primary[50], justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing[3] },
  serviceName: { fontSize: theme.typography.fontSizes.md, fontWeight: theme.typography.fontWeights.semibold, color: theme.colors.text.primary, marginBottom: theme.spacing[1] },
  servicePrice: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.text.secondary },

  // Transaction Styles
  transactionCard: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    backgroundColor: theme.colors.background.main,
    borderRadius: theme.borderRadius.xl
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  details: { flex: 1 },
  txnId: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary },
  txnDate: { fontSize: 11, color: theme.colors.text.secondary, marginTop: 2 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  statusText: { fontSize: 9, fontWeight: '700' },
  amount: { fontSize: 15, fontWeight: '700' },

  // Shimmer Specific Styles
  shimmerIcon: { width: 44, height: 44, borderRadius: 12, marginBottom: 8 },
  shimmerText: { width: '70%', height: 12, borderRadius: 6 },
  shimmerTitle: { width: '60%', height: 14 },
  shimmerDate: { width: '40%', height: 10 },
  shimmerAmount: { width: 60, height: 16 },
  serviceCategory: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  shimmerCategory: {
    width: "50%",
    height: 10,
    borderRadius: 6,
    marginTop: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  userNameShimmer: {
    width: 140,
    height: 22,
    borderRadius: 6,
    marginTop: 4,
  },
  balanceShimmer: {
    width: 160,
    height: 36,
    borderRadius: 8,
    marginVertical: 12,
  },
  balanceSubLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  emptyState: {
    width: "100%",
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: "600",
    color: theme.colors.text.secondary,
  },

  emptySubtitle: {
    marginTop: 4,
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.tertiary,
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Pushes Pill to left and Button to right
    alignItems: 'center',
    marginTop: 15,
  },
  addFundButton: {
    backgroundColor: theme.colors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6, // Spacing between Plus icon and Text
  },
  addFundText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  balancePill: {
    backgroundColor: theme.colors.primary[50] || '#F0F0F0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  balancePillText: {
    fontSize: 12,
    color: theme.colors.primary[600] || '#666',
  },
   


});