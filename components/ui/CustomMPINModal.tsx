import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Pressable,
    ActivityIndicator,
    Keyboard,
    Vibration,
    Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle2, X, Delete } from "lucide-react-native";
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown
} from "react-native-reanimated";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { confirmMpinApi } from "@/app/api/mpin.api";
import { getLatLong } from "@/utils/location";

interface Props {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => Promise<void> | void;
    title?: string;
    subtitle?: string;
}

export const MpinVerificationModal = ({
    visible,
    onClose,
    onSuccess,
    title = "Enter MPIN",
    subtitle = "Confirm your security code to proceed"
}: Props) => {
    const [mpin, setMpin] = useState("");
    const [verifying, setVerifying] = useState(false);


    useEffect(() => {
        if (!visible) setMpin("");
    }, [visible]);

    const handleKeyPress = (val: string) => {
        if (mpin.length < 4) {
            if (Platform.OS !== 'web') Vibration.vibrate(10);
            setMpin((prev) => prev + val);
        }
    };

    const handleDelete = () => {
        if (Platform.OS !== 'web') Vibration.vibrate(10);
        setMpin((prev) => prev.slice(0, -1));
    };

    const handleMpinSubmit = async () => {
  if (mpin.length < 4 || verifying) return;

  try {
    setVerifying(true);

    const location = await getLatLong();
    const token = await SecureStore.getItemAsync("userToken");
    const domain =
      Constants.expoConfig?.extra?.tenantData?.domain || "laxmeepay.com";

    const res = await confirmMpinApi({
      domain,
      latitude: location?.latitude?.toString() || "0",
      longitude: location?.longitude?.toString() || "0",
      token: token || "",
      mpin,
    });

    console.log("==Mpin==",res)

    if (!res.success) {
      setMpin("");
      Toast.show({
        type: "error",
        text1: res.message || "Invalid MPIN",
        position: "bottom",
      });
      return;
    }

    // ✅ SUCCESS TOAST (ABOVE MODAL)
    Toast.show({
      type: "success",
      text1: "MPIN Verified",
      text2: "Processing upgrade...",
      position: "bottom",
    });

    // Small delay so toast feels natural
    setTimeout(() => {
      onClose();      // Close modal
      onSuccess();    // Trigger upgrade in parent
    }, 700);

  } catch (error) {
    Toast.show({
      type: "error",
      text1: "MPIN verification failed",
      position: "bottom",
    });
  } finally {
    setVerifying(false);
  }
};


    if (!visible) return null;

    // Internal KeyButton Component to match your styles
    const KeyButton = ({ value, isDelete = false, onPress }: any) => (
        <TouchableOpacity style={styles.key} onPress={onPress} activeOpacity={0.7}>
            {isDelete ? (
                <Delete size={24} color="#475569" />
            ) : (
                <Text style={styles.keyText}>{value}</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <View style={[styles.modalOverlay]}>
                {/* Backdrop */}
                <Animated.View
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(200)}
                    style={StyleSheet.absoluteFill}
                >
                    <Pressable style={{ flex: 1 }} onPress={onClose} />
                </Animated.View>

                {/* Bottom Sheet Content */}
                <Animated.View
                    entering={SlideInDown.springify().damping(18)}
                    exiting={SlideOutDown.duration(300)}
                    style={styles.modalContent}
                >
                    <View style={styles.modalIndicator} />

                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <Text style={styles.modalSubtitle}>{subtitle}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.contentWrapper}>
                        {/* 1. VISUAL DOTS */}
                        <View style={styles.dotsContainer}>
                            {[0, 1, 2, 3].map((i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.mpinDot,
                                        mpin.length > i && styles.mpinDotFilled,
                                    ]}
                                />
                            ))}
                        </View>

                        {/* 2. CUSTOM KEYPAD */}
                        <View style={styles.keypadGrid}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <KeyButton key={num} value={num} onPress={() => handleKeyPress(num.toString())} />
                            ))}
                            <View style={styles.key} pointerEvents="none" />
                            <KeyButton value="0" onPress={() => handleKeyPress("0")} />
                            <KeyButton isDelete onPress={handleDelete} />
                        </View>

                        {/* 3. ACTION BUTTON */}
                        <TouchableOpacity
                            onPress={handleMpinSubmit}
                            disabled={verifying || mpin.length < 4}
                            activeOpacity={0.8}
                            style={styles.btnSpacing}
                        >
                            <LinearGradient
                                colors={["#10B981", "#059669"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[
                                    styles.gradientBtn,
                                    (mpin.length < 4 || verifying) && { opacity: 0.5 }
                                ]}
                            >
                                {verifying ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <View style={styles.btnInnerContent}>
                                        <CheckCircle2 size={18} color="#FFF" />
                                        <Text style={styles.confirmBtnText}>Submit</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.7)", justifyContent: "flex-end" },
    modalContent: {
        backgroundColor: "#FFF",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingBottom: 40,
        height: '70%'
    },
    modalIndicator: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
    modalTitle: { fontSize: 24, fontWeight: "900", color: "#1E293B" },
    modalSubtitle: { fontSize: 14, color: "#64748B", marginTop: 2 },
    closeBtn: { backgroundColor: "#F1F5F9", padding: 8, borderRadius: 12 },
    contentWrapper: { paddingVertical: 10, alignItems: "center" },
    dotsContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 30, marginTop: 10 },
    mpinDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#E2E8F0", marginHorizontal: 12 },
    mpinDotFilled: { borderColor: "#10B981", backgroundColor: "#10B981", transform: [{ scale: 1.1 }] },
    keypadGrid: { flexDirection: "row", flexWrap: "wrap", width: "100%", justifyContent: "center", marginBottom: 20 },
    key: { width: "30%", height: 65, justifyContent: "center", alignItems: "center", marginVertical: 5 },
    keyText: { fontSize: 26, fontWeight: "600", color: "#1E293B" },
    btnSpacing: { width: "100%", marginTop: 10 },
    gradientBtn: { height: 55, borderRadius: 12, justifyContent: "center", alignItems: "center" },
    btnInnerContent: { flexDirection: "row", alignItems: "center" },
    confirmBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16, marginLeft: 10 },
});