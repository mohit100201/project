import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Animated,
} from "react-native";
import {
  Plus,
  Trash2,
  ChevronRight,
  Building2,
  Wallet,
  Phone,
  ArrowRightLeft
} from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient'; // Optional: Use for gradients
import { theme } from "@/theme";
import { getLatLong } from '@/utils/location';
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { addRecipientApi, deleteRecipientApi, fetchDmtRecipientsApi, getDmtTransactionOTP, transferDmtAmount } from "../../api/dmt.api";
import Toast from "react-native-toast-message";
import DmtTransferModal from "@/components/ui/DmtTransferModal";
import CreateRecipientModal from "@/components/ui/CreateRecipientModal";


interface ManageRecipientsProps {
  selectedPipe: string;
  customerNumber: string;
}

export default function ManageRecipients({
  selectedPipe,
  customerNumber,
}: ManageRecipientsProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [recipientsLoading, setRecipientsLoading] = useState(true)
  const [txnLoading, setTxnLoading] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [selectedAmount, setSelectedAmount] = useState("");
  const [clientRefId, setClientRefId] = useState("");
  const [showCreateRecipient, setShowCreateRecipient] = useState(false);





  useEffect(() => {
    fetchRecipients();
  }, [selectedPipe, customerNumber]);


  const fetchRecipients = async () => {
    try {
      setRecipientsLoading(true);

      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");

      if (!location || !token) {
        Toast.show({
          type: "error",
          text1: "Missing location or session",
        });
        return;
      }

      const res = await fetchDmtRecipientsApi({
        token,
        latitude: String(location.latitude || "0.0"),
        longitude: String(location.longitude || "0.0"),
        pipe: selectedPipe,
        customerId: customerNumber,
      });

     

      // ✅ SUCCESS & DATA MAPPING
      if (
        res.success &&
        res.data?.raw?.errorCode === "00" &&
        Array.isArray(res.data.raw.data?.recipientList)
      ) {
        const mappedRecipients = res.data.raw.data.recipientList.map((r: any) => ({
          id: r.recipientId,
          name: r.recipientName,
          bankName: r.bankName,
          phone: r.mobileNo,
          accountNo: r.udf1,     // Account Number
          ifsc: r.udf2,          // IFSC Code
          isVerified: r.isVerified === "1",
        }));

        setRecipients(mappedRecipients);
      } else {
        setRecipients([]);
        Toast.show({
          type: "info",
          text1: "No recipients found",
        });
      }
    } catch (error: any) {
      console.error("Fetch Recipients Error:", error);

      Toast.show({
        type: "error",
        text1: "Failed to load recipients",
        text2: error?.message || "Something went wrong",
      });
    } finally {
      setRecipientsLoading(false);
    }
  };

  const sendOtpHandler = async (amount: string) => {
    try {
      if (!selectedRecipient) return false;

      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");

      if (!location || !token) {
        Toast.show({ type: "error", text1: "Session expired" });
        return false;
      }

      const refId = `${Date.now()}`;
      setClientRefId(refId);
      setSelectedAmount(amount);

      const res = await getDmtTransactionOTP({
        token,
        latitude: String(location.latitude || "0.0"),
        longitude: String(location.longitude || "0.0"),
        pipe: selectedPipe,
        customerId: customerNumber,
        recipientId: selectedRecipient.id,
        amount,
        name: selectedRecipient.name,
        clientRefId: refId,
      });

      if (res.success && res.data?.raw?.errorCode === "00") {
        Toast.show({
          type: "success",
          text1: "OTP Sent",
          text2: "Enter OTP to complete transfer",
        });
        return true;
      }

      Toast.show({
        type: "error",
        text1: "OTP Failed",
        text2: res.data?.raw?.errorMsg || "Unable to send OTP",
      });

      return false;
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "OTP Error",
        text2: err?.message,
      });
      return false;
    }
  };



  const verifyOtpHandler = async (otp: string) => {
    try {
      if (!selectedRecipient) return;

      const location = await getLatLong();
      const token = await SecureStore.getItemAsync("userToken");

      if (!location || !token) {
        Toast.show({ type: "error", text1: "Session expired" });
        return;
      }

      const res = await transferDmtAmount({
        token,
        latitude: String(location.latitude || "0.0"),
        longitude: String(location.longitude || "0.0"),
        pipe: selectedPipe,
        otp,
        amount: selectedAmount,
        customerId: customerNumber,
        recipientId: selectedRecipient.id,
        name: selectedRecipient.name,
        clientRefId,
      });


      if (res.success && res.data?.errorCode === "00") {
        Toast.show({
          type: "success",
          text1: "Transfer Successful",
          text2: `Txn ID: ${res.data.data.txnId}`,
        });

        setShowTransferModal(false);

        // 🔜 Optional: show receipt modal here
      } else {
        Toast.show({
          type: "error",
          text1: "Transfer Failed",
          text2: res.data?.errorMsg || "Transaction failed",
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Transfer Error",
        text2: err?.message || "Something went wrong",
      });
    }
  };

  const createRecipientHandler = async (data: any) => {
  try {
    // 1. Get location and token (standard for your DMT app)
    const location = await getLatLong();
    const token = await SecureStore.getItemAsync("userToken");

    if (!location || !token) throw new Error("Session expired or location unavailable");

    // 2. Map payload to the API's expected keys
    const payload = {
      token,
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      recipientName: data.name,      // Map 'name' to 'recipientName'
      mobileNo: data.mobile,         // Map 'mobile' to 'mobileNo'
      bankName: data.bank,           // This is the code (e.g., '1229')
      accountNo: data.accountNo,
      ifsc: data.ifsc,
      pipe: data.pipe,
      customerId: customerNumber,   
    };


    // 3. Call the API
    const response = await addRecipientApi(payload);

    if (response.success) {
      Toast.show({
        type: "success",
        text1: "Recipient Added",
        text2: response.message || "Recipient created successfully",
      });

      setShowCreateRecipient(false);
      
      // 🔄 Refresh list
      fetchRecipients();
    } else {
      throw new Error(response.message || "API returned failure");
    }

  } catch (err: any) {
    Toast.show({
      type: "error",
      text1: "Create Failed",
      text2: err?.message || "Unable to add recipient",
    });
  }
};

const deleteRecipientHandler = async (recipientId: string) => {
  try {
    // 1. Get required metadata
    const location = await getLatLong();
    const token = await SecureStore.getItemAsync("userToken");
    
    // Using the customer ID from your example
    const customerId = "9529911808"; 

    if (!location || !token) return;

    // 2. Call the Delete API
    const response = await deleteRecipientApi({
      token,
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      customerId,
      recipientId,
    });

    if (response.success) {
      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: "Recipient removed successfully",
      });
      
      // 3. Refresh the list to show updated data
      fetchRecipients();
    }
  } catch (err: any) {
    Toast.show({
      type: "error",
      text1: "Delete Failed",
      text2: err?.message || "Could not delete recipient",
    });
  }
};



  return (
    <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>
      {/* 1. PREMIUM HEADER */}
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.screenTitle}>Recipients</Text>
          <Text style={styles.screenSub}>{recipients.length} saved accounts</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            pressed && { opacity: 0.8, scale: 0.95 },
          ]}
          onPress={() => setShowCreateRecipient(true)}
        >
          <Plus size={22} color="#FFF" strokeWidth={3} />
        </Pressable>

      </View>

      {/* 2. RECIPIENT CARDS */}
      {recipients.map((item: any) => (
        <View key={item.id} style={styles.outerCard}>
          {/* Top Row: Avatar & Action */}
          <View style={styles.cardHeader}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarGradient}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.statusDot} />
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.recipientName}>{item.name}</Text>
              <View style={styles.bankTag}>
                <Building2 size={12} color={theme.colors.primary[600]} />
                <Text style={styles.bankSubtext} numberOfLines={1}>{item.bankName}</Text>
              </View>
            </View>

            <Pressable onPress={()=>{deleteRecipientHandler(item.id)}} style={styles.deleteBtn}>
              <Trash2 size={18} />
            </Pressable>
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>ACCOUNT NUMBER</Text>
              <Text style={styles.detailValue}>{item.accountNo}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>IFSC CODE</Text>
              <Text style={styles.detailValue}>{item.ifsc}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={[styles.detailsGrid, { marginTop: 0 }]}>
            <View style={styles.detailItem}>
              <View style={styles.labelWithIcon}>
                <Phone size={10} color="#94A3B8" />
                <Text style={styles.detailLabel}>MOBILE</Text>
              </View>
              <Text style={styles.detailValue}>+91 {item.phone}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.labelWithIcon}>
                <ArrowRightLeft size={10} color="#94A3B8" />
                <Text style={styles.detailLabel}>LIMIT</Text>
              </View>
              <Text style={styles.detailValue}>₹25,000</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.transferBtn,
              pressed && { transform: [{ scale: 0.98 }] },
              txnLoading === item.id && { opacity: 0.7 },
            ]}
            disabled={txnLoading === item.id}
            onPress={() => {
              setSelectedRecipient(item);
              setShowTransferModal(true);
            }}

          >
            <View style={styles.transferBtnContent}>
              <Wallet size={18} color="#FFF" />
              <Text style={styles.transferText}>
                {txnLoading === item.id ? "Sending OTP..." : "Send Money Now"}
              </Text>
            </View>

            {txnLoading === item.id ? (
              <Text style={{ color: "#FFF", fontSize: 12 }}>⏳</Text>
            ) : (
              <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
            )}
          </Pressable>
        </View>
      ))}

      {selectedRecipient && (
        <DmtTransferModal
          visible={showTransferModal}
          pipe={selectedPipe}
          onClose={() => setShowTransferModal(false)}
          onSendOtp={sendOtpHandler}
          onTransfer={verifyOtpHandler}
        />
      )}

        <CreateRecipientModal
      visible={showCreateRecipient}
      onClose={() => setShowCreateRecipient(false)}
      onSubmit={createRecipientHandler}
      selectedPipe={selectedPipe}
    />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 16
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: -0.5,
  },
  screenSub: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  addBtn: {
    backgroundColor: theme.colors.primary[600],
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  outerCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarGradient: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: theme.colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.primary[100],
  },
  avatarText: {
    color: theme.colors.primary[600],
    fontSize: 22,
    fontWeight: "800",
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  recipientName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  bankTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  bankSubtext: {
    fontSize: 11,
    color: theme.colors.primary[700],
    fontWeight: "700",
    maxWidth: 150,
  },
  deleteBtn: {
    padding: 10,
    backgroundColor: "#f1323fff",
    borderRadius: 12,
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",

    padding: 16,
    borderRadius: 16,
  },
  detailItem: {
    flex: 1,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 0,
  },
  transferBtn: {
    backgroundColor: theme.colors.primary[600],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 20,
    shadowColor: theme.colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  transferBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transferText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
  },
});