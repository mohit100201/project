import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { X } from "lucide-react-native";
import Toast from "react-native-toast-message"; // 1. Import Toast
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { useBranding } from '@/context/BrandingContext';

import { theme } from "@/theme";
import CustomInput from "./CustomInput";
import CustomDropdown from "./CustomDropdown";
import { getLatLong } from "@/utils/location";
import { fetchBankListApi } from "@/api/funds.api";

/* ================= TYPES ================= */

type DropdownItem = {
  label: string;
  value: string;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  selectedPipe: string;
}

/* ================= CONST ================= */

const PIPES: DropdownItem[] = [
  { label: "NSDL", value: "NSDL" },
  { label: "NPCI", value: "NPCI" },
];

/* ================= COMPONENT ================= */

export default function CreateRecipientModal({
  visible,
  onClose,
  onSubmit,
  selectedPipe,
}: Props) {
  const translateY = useSharedValue(700);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [bank, setBank] = useState<string | null>(null);
  const [accountNo, setAccountNo] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [pipe, setPipe] = useState<string | undefined>(selectedPipe);

  const [bankList, setBankList] = useState<DropdownItem[]>([]);
  const [bankOpen, setBankOpen] = useState(false);
  const [pipeOpen, setPipeOpen] = useState(false);

 

  const loadBankList = useCallback(async () => {
    try {
      const location = await getLatLong().catch(() => null);
      const token = await SecureStore.getItemAsync("userToken");
      if (!location || !token) return;

      const response = await fetchBankListApi({
        token,
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        payload: {},
      });

     

      if (response?.success && Array.isArray(response?.data?.bank_list)) {
        const banks: DropdownItem[] = response.data.bank_list.map((bank: any) => ({
          label: bank.bankName,
          value: bank.bankCode,
        }));
        setBankList(banks);
      }
    } catch (err) {
      console.error("Bank list fetch failed:", err);
    }
  }, []);

  useEffect(() => {
    if (visible) loadBankList();
  }, [visible, loadBankList]);

  useEffect(() => {
    setPipe(selectedPipe);
  }, [selectedPipe]);

  useEffect(() => {
    translateY.value = visible ? withSpring(0, { damping: 18 }) : withTiming(700);
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const onBankOpen = () => {
    Keyboard.dismiss();
    setPipeOpen(false);
    setBankOpen(!bankOpen);
  };

  const onPipeOpen = () => {
    Keyboard.dismiss();
    setBankOpen(false);
    setPipeOpen(!pipeOpen);
  };

  const handleSubmit = () => {
    if (!name || mobile.length !== 10 || !bank || !accountNo || !ifsc) {
      Toast.show({
        type: "info",
        text1: "Required Fields",
        text2: "Please fill all required fields",
        position: 'top', // Explicitly set position
      });
      return;
    }

    onSubmit({ name, mobile, bank, accountNo, ifsc, pipe });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setBankOpen(false);
          setPipeOpen(false);
      }}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.container, animatedStyle]}>
            <View style={styles.header}>
              <Text style={styles.title}>Create New Recipient</Text>
              <Pressable onPress={onClose}>
                <X size={22} color={theme.colors.text.primary} />
              </Pressable>
            </View>

             <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1,
      backgroundColor: theme.colors.background.main,}}
                  >
              <CustomInput label="Recipient Name" placeholder="Enter Name" value={name} onChangeText={setName} />
              <CustomInput label="Mobile" placeholder="Enter Mobile Number" keyboardType="number-pad" maxLength={10} value={mobile} onChangeText={setMobile} />
              
              <View style={[styles.dropdownWrapper, { zIndex: 5000 }]}>
                <CustomDropdown
                  label="Bank Name"
                  open={bankOpen}
                  value={bank}
                  items={bankList}
                  setOpen={onBankOpen}
                  setValue={setBank}
                  searchable
                  placeholder="Select bank"
                  zIndex={5000}
                />
              </View>

              <CustomInput label="Account No" placeholder="Enter account" keyboardType="number-pad" value={accountNo} onChangeText={setAccountNo} />
              <CustomInput label="IFSC Code" placeholder="Enter IFSC Code" autoCapitalize="characters" value={ifsc} onChangeText={setIfsc} />

               <CustomInput label="Pipe Type" placeholder="Enter Pipe" autoCapitalize="characters" value={pipe} onChangeText={setPipe} editable={false} />
            

              <View style={styles.footer}>
                <Pressable style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelText}>Cancel</Text></Pressable>
                <Pressable style={styles.submitBtn} onPress={handleSubmit}><Text style={styles.submitText}>Add Recipient</Text></Pressable>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

     
      <Toast /> 
      
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: "flex-end" },
  container: { backgroundColor: theme.colors.background.light, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "800", color: theme.colors.text.primary },
  dropdownWrapper: { position: 'relative', marginBottom: 15 },
  footer: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border.light, justifyContent: "center", alignItems: "center" },
  cancelText: { fontWeight: "700", color: theme.colors.text.secondary },
  submitBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: theme.colors.primary[600], justifyContent: "center", alignItems: "center" },
  submitText: { fontWeight: "800", color: "#FFF" },
});