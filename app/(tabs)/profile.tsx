import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User as UserIcon,
  Settings,
  Lock,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Camera,
  User,
  CreditCard, FileText
} from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import { useBranding } from '@/context/BrandingContext';
import Toast from "react-native-toast-message";

import { theme } from "@/theme";
import { AnimatedCard } from "@/components/animated/AnimatedCard";
import { useAuth } from "@/context/AuthContext";

import { getLatLong } from "@/utils/location";
import { logoutApi } from "../../api/auth.api";
import { getProfileApi, uploadProfilePhotoApi } from "../../api/profile.api";
import { EditProfileModal } from "@/components/ui/EditProfileModal";
import { SetupMPINModal } from "@/components/ui/MPINModal";
import { sendMpinOtpApi } from "../../api/mpin.api";
import { ActivityIndicator } from "react-native";

interface MenuItem {
  icon: any;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, hasMPIN } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [mpinExists, setMpinExists] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const [showSetupMPIN, setShowSetupMPIN] = useState(false);
   
  
  const [mpinLoading, setMpinLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);






  /* ---------------- FETCH PROFILE ---------------- */
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

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    hasMPIN().then(setMpinExists);
  }, []);

  /* ---------------- IMAGE PICKER ---------------- */
  const handleImagePicker = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],   // ✅ new API
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled) return;
      const image = result.assets[0];

      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");
      if (!location || !token) return;

      const res = await uploadProfilePhotoApi({
        
        latitude: location.latitude,
        longitude: location.longitude,
        token,
        imageUri: image.uri,
      });

      if (res?.data?.photo_url) {
        setProfileData((prev: any) => ({
          ...prev,
          user: {
            ...prev.user,
            photo: res.data.photo_url,
          },
        }));
      }

      Toast.show({
        type: "success",
        text1: "Profile Updated",
        text2: "Profile photo uploaded successfully",
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: err.message || "Something went wrong",
      });
    }
  };

  /* ---------------- LOGOUT ---------------- */
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

  /* ---------------- SEND OTP ---------------- */
  const handleResetMpin = async () => {
    try {
      setMpinLoading(true);
      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");

      if (!location || !token) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Missing location or session",
        });
        return;
      }

      const res = await sendMpinOtpApi({
        
        latitude: location.latitude,
        longitude: location.longitude,
        token,
      });

      if (res.success) {
        Toast.show({
          type: "success",
          text1: "OTP Sent",
          text2: res.message,
        });
        setTimeout(() => {
          setShowSetupMPIN(true)
        }, 500)
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to send OTP",
        text2: err.message || "Something went wrong",
      });
    }
    finally {
      setMpinLoading(false);
    }
  };


  /* ---------------- MENU SECTIONS (UNCHANGED) ---------------- */
  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Account",
      items: [
        {
          icon: UserIcon,
          title: "Edit Profile",
          subtitle: "Update your personal information",
          onPress: () => setShowEditProfile(true),
          showChevron: true,
        },
        {
          icon: Lock,
          title: mpinExists ? "Change MPIN" : "Setup MPIN",
          subtitle: mpinExists
            ? "Update your security PIN"
            : "Set up your 4-digit security PIN",
          onPress: () => {
            handleResetMpin();
          },
          showChevron: true,
        },
      ],
    },

    {
      title: "Plans & Subscriptions",
      items: [
        {
          icon: CreditCard,
          title: "My Plan",
          subtitle: "View or upgrade your current plan",
          onPress: () => {
            // ⛔ Prevent multiple taps
            if (isNavigating) return;

            if (!profileData || profileLoading) {
              Toast.show({
                type: "info",
                text1: "Please wait",
                text2: "Profile data is loading",
              });
              return;
            }

            if (!profileData?.user?.id) {
              Toast.show({
                type: "error",
                text1: "Unable to proceed",
                text2: "User information not available",
              });
              return;
            }

            setIsNavigating(true); // 🔒 Lock navigation

            router.push({
              pathname: "/plans-and-subs" as any,
              params: {
                userId: profileData.user.id.toString(),
              },
            });

            // 🔓 Unlock after navigation settles
            setTimeout(() => {
              setIsNavigating(false);
            }, 800);
          },


          showChevron: true,
        },
      ],
    },

    {
      title: "Support",
      items: [
        {
          icon: FileText,
          title: "Complaints & Tickets",
          subtitle: "Raise or track your support tickets",
          onPress: () => {
            if (isNavigating) return;
            setIsNavigating(true);
            router.push("/complain-tickets" as any)
            setTimeout(() => {
              setIsNavigating(false);
            }, 800);
          },
          showChevron: true,
        },
      ],
    },
  ];


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* -------- PROFILE CARD -------- */}
        <AnimatedCard style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Pressable onPress={handleImagePicker} style={styles.avatar}>
              {profileData?.user?.photo ? (
                <Image
                  source={{ uri: profileData.user.photo }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <User size={32} color="#fff" />
              )}
            </Pressable>

            <View style={styles.cameraIcon}>
              <Camera size={12} color="#fff" />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            {profileLoading ? (
              <>
                <View style={styles.skeletonName} />
                <View style={styles.skeletonEmail} />
              </>
            ) : (
              <>
                <Text style={styles.profileName}>
                  {profileData?.user?.name}
                </Text>
                <Text style={styles.profileEmail}>
                  {profileData?.user?.email ||
                    profileData?.user?.phone}
                </Text>
              </>
            )}
          </View>
        </AnimatedCard>

        {/* -------- MENU SECTIONS -------- */}
        {menuSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <AnimatedCard style={styles.menuCard} delay={sectionIndex * 100}>
              {section.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.title}
                    style={[
                      styles.menuItem,
                      index !== section.items.length - 1 &&
                      styles.menuItemBorder,
                    ]}
                    onPress={item.onPress}
                  >
                    <View style={styles.menuIconContainer}>
                      {mpinLoading && item.title.includes("MPIN") ? (
                        <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                      ) : (
                        <Icon size={20} color={theme.colors.primary[500]} />
                      )}
                    </View>

                    <View style={styles.menuContent}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      {item.subtitle && (
                        <Text style={styles.menuSubtitle}>
                          {item.subtitle}
                        </Text>
                      )}
                    </View>

                    {item.showChevron && (
                      <ChevronRight
                        size={20}
                        color={theme.colors.text.tertiary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </AnimatedCard>
          </View>
        ))}

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={theme.colors.error[500]} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>

      <SetupMPINModal
        visible={showSetupMPIN}
        onClose={() => setShowSetupMPIN(false)}
        onSuccess={() => {
          setShowSetupMPIN(false);
          Toast.show({
            type: "success",
            text1: "MPIN Updated",
            text2: "Your MPIN has been reset successfully",
          });
        }}
      />

      <EditProfileModal
        visible={showEditProfile}
        profileData={profileData}
        handleImagePicker={handleImagePicker}
        onClose={() => setShowEditProfile(false)}
        onSuccess={(updatedUser) =>
          setProfileData((prev: any) => ({
            ...prev,
            user: updatedUser,
          }))
        }
      />
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.dark,
  },
  header: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[12],
    paddingBottom: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSizes["3xl"],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
  },
  content: {
    paddingHorizontal: theme.spacing[6],
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    position: "relative",
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
  cameraIcon: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 4,
  },
  profileName: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
  },
  profileEmail: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  skeletonName: {
    width: 140,
    height: 18,
    borderRadius: 4,
    backgroundColor: theme.colors.border.light,
    marginBottom: 6,
  },
  skeletonEmail: {
    width: 180,
    height: 14,
    borderRadius: 4,
    backgroundColor: theme.colors.border.light,
  },
  section: {
    marginBottom: theme.spacing[6],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
    textTransform: "uppercase",
  },
  menuCard: {
    padding: 0,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing[4],
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing[3],
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
  },
  menuSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing[4],
    backgroundColor: theme.colors.error[50],
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing[6],
  },
  logoutText: {
    marginLeft: 8,
    color: theme.colors.error[500],
    fontWeight: theme.typography.fontWeights.semibold,
  },
});
