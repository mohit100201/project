import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import {
  User,
  CreditCard,
  Search,
  Building2,
  FileText,
  Camera,
  X,
  CheckCircle2,
  ChevronRight,
  ShieldCheck
} from "lucide-react-native";

import { theme } from "@/theme";
import { getLatLong } from "@/utils/location";
import CustomInput from "@/components/ui/CustomInput";
import { createRecipient, getPaysprintBanks, uploadRecipientDocs } from "@/api/recipients.api";
import Toast from "react-native-toast-message";

const AddRecipient = () => {
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [bankModalVisible, setBankModalVisible] = useState(false);

  const [form, setForm] = useState({
    accountHolderName: "",
    bankName: "",
    bankId: "",
    accountNumber: "",
    ifsc: "",
    docType: "PAN",
    panImage: null as any,
    aadhaarFront: null as any,
    aadhaarBack: null as any,
    passbook: null as any,
  });

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) return;
      const res = await getPaysprintBanks(token);
      if (res.success) setBanks(res.data);
    } catch (err) {
      console.error("Bank fetch error:", err);
    }
  };

  const filteredBanks = banks.filter(bank =>
    bank.bank_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectBank = (bank: any) => {
    setForm({ ...form, bankName: bank.bank_name, bankId: bank.bank_id.toString() });
    setBankModalVisible(false);
    setSearchQuery("");
  };

  const pickImage = async (field: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setForm((prev) => ({
        ...prev,
        [field]: {
          uri: asset.uri,
          name: asset.fileName || `${field}.jpg`,
          type: "image/jpeg",
        },
      }));
    }
  };

  const handleSubmit = async () => {
  if (!form.accountNumber || !form.bankId || !form.passbook) {
    Toast.show({
      type: "error",
      text1: "Missing required fields",
      text2: "Account number, bank and passbook are required",
    });
    return;
  }

  setLoading(true);

  try {
    const token = await SecureStore.getItemAsync("userToken");
    const location = await getLatLong();

    if (!token || !location) {
      Toast.show({
        type: "error",
        text1: "Authentication error",
        text2: "Unable to get token or location",
      });
      return;
    }

    const payload1 = {
      account_holder_name: form.accountHolderName,
      bank_name: form.bankName,
      account_number: form.accountNumber,
      ifsc_code: form.ifsc,
      bankid: form.bankId,
    };

    const res1 = await createRecipient(token, payload1, location);

    // ✅ Recipient created / already exists / pending
    if ([1, 2, 4].includes(res1?.data?.code)) {
      const beneId = res1.data.data.bene_id;

      const formData = new FormData();
      formData.append("bene_id", beneId);
      formData.append("doctype", form.docType);
      formData.append("passbook", form.passbook as any);

      if (form.docType === "PAN" && form.panImage) {
        formData.append("panimage", form.panImage as any);
      }

      if (form.docType === "AADHAAR") {
        formData.append("front_aadhar", form.aadhaarFront as any);
        formData.append("back_aadhar", form.aadhaarBack as any);
      }

      const res2 = await uploadRecipientDocs(token, formData, location);

      // ✅ Upload success
      if (res2?.status === "success" || res2?.code === 1) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Recipient created successfully",
        });
        router.back();
        return;
      }

      // ❌ Upload failed
      Toast.show({
        type: "error",
        text1: "Upload failed",
        text2: res2?.message || "Document upload failed",
      });
      return;
    }

    // ❌ Recipient creation failed
    Toast.show({
      type: "error",
      text1: "Failed",
      text2: res1?.message || "Could not create recipient",
    });

  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Server error",
      text2: "Something went wrong. Please try again.",
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Account Holder */}
        <CustomInput
          label="Account Holder Name"
          placeholder="Enter name as per bank"
          iconStart={User}
          value={form.accountHolderName}
          onChangeText={(txt) => setForm({ ...form, accountHolderName: txt })}
        />

        {/* Bank Selection Trigger */}
        <Text style={styles.fieldLabel}>Bank Name</Text>
        <TouchableOpacity
          style={styles.selectorTrigger}
          onPress={() => setBankModalVisible(true)}
        >
          <View style={styles.selectorLeft}>
            <Building2 size={20} color={theme.colors.primary[500]} />
            <Text style={[styles.selectorText, !form.bankName && { color: theme.colors.text.secondary }]}>
              {form.bankName || "Select Bank"}
            </Text>
          </View>
          <ChevronRight size={18} color={theme.colors.text.tertiary} />
        </TouchableOpacity>

        <CustomInput
          label="Account Number"
          placeholder="0000 0000 0000 00"
          iconStart={CreditCard}
          keyboardType="number-pad"
          value={form.accountNumber}
          onChangeText={(txt) => setForm({ ...form, accountNumber: txt })}
        />

        <CustomInput
          label="IFSC Code"
          placeholder="e.g. PYTM0123456"
          iconStart={ShieldCheck}
          autoCapitalize="characters"
          value={form.ifsc}
          onChangeText={(txt) => setForm({ ...form, ifsc: txt })}
        />

        {/* Doc Type Toggle */}
        <Text style={styles.fieldLabel}>ID Verification Type</Text>
        <View style={styles.tabContainer}>
          {["PAN", "AADHAAR"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.tab, form.docType === type && styles.activeTab]}
              onPress={() => setForm({ ...form, docType: type })}
            >
              <Text style={[styles.tabText, form.docType === type && styles.activeTabText]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* File Uploads */}
        <View style={styles.uploadSection}>
          {form.docType === "PAN" ? (
            <FilePickerBox label="PAN Card Image" value={form.panImage} onPress={() => pickImage("panImage")} />
          ) : (
            <>
              <FilePickerBox label="Aadhaar Front" value={form.aadhaarFront} onPress={() => pickImage("aadhaarFront")} />
              <FilePickerBox label="Aadhaar Back" value={form.aadhaarBack} onPress={() => pickImage("aadhaarBack")} />
            </>
          )}
          <FilePickerBox label="Passbook / Cancelled Cheque" value={form.passbook} onPress={() => pickImage("passbook")} />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.8 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Verify & Add</Text>}
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bank Search Modal */}
      <Modal visible={bankModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Bank</Text>
            <TouchableOpacity onPress={() => setBankModalVisible(false)}>
              <X size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrapper}>
            <Search size={18} color={theme.colors.text.tertiary} style={styles.searchIcon} />
            <CustomInput
              style={styles.searchInput}
              placeholder="Search by name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredBanks}
            keyExtractor={(item) => item.bank_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.bankItem} onPress={() => selectBank(item)}>
                <Building2 size={18} color={theme.colors.text.tertiary} />
                <Text style={styles.bankItemText}>{item.bank_name}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// Helper Sub-component for File Pickers
const FilePickerBox = ({ label, value, onPress }: any) => (
  <View style={styles.fileBoxContainer}>
    <Text style={styles.fileLabel}>{label}</Text>
    <TouchableOpacity
      style={[styles.filePicker, value && styles.filePickerActive]}
      onPress={onPress}
    >
      {value ? (
        <View style={styles.fileInfo}>
          <CheckCircle2 size={16} color={theme.colors.status.approved.main} />
          <Text style={styles.fileSuccessText}>Document Attached</Text>
        </View>
      ) : (
        <View style={styles.fileInfo}>
          <Camera size={18} color={theme.colors.text.tertiary} />
          <Text style={styles.filePlaceholder}>Select Image</Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.light },
  scrollContent: { paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text.primary },
  subtitle: { fontSize: 14, color: theme.colors.text.tertiary, marginBottom: 10, marginTop: 4 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: theme.colors.text.secondary, marginBottom: 8, marginTop: 16 },
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  selectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectorText: { fontSize: 15, color: theme.colors.text.primary },
  tabContainer: { flexDirection: 'row', gap: 12, marginTop: 4 },
  tab: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#E5E7EB' },
  activeTab: { backgroundColor: theme.colors.primary[500] },
  tabText: { fontWeight: '700', color: theme.colors.text.tertiary },
  activeTabText: { color: '#FFF' },
  uploadSection: { marginTop: 20, gap: 12 },
  fileBoxContainer: { marginBottom: 4 },
  fileLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.text.tertiary, marginBottom: 6 },
  filePicker: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.light,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  filePickerActive: { borderColor: theme.colors.status.approved.main, backgroundColor: theme.colors.status.approved.bg + '20', borderStyle: 'solid' },
  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fileSuccessText: { color: theme.colors.status.approved.main, fontWeight: '700', fontSize: 14 },
  filePlaceholder: { color: theme.colors.text.tertiary, fontSize: 14 },
  submitBtn: {
    backgroundColor: theme.colors.primary[500],
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#FFF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', margin: 16, paddingHorizontal: 12, backgroundColor: '#F3F4F6', borderRadius: 12 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 48, fontSize: 16 },
  bankItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  bankItemText: { fontSize: 15, color: theme.colors.text.primary, fontWeight: '500' }
});

export default AddRecipient;