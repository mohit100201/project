import { router, Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { Home, User, Receipt, Grid, ShieldAlert, RefreshCcw } from 'lucide-react-native';
import { theme } from '@/theme';
import { useEffect, useState } from 'react';
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { useBranding } from '@/context/BrandingContext';
import { getLatLong } from '@/utils/location';
import { getKycStatusApi } from '../api/kyc.api';
import * as Linking from 'expo-linking';
import { useAuth } from '@/context/AuthContext';
import * as Application from 'expo-application';

export default function TabLayout() {
  const [kycLoading, setKycLoading] = useState(true);
  const [isKycDone, setIsKycDone] = useState(false);
  const appName = (Application.applicationName || '').toString().trim();
    const { domainName: brandingDomain, tenant } = useBranding();
    const domainName = brandingDomain !;

   
  const generateLoginUrl = (domain?: string | null): string => {
  if (!domain) return "";

  // Remove protocol if accidentally passed
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  return `https://${cleanDomain}/login`;
};

 
  const { signOut, hasMPIN } = useAuth();

   const handleLogout = () => {
      Alert.alert("Logout", "Are you sure you want to logout?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await SecureStore.deleteItemAsync("userToken");
            await SecureStore.deleteItemAsync("userData");
            await signOut();
            router.replace("/(auth)/login");
          },
        },
      ]);
    };

  const checkKycStatus = async () => {
    try {
      setKycLoading(true);

      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");
      
    

      if (!token) return;

      const res = await getKycStatusApi({
        
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background.main, justifyContent: 'center', padding: 20 }}>
      <View style={{ 
        backgroundColor: '#fff', 
        borderRadius: 20, 
        padding: 24, 
        alignItems: 'center', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 10 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 20, 
        elevation: 5 
      }}>
        {/* Icon */}
        <View style={{ 
          width: 80, height: 80, borderRadius: 40, 
          backgroundColor: `${theme.colors.primary[500]}15`, 
          justifyContent: 'center', alignItems: 'center', marginBottom: 16 
        }}>
          <ShieldAlert size={40} color={theme.colors.primary[500]} />
        </View>

        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' }}>
          KYC Verification Required
        </Text>
        
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 }}>
          To access your services, please login to PinePe and complete your identity verification.
        </Text>
        
        {/* Main Action: Link to PinePe */}
        <TouchableOpacity 
          style={{ backgroundColor: theme.colors.primary[500], width: '100%', padding: 16, borderRadius: 12, alignItems: 'center' }} 
          onPress={() => Linking.openURL(generateLoginUrl(brandingDomain))}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Login to {appName}</Text>
        </TouchableOpacity>

        {/* Secondary Action: Refresh Status */}
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 8 }} 
          onPress={checkKycStatus}
        >
          <RefreshCcw size={14} color="#666" style={{ marginRight: 6 }} />
          <Text style={{ color: '#666', fontSize: 14 }}>I've finished, Refresh status</Text>
        </TouchableOpacity>

        {/* Logout Section */}
        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: '#EEE', width: '100%', paddingTop: 16 }}>
          <TouchableOpacity 
            style={{ alignItems: 'center', padding: 8 }} 
            onPress={handleLogout}
          >
            <Text style={{ color: '#FF3B30', fontWeight: '600', fontSize: 14 }}>Log out</Text>
          </TouchableOpacity>
        </View>
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
