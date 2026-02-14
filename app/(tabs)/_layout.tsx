import { router, Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert ,ScrollView} from 'react-native';
import { Home, User, Receipt, Grid, ShieldAlert, RefreshCcw } from 'lucide-react-native';
import { theme } from '@/theme';
import { useEffect, useState } from 'react';
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { useBranding } from '@/context/BrandingContext';
import { getLatLong } from '@/utils/location';
import { getKycStatusApi } from '../../api/kyc.api';
import * as Linking from 'expo-linking';
import { useAuth } from '@/context/AuthContext';
import * as Application from 'expo-application';
import { logoutApi } from '@/api/auth.api';
import KYCApplicationForm from '../KYCApplicationForm';
import { AnimatedCard } from '@/components/animated/AnimatedCard';
import PaysprintTest from '../PaysprintETest';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function TabLayout() {
  type KycStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

  const [kycStatus, setKycStatus] = useState<KycStatus>("NOT_SUBMITTED");
  const [kycLoading, setKycLoading] = useState(true);
  const appName = (Application.applicationName || '').toString().trim();
  const { domainName: brandingDomain, tenant } = useBranding();
  const domainName = brandingDomain!;


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
          try {


            const location = await getLatLong();
            const token = await SecureStore.getItemAsync("userToken");

            // Call API only if we have required data
            if (location && token) {
              try {
                await logoutApi({
                  latitude: location.latitude,
                  longitude: location.longitude,
                  token,
                });
              } catch (apiErr) {
                // Silent fail – we still logout locally
                console.log("Logout API failed, proceeding locally");
              }
            }
          } catch (err) {
            console.log("Logout error:", err);
          } finally {
            // 🔐 FORCE LOGOUT LOCALLY (Always runs)
            await SecureStore.deleteItemAsync("userToken");
            await SecureStore.deleteItemAsync("userData");

            await signOut();
            router.replace("/(auth)/login");


          }
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
        token,
      });

      // 🔥 EXACT BACKEND MAPPING
      if (res.success === false) {
        // "KYC not submitted yet"
        setKycStatus("NOT_SUBMITTED");
        return;
      }

      if (res.success === true) {
        if (res.data?.kyc_status === "Approved") {
          setKycStatus("APPROVED");
        } else if (res.data?.kyc_status === "Pending") {
          setKycStatus("PENDING");
        } else {
          setKycStatus("REJECTED");
        }
      }
    } catch (err) {
      console.error("KYC Check Error:", err);
      setKycStatus("NOT_SUBMITTED");
    } finally {
      setKycLoading(false);
    }
  };


  useEffect(() => {
    checkKycStatus();
  }, []);

  return(
    <PaysprintTest/>
  )


  if (kycLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  /* ❌ KYC NOT SUBMITTED → SHOW FORM */
  if (kycStatus === "NOT_SUBMITTED") {
    return (
      <KYCApplicationForm
        onKycSubmitted={checkKycStatus}
      />
    );
  }

  /* ⏳ PENDING → SHOW PENDING VIEW */
  if (kycStatus === "PENDING") {
    return (
     <AnimatedCard style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
}}>
    <View style={{
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 5,
    }}>
        {/* Icon Container */}
        <View style={{
            backgroundColor: `${theme.colors.primary[500]}15`,
            padding: 20,
            borderRadius: 100,
            marginBottom: 24
        }}>
            <ShieldAlert size={42} color={theme.colors.primary[500]} />
        </View>

        <Text style={{
            fontSize: 22,
            fontWeight: "800",
            color: "#1E293B",
            textAlign: 'center'
        }}>
            Verification in Progress
        </Text>

        <Text style={{
            marginTop: 12,
            color: "#64748B",
            textAlign: 'center',
            lineHeight: 22,
            fontSize: 15
        }}>
            We're currently reviewing your documents. This usually takes less than 3-4 working days.
        </Text>

        {/* Primary Action: Check Status */}
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={checkKycStatus}
            style={{
                marginTop: 32,
                width: '100%', // Full width for better tap target
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.colors.primary[500],
                paddingVertical: 14,
                borderRadius: 16,
                shadowColor: theme.colors.primary[500],
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            }}
        >
            <RefreshCcw size={18} color="#FFF" />
            <Text style={{
                color: "#FFF",
                marginLeft: 10,
                fontWeight: "600",
                fontSize: 16
            }}>
                Check Update
            </Text>
        </TouchableOpacity>

        {/* Secondary Action: Logout */}
        <TouchableOpacity
            activeOpacity={0.6}
            onPress={handleLogout} // Your logout function
            style={{
                marginTop: 16,
                width: '100%',
                paddingVertical: 14,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: '#E2E8F0', // Soft border color
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Text style={{
                color: "#64748B", 
                fontWeight: "600",
                fontSize: 16
            }}>
                Logout
            </Text>
        </TouchableOpacity>
        
    </View>
</AnimatedCard>
    );
  }



if (kycStatus === "REJECTED") {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc",marginTop:16 }}>
      <ScrollView
        contentContainerStyle={{
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        
       <View style={{paddingHorizontal:16}}>
         <View
          style={{
            backgroundColor: "#fef2f2",
            borderWidth: 1,
            borderColor: "#fecaca",
            borderRadius: 16,
            padding: 20,
            flexDirection: "row",
            alignItems: "flex-start",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#ef4444",
              marginTop: 6,
              marginRight: 12,
            }}
          />

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#991b1b",
                marginBottom: 4,
              }}
            >
              KYC Rejected
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: "#b91c1c",
                lineHeight: 20,
              }}
            >
              Your previous application was not approved. Please review your
              details and re-submit the form below with clear documents.
            </Text>
          </View>
        </View>
       </View>

       
          <KYCApplicationForm onKycSubmitted={checkKycStatus} />
        
      </ScrollView>
    </SafeAreaView>
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
