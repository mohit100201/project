import React, { useState } from "react";
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



export default function ManageRecipients() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [recipients] = useState([
    {
      id: "1",
      name: "RAMESHWAR JAKHAR",
      accountNo: "83043564539",
      bankName: "RAJASTHAN MARUDHARA GRAMIN BANK",
      ifsc: "RMGB0000187",
      phone: "9529911808",
    },
  ]);

  return (
    <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>
      {/* 1. PREMIUM HEADER */}
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.screenTitle}>Recipients</Text>
          <Text style={styles.screenSub}>{recipients.length} saved accounts</Text>
        </View>
        <Pressable 
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8, scale: 0.95 }]} 
          onPress={() => setIsModalVisible(true)}
        >
          <Plus size={22} color="#FFF" strokeWidth={3} />
        </Pressable>
      </View>

      {/* 2. RECIPIENT CARDS */}
      {recipients.map((item) => (
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

            <Pressable style={styles.deleteBtn}>
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

          {/* Action Button */}
          <Pressable style={({ pressed }) => [
            styles.transferBtn,
            pressed && { transform: [{ scale: 0.98 }] }
          ]}>
            <View style={styles.transferBtnContent}>
              <Wallet size={18} color="#FFF" />
              <Text style={styles.transferText}>Send Money Now</Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>
      ))}
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
    marginTop:16
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