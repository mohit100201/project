import { getLatLong } from '@/utils/location';
import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { getAllPlansApi, getAssignedPlanApi, upgradePlanApi } from '../api/plansAndSubs.api';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons'; // Ensure you have expo-vector-icons installed
import { PlansSkeleton } from '@/components/shimmer/PlansSkeleton';
import { useLocalSearchParams } from "expo-router";
import { theme } from '@/theme';
import { confirmMpinApi } from '../api/mpin.api';
import { MpinVerificationModal } from '@/components/ui/CustomMPINModal';


const MyPlans = () => {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [plansLoading, setPlansLoading] = useState(false);
  const tenantData = Constants.expoConfig?.extra?.tenantData;
  const domainName = tenantData?.domain || "laxmeepay.com";
  const [allPlans, setAllPlans] = useState([]);
  const [assignedPlan, setAssignedPlan] = useState<any>(null);
  const [showMpin, setShowMpin] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [kycLoading, setKycLoading] = useState(true);
const [isKycDone, setIsKycDone] = useState(false);



  const handleUpgradeRequest = async () => {
    try {
      setUpgrading(true);

      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");

      const res = await upgradePlanApi({
        user_id: userId,
        plan_id: selectedPlan.id,
        domain: domainName,
        latitude: location?.latitude?.toString() || "0",
        longitude: location?.longitude?.toString() || "0",
        token: token || "",
      });

      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Upgrade Successful",
        });
        fetchAllPlans();
      } else {
        Toast.show({
          type: "error",
          text1: res.message || "Upgrade failed",
        });
      }
    } finally {
      setUpgrading(false);
    }
  };




  const fetchAllPlans = async () => {
    try {
      setPlansLoading(true);
      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");

      // Assuming you store the user object/ID in SecureStore or get it from AuthContext
      const userData = await SecureStore.getItemAsync("userData");
      const parsedUser = userData ? JSON.parse(userData) : null;
      const userId = parsedUser?.id || "4"; // Fallback to 4 for testing as per your URL

      if (!location || !token) return;

      // Call both APIs simultaneously
      const [allPlansRes, assignedPlanRes] = await Promise.all([
        getAllPlansApi({
          domain: domainName,
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
          token,
        }),
        getAssignedPlanApi({
          user_id: userId,
          domain: domainName,
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
          token,
        })
      ]);

      if (allPlansRes.success) {
        setAllPlans(allPlansRes.data);
      }

      // console.log("==assignedPlansRes==",assignedPlanRes)

      if (assignedPlanRes.success) {

        setAssignedPlan(assignedPlanRes.data.plan);
      }

    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to fetch plans",
        text2: err.message || "Something went wrong",
      });
    } finally {
      setPlansLoading(false);
    }
  };




  useEffect(() => {
    fetchAllPlans();
  }, []);

  const renderPlanItem = ({ item }: { item: any }) => {
    const isCurrentPlan = assignedPlan && Number(assignedPlan.id) === Number(item.id);
    const featuresList = JSON.parse(item.features || "[]");

    return (
      <View style={[
        styles.planCard,
        isCurrentPlan && styles.activeCardBorder // Highlight the card
      ]}>
        <View style={styles.cardHeader}>
          <Text style={styles.planName}>{item.name}</Text>

          {/* 2. THE BADGE: Switch between 'Current' and 'Role' */}
          <View style={[styles.badge, isCurrentPlan && styles.activeBadge]}>
            <Text style={[styles.badgeText, isCurrentPlan && styles.activeBadgeText]}>
              {isCurrentPlan ? "CURRENT PLAN" : item.role.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.currency}>₹</Text>
          <Text style={styles.amount}>{parseFloat(item.amount).toFixed(0)}</Text>
          <Text style={styles.validity}>/ One Time</Text>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.divider} />

        <View style={styles.featuresContainer}>
          {featuresList.map((feature: string, index: number) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={isCurrentPlan ? "#4f46e5" : "#10b981"} // Change check color if current
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* 3. THE BUTTON: Disable it if it's the current plan */}
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            isCurrentPlan && styles.disabledButton
          ]}
          disabled={isCurrentPlan}
          onPress={() => {
            setSelectedPlan(item);   // 1️⃣ Save selected plan
            setShowMpin(true);       // 2️⃣ Open MPIN modal
          }}
        >
          <Text style={styles.subscribeText}>
            {isCurrentPlan ? "Currently Active" : "Upgrade Now"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Available Plans</Text>

      {plansLoading ? (
        <View style={{ flex: 1 }}>
          <PlansSkeleton />
          <PlansSkeleton />
          <PlansSkeleton />


        </View>
      ) : (
        <FlatList
          data={allPlans}
          renderItem={renderPlanItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No plans available.</Text>}
        />
      )}
      <MpinVerificationModal
        visible={showMpin}
        onClose={() => setShowMpin(false)}
        onSuccess={handleUpgradeRequest} // 👈 NO MPIN PARAM
        title="Confirm Upgrade"
        subtitle={`₹${selectedPlan?.amount} will be deducted from wallet`}
      />


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: '#111827',
    marginBottom: 20,
    marginTop: 10,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  badge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#2563eb',
    fontSize: 10,
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  amount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginHorizontal: 2,
  },
  validity: {
    fontSize: 14,
    color: '#6b7280',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 10,
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  subscribeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 40,
  },
  activeCardBorder: {
    borderColor: '#4f46e5', // Brand primary color
    borderWidth: 2,
    backgroundColor: '#f5f7ff', // Very light tint to differentiate
  },
  activeBadge: {
    backgroundColor: '#10b981', // Success green
  },
  activeBadgeText: {
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#9ca3af', // Gray color for disabled
    opacity: 0.8,
  },
});

export default MyPlans;