import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { X, Camera } from "lucide-react-native";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { useBranding } from '@/context/BrandingContext';

import { theme } from "@/theme";
import { getLatLong } from "@/utils/location";
import { updateProfileApi } from "@/app/api/profile.api";

interface Props {
  visible: boolean;
  profileData: any;
  handleImagePicker:()=>void;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function EditProfileModal({
  visible,
  profileData,
  onClose,
  onSuccess,
  handleImagePicker
}: Props) {
  const translateY = useSharedValue(500);

  

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    state: "",
    address: "",
  });

 
  useEffect(() => {
    translateY.value = visible
      ? withSpring(0, { damping: 20 })
      : withTiming(500);
  }, [visible]);

  
  useEffect(() => {
    if (profileData?.user) {
      setForm({
        name: profileData.user.name || "",
        phone: profileData.user.phone || "",
        city: profileData.user.city || "",
        state: profileData.user.state || "",
        address: profileData.user.address || "",
      });
    }
  }, [profileData]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  
  const handleSave = async () => {
    try {
      setLoading(true);

      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");

      if (!location || !token) return;

      const res = await updateProfileApi({
        
        latitude: location.latitude,
        longitude: location.longitude,
        token,
        payload: form,
      });

      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Profile Updated",
          text2: res.message,
        });

        onSuccess(res.data.user);
        onClose();
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: err.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
     
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Animated.View style={[styles.container, animatedStyle]}>
            <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Edit Profile</Text>
              <Pressable onPress={onClose}>
                <X size={24} color={theme.colors.text.primary} />
              </Pressable>
            </View>

           
            <Pressable onPress={handleImagePicker} style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                {profileData?.user?.photo ? (
                  <Image
                    source={{ uri: profileData.user.photo }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <Text style={styles.avatarInitial}>
                    {form.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>

              <View style={styles.cameraIcon}>
                <Camera size={14} color="#fff" />
              </View>
            </Pressable>

            
            <Input
              label="Name"
              value={form.name}
              onChangeText={(v: string) =>
                setForm({ ...form, name: v })
              }
            />

            <Input
              label="Email"
              value={profileData?.user?.email}
              editable={false}
            />

            <Input
              label="Phone"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(v: string) =>
                setForm({ ...form, phone: v })
              }
              editable={false}
            />

            <Input
              label="City"
              value={form.city}
              onChangeText={(v: string) =>
                setForm({ ...form, city: v })
              }
            />

            <Input
              label="State"
              value={form.state}
              onChangeText={(v: string) =>
                setForm({ ...form, state: v })
              }
            />

            <Input
              label="Address"
              value={form.address}
              multiline
              onChangeText={(v: string) =>
                setForm({ ...form, address: v })
              }
            />

           
            <View style={styles.actions}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveBtn,
                  loading && { opacity: 0.6 },
                ]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.saveText}>
                  {loading ? "Saving..." : "Save"}
                </Text>
              </Pressable>
            </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
    
  );
}


const Input = ({ label, style, editable = true, ...props }: any) => {
  const [focused, setFocused] = useState(false);

  // Determine if we should apply "disabled" styles
  const isDisabled = editable === false;

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ 
        fontSize: 14, 
        fontWeight: '500', 
        marginBottom: 6, 
        color: isDisabled ? '#9CA3AF' : '#374151' // Dim label if disabled
      }}>
        {label}
      </Text>
      
      <TextInput
        {...props}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={theme.colors.text.tertiary}
        style={[
          styles.input, // Base style
          focused && styles.inputFocused, // Focus style
          
          // APPLY DISABLED STATE HERE
          isDisabled && {
            backgroundColor: "#D1D5DB", 
            borderColor: "#9CA3AF",
            color: "#6B7280", // Optional: dim the text color too
          },

          style, // Custom style overrides
        ]}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: theme.colors.background.light,
    borderTopLeftRadius: theme.borderRadius["2xl"],
    borderTopRightRadius: theme.borderRadius["2xl"],
    padding: theme.spacing[6],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSizes["2xl"],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: theme.spacing[6],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: "38%",
    backgroundColor: "#000",
    borderRadius: 14,
    padding: 6,
  },
  label: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  inputFocused: {
    borderColor: theme.colors.primary[500],
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: theme.spacing[6],
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.border.light,
    alignItems: "center",
  },
  cancelText: {
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.primary[500],
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "700",
  },
});
