import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Home, User, Receipt, Grid, ShieldAlert, RefreshCcw } from 'lucide-react-native';
import { theme } from '@/theme';
import { useEffect, useState } from 'react';
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { getLatLong } from '@/utils/location';
import { getKycStatusApi } from '../api/kyc.api';
import * as Linking from 'expo-linking';

export default function TabLayout() {
  const [kycLoading, setKycLoading] = useState(true);
  const [isKycDone, setIsKycDone] = useState(false);
  const handleOpenKYC = () => {
    Linking.openURL('https://app.pinepe.in/login');
  };

  const checkKycStatus = async () => {
    try {
      setKycLoading(true);

      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");
      const tenantData = Constants.expoConfig?.extra?.tenantData;
      const domainName = tenantData?.domain || "laxmeepay.com";

      if (!token) return;

      const res = await getKycStatusApi({
        domain: domainName,
        latitude: location?.latitude?.toString() || "0",
        longitude: location?.longitude?.toString() || "0",
        token: token,
      });

      // Handle based on your provided response structure
      if (res.success && res.data?.kyc_status === "Approved") {
        setIsKycDone(true);
      } else {
        // This covers res.success: false OR status not being "Approved"
        setIsKycDone(false);
      }
    } catch (err) {
      console.error("KYC Check Error:", err);
      setIsKycDone(false);
    } finally {
      setKycLoading(false);
    }
  };

  useEffect(() => {
    checkKycStatus();
  }, []);

  if (kycLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  if (!isKycDone) {
    return (
      <View style={styles.kycContainer}>
        <View style={styles.kycCard}>
          <View style={styles.iconCircle}>
            <ShieldAlert size={40} color={theme.colors.primary[500]} />
          </View>
          <Text style={styles.kycTitle}>KYC Verification Required</Text>
          <Text style={styles.kycSubtitle}>
            To access your dashboard, transactions, and services, please complete your identity verification.
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={handleOpenKYC}>
            <Text style={styles.buttonText}>Complete KYC Now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={checkKycStatus}>
            <RefreshCcw size={16} color={theme.colors.text.secondary} style={{ marginRight: 8 }} />
            <Text style={styles.secondaryButtonText}>I've already done it, check status</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }




  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <View style={styles.iconContainer}>
              <Home size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ size, color }) => (
            <View style={styles.iconContainer}>
              <Receipt size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ size, color }) => (
            <View style={styles.iconContainer}>
              <Grid size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <View style={styles.iconContainer}>
              <User size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: theme.spacing[5],
    left: theme.spacing[5],
    right: theme.spacing[5],
    backgroundColor: theme.colors.background.light,
    borderRadius: theme.borderRadius.xl,
    height: 70,
    paddingBottom: theme.spacing[2],
    paddingTop: theme.spacing[2],
    ...theme.shadows.xl,
  },
  tabBarLabel: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.medium,
  },
  tabBarItem: {
    paddingVertical: theme.spacing[1],
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.light,
  },
  kycContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
    justifyContent: 'center',
    padding: theme.spacing[5],
  },
  kycCard: {
    backgroundColor: theme.colors.background.light,
    borderRadius: 20,
    padding: theme.spacing[6],
    alignItems: 'center',
    ...theme.shadows.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.primary[500]}15`, // 15% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  kycTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  kycSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing[2],
    lineHeight: 20,
    marginBottom: theme.spacing[6],
  },
  primaryButton: {
    backgroundColor: theme.colors.primary[500],
    width: '100%',
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: theme.typography.fontWeights.bold,
    fontSize: theme.typography.fontSizes.md,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing[4],
    padding: theme.spacing[2],
  },
  secondaryButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSizes.sm,
  },

});
