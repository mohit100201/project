import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
    FlatList,
    Pressable,
    Keyboard,
    Vibration,

} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown
} from "react-native-reanimated";
import { theme } from "@/theme";
import {
    Smartphone, IndianRupee, Zap, ChevronRight,
    Tv, X, CheckCircle2, MapPin, Building2, Ticket, Clock, Search, Delete
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

// Internal Imports
import { operators } from "@/utils/operators";
import { getLatLong } from "@/utils/location";
import { checkMobilePlansApi, checkOperatorApi, checkROffersApi, rechargeRequestApi } from "../api/recharge.api";
import { confirmMpinApi } from "../api/mpin.api";

/* ---------------- ANIMATED MODAL COMPONENT ---------------- */
const CustomModal = ({ visible, onClose, title, subtitle, children, height = '70%' }: any) => {
    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <Animated.View
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(200)}
                    style={StyleSheet.absoluteFill}
                >
                    <Pressable style={{ flex: 1 }} onPress={onClose} />
                </Animated.View>

                <Animated.View
                    entering={SlideInDown.springify().damping(18)}
                    exiting={SlideOutDown.duration(300)}
                    style={[styles.modalContent, { height }]}
                >
                    <View style={styles.modalIndicator} />
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>{title}</Text>
                            {subtitle && <Text style={styles.modalSubtitle}>{subtitle}</Text>}
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                    {children}
                </Animated.View>
            </View>
        </Modal>
    );
};

export default function RechargeScreen() {
    const [mobile, setMobile] = useState("");
    const [operator, setOperator] = useState<any>(null);
    const [circle, setCircle] = useState("");
    const [circleCode, setCircleCode] = useState("")
    const [operatorCode, setOperatorCode] = useState('')
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [fetchingOffers, setFetchingOffers] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [offerModalVisible, setOfferModalVisible] = useState(false);
    const [offersList, setOffersList] = useState<any[]>([]);
    const [fetchingPlans, setFetchingPlans] = useState(false);
    const [planModalVisible, setPlanModalVisible] = useState(false);
    const [plansData, setPlansData] = useState<any>(null); // Stores RDATA
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [mpinModalVisible, setMpinModalVisible] = useState(false);
    const [mpin, setMpin] = useState("");
    const [verifyingMpin, setVerifyingMpin] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);


    // Helper to render keypad buttons
  const KeyButton = ({ value, onPress, isDelete = false }: any) => {
  return (
    <TouchableOpacity
      style={styles.key}
      onPress={() => {
        Vibration.vibrate(10);
        onPress();
      }}
      activeOpacity={0.7}
    >
      {isDelete ? (
        <Delete size={24} color="#475569" />
      ) : (
        <Text style={styles.keyText}>{String(value)}</Text>
      )}
    </TouchableOpacity>
  );
};




    const isDTH = operator && operator.value >= 7 && operator.value <= 12;

    const supportsROffers =
        operator?.label?.toUpperCase().includes("AIRTEL") ||
        operator?.label?.toUpperCase().includes("VI") ||
        operator?.label?.toUpperCase().includes("VODAFONE") ||
        operator?.label?.toUpperCase().includes("JIO");

    useEffect(() => {
        if (mobile.length === 10 && !isDTH) {
            fetchOperatorDetails(mobile);
        } else if (mobile.length < 10) {
            setCircle("");
            setSelectedPlan(null);
            setAmount("");
            setOperator("")
        }
    }, [mobile]);

    const fetchOperatorDetails = async (mobileNumber: string) => {
        try {
            setDetecting(true);
            const location = await getLatLong();
            const token = await SecureStore.getItemAsync("userToken");
            const domainName = Constants.expoConfig?.extra?.tenantData?.domain || "pinepe.in";

            const res = await checkOperatorApi({
                mobile: mobileNumber,
                domain: domainName,
                latitude: location?.latitude?.toString() || "0.0",
                longitude: location?.longitude?.toString() || "0.0",
                token: token || "",
            });


            if (res.success && res.data?.data?.Operator) {

                const apiOperatorName = res.data.data.Operator.toUpperCase();

                const matchedOp = operators.find((op) =>
                    apiOperatorName.includes(op.label.toUpperCase()) ||
                    op.label.toUpperCase().includes(apiOperatorName)
                );

                if (matchedOp) {
                    setOperator(matchedOp);
                    setCircle(res.data.data.Circle || "India");
                    setCircleCode(res.data.data.circleCode || "00")
                    setOperatorCode(res.data.data.OpCode);
                    console.log("==res==", res)



                }
            }
        } catch (err) {
            console.error("Auto-detect Error:", err);
        } finally {
            setDetecting(false);
        }
    };

    const handleCheckOffers = async () => {
        try {
            setFetchingOffers(true);

            const location = await getLatLong();
            const token = await SecureStore.getItemAsync("userToken");
            const domainName =
                Constants.expoConfig?.extra?.tenantData?.domain || "pinepe.in";

            const res = await checkROffersApi({
                mobile,
                operator_code: operatorCode,
                domain: domainName,
                latitude: location?.latitude?.toString() || "0.0",
                longitude: location?.longitude?.toString() || "0.0",
                token: token || "",
            });


            const offers = res?.data?.data?.RDATA;

            if (res.success && Array.isArray(offers) && offers.length > 0) {
                setOffersList(offers);
                setOfferModalVisible(true);
            } else {
                Toast.show({
                    type: "info",
                    text1: "No Special Offers",
                    text2: res?.data?.data?.MESSAGE || "Check regular plans instead."
                });
            }
        } catch (err) {
            Toast.show({ type: "error", text1: "Could not fetch offers" });
        } finally {
            setFetchingOffers(false);
        }
    };


    const handleFetchPlans = async () => {
        console.log("hii")
        if (!operator || !circle) {
            Toast.show({ type: "error", text1: "Please select operator first" });
            return;
        }

        try {
            setFetchingPlans(true);
            const location = await getLatLong();
            const token = await SecureStore.getItemAsync("userToken");
            const domainName = Constants.expoConfig?.extra?.tenantData?.domain || "pinepe.in";

            console.log("==operator code==", operatorCode)
            console.log("==circle code==", circleCode)
            const res = await checkMobilePlansApi({
                operator_code: operatorCode,
                circle: circleCode, // Matches your API parameter
                domain: domainName,
                latitude: location?.latitude?.toString() || "0.0",
                longitude: location?.longitude?.toString() || "0.0",
                token: token || "",
            });



            if (res.success) {
                const planObj = res.data.data.RDATA;


                const keys = Object.keys(planObj).filter(
                    key => Array.isArray(planObj[key]) && planObj[key].length > 0
                );

                if (keys.length === 0) {
                    Toast.show({ type: "info", text1: "No plans available" });
                    return;
                }

                setPlansData(planObj);
                setCategories(keys);
                setSelectedCategory(keys[0]);
                setPlanModalVisible(true);
            } else {
                Toast.show({ type: "info", text1: "No plans available" });
            }

        } catch (err) {
            console.error(err);
            Toast.show({ type: "error", text1: "Failed to load plans" });
        } finally {
            setFetchingPlans(false);
        }
    };

    const handleKeyPress = (val: string) => {
        if (mpin.length < 4) {
            Vibration.vibrate(10);
            setMpin((prev) => prev + val);
        }
    };

    const handleDelete = () => {
        Vibration.vibrate(10);
        setMpin((prev) => prev.slice(0, -1));
    };

    const handleMpinSubmit = async () => {
        if (mpin.length < 4) {
            Toast.show({ type: "error", text1: "Please enter a valid MPIN" });
            return;
        }

        try {
            setVerifyingMpin(true);
            const location = await getLatLong();
            const token = await SecureStore.getItemAsync("userToken");
            const domainName = Constants.expoConfig?.extra?.tenantData?.domain || "pinepe.in";

            const res = await confirmMpinApi({
                domain: domainName,
                latitude: location?.latitude?.toString() || "0",
                longitude: location?.longitude?.toString() || "0",
                token: token || "",
                mpin: mpin,
            });

            if (res.success) {
                // 1. Close the modal first
                setMpinModalVisible(false);
                setMpin("");

                // 2. TRIGGER THE RECHARGE API
                await executeRechargeRequest();
            } else {
                setMpin(""); // Clear MPIN on failure
                Toast.show({ type: "error", text1: res.message || "Invalid MPIN" });
            }
        } catch (error) {
            Toast.show({ type: "error", text1: "Verification failed" });
        } finally {
            setVerifyingMpin(false);
        }
    };

    // New function to handle the actual recharge API call
    const executeRechargeRequest = async () => {
        try {
            setLoading(true);
            const location = await getLatLong();
            const token = await SecureStore.getItemAsync("userToken");
            const domainName = Constants.expoConfig?.extra?.tenantData?.domain || "pinepe.in";

            const res = await rechargeRequestApi({
                domain: domainName,
                latitude: location?.latitude?.toString() || "0.0",
                longitude: location?.longitude?.toString() || "0.0",
                token: token || "",
                mobile: mobile,
                amount: amount,
                operator_code: operator?.value,
            });

            if (res.success) {
                Toast.show({
                    type: "success",
                    text1: "Recharge Successful",
                    text2: res.message || `₹${amount} paid for ${mobile}`
                });
                // Clear the form after success
                setMobile("");
                setAmount("");
                setOperator(null);
                setCircle("");
            } else {
                Toast.show({
                    type: "error",
                    text1: "Recharge Failed",
                    text2: res.message || "Something went wrong"
                });
            }
        } catch (error) {
            console.error("Recharge Error:", error);
            Toast.show({ type: "error", text1: "Transaction failed", text2: "Please try again later" });
        } finally {
            setLoading(false);
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>


                    <View style={styles.formCard}>
                        {/* INPUT: Number */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{isDTH ? "Subscriber ID" : "Phone Number"}</Text>
                            <View style={styles.inputWrapper}>
                                {isDTH ? <Tv size={20} color={theme.colors.primary[500]} /> : <Smartphone size={20} color={theme.colors.primary[500]} />}
                                <TextInput
                                    style={styles.input}
                                    placeholder={isDTH ? "Enter Customer ID" : "Enter 10 digit number"}
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                    value={mobile}
                                    onChangeText={setMobile}
                                />
                                {detecting && <ActivityIndicator size="small" color={theme.colors.primary[500]} />}
                            </View>
                        </View>

                        {/* DETECTED INFO BOX */}
                        {circle !== "" && operator && (
                            <View style={styles.fetchedDataContainer}>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.infoRow}>
                                        <Building2 size={14} color="#64748B" />
                                        <Text style={styles.infoText}>Operator: <Text style={styles.infoHighlight}>{operator.label}</Text></Text>
                                    </View>
                                    <View style={[styles.infoRow, { marginTop: 6 }]}>
                                        <MapPin size={14} color="#64748B" />
                                        <Text style={styles.infoText}>Circle: <Text style={styles.infoHighlight}>{circle}</Text></Text>
                                    </View>
                                </View>

                                {supportsROffers && (
                                    <TouchableOpacity style={styles.offerBtn} onPress={handleCheckOffers} disabled={fetchingOffers}>
                                        {fetchingOffers ? <ActivityIndicator size="small" color={theme.colors.primary[500]} /> : (
                                            <>
                                                <Ticket size={14} color={theme.colors.primary[500]} />
                                                <Text style={styles.offerBtnText}>Offers</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* PICKER: Operator */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Operator</Text>
                            <TouchableOpacity style={styles.pickerTrigger} onPress={() => setModalVisible(true)}>
                                <Text style={[styles.pickerTriggerText, !operator && { color: "#94A3B8" }]}>
                                    {operator ? operator.label : "Choose Provider"}
                                </Text>
                                <ChevronRight size={20} color="#64748B" style={{ transform: [{ rotate: '90deg' }] }} />
                            </TouchableOpacity>
                        </View>

                        {/* SELECTED PLAN SUMMARY */}
                        {selectedPlan && (
                            <View style={styles.selectedPlanCard}>
                                <View style={styles.selectedPlanHeader}>
                                    <Text style={styles.selectedPlanPrice}>₹{selectedPlan.rs}</Text>
                                    <View style={styles.validityBadge}>
                                        <Clock size={12} color={theme.colors.primary[600]} />
                                        <Text style={styles.validityText}>{selectedPlan.validity}</Text>
                                    </View>
                                </View>

                                <Text style={styles.selectedPlanDesc} numberOfLines={3}>
                                    {selectedPlan.desc}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => setPlanModalVisible(true)}
                                    style={styles.changePlanBtn}
                                >
                                    <Text style={styles.changePlanText}>Change Plan</Text>
                                </TouchableOpacity>
                            </View>
                        )}


                        {/* INPUT: Amount */}
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>Amount</Text>

                                {/* Only show Browse Plans for Mobile, not DTH */}
                                {!isDTH && operator && (
                                    <TouchableOpacity
                                        onPress={handleFetchPlans}
                                        disabled={fetchingPlans}
                                        style={styles.browseBtn}
                                    >
                                        {fetchingPlans ? (
                                            <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                                        ) : (
                                            <View style={styles.browseContainer}>
                                                <Search size={14} color={theme.colors.primary[600]} strokeWidth={2.5} />
                                                <Text style={styles.browseText}>Browse Plans</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.inputWrapper}>
                                <IndianRupee size={20} color={theme.colors.primary[500]} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="0.00"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                            </View>
                        </View>

                        {/* SUBMIT BUTTON */}
                        <TouchableOpacity
                            style={[styles.btn, (loading || !amount || !mobile) && { opacity: 0.7 }]}
                            onPress={() => setMpinModalVisible(true)} // Open MPIN modal first
                            disabled={loading || !amount || mobile.length < 10}
                        >
                            <View style={styles.btnLeft}>
                                <Zap size={18} color="#FFF" fill="#FFF" />
                                <Text style={styles.btnText}>Proceed to Pay</Text>
                            </View>
                            <ChevronRight size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* MODAL: SELECT OPERATOR */}
            <CustomModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title="Select Operator"
                height="65%"
            >
                <FlatList
                    data={operators}
                    keyExtractor={(item) => item.value.toString()}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.operatorItem} onPress={() => { setOperator(item); setModalVisible(false); }}>
                            <View style={styles.operatorLogoPlaceholder}><Text style={styles.logoText}>{item.label.charAt(0)}</Text></View>
                            <Text style={styles.operatorLabel}>{item.label}</Text>
                            {operator?.value === item.value && <CheckCircle2 size={20} color={theme.colors.primary[500]} />}
                        </TouchableOpacity>
                    )}
                />
            </CustomModal>

            {/* MODAL: SPECIAL R-OFFERS */}
            <CustomModal
                visible={offerModalVisible}
                onClose={() => setOfferModalVisible(false)}
                title="Exclusive Offers"
                subtitle={`Best plans for ${mobile}`}
                height="80%"
            >
                <FlatList
                    data={offersList}
                    keyExtractor={(_, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.offerCard}
                            onPress={() => {
                                setAmount(item.price);
                                setSelectedPlan({
                                    rs: item.price,
                                    validity: `${item.validity} Days`,
                                    desc: item.ofrtext.replace('|', ''),
                                });
                                setOfferModalVisible(false);
                            }}
                        >
                            <View style={styles.offerCardHeader}>
                                <View style={styles.priceContainer}>
                                    <Text style={styles.priceSym}>₹</Text>
                                    <Text style={styles.priceVal}>{item.price}</Text>
                                </View>
                                <View style={styles.validityBadge}>
                                    <Clock size={12} color={theme.colors.primary[600]} />
                                    <Text style={styles.validityText}>{item.validity} Days</Text>
                                </View>
                            </View>
                            <Text style={styles.offerDescText}>{item.ofrtext.replace('|', '')}</Text>
                            <View style={styles.offerFooter}>
                                <Text style={styles.selectText}>Apply Plan</Text>
                                <ChevronRight size={14} color={theme.colors.primary[500]} />
                            </View>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </CustomModal>

            {/* MODAL: BROWSE PLANS */}
            <CustomModal
                visible={planModalVisible}
                onClose={() => setPlanModalVisible(false)}
                title="Browse Plans"
                height="90%"
            >
                {/* Category Tabs */}
                <View style={{ marginBottom: 15 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setSelectedCategory(cat)}
                                style={[
                                    styles.tabItem,
                                    selectedCategory === cat && styles.tabItemActive
                                ]}
                            >
                                <Text style={[
                                    styles.tabText,
                                    selectedCategory === cat && styles.tabTextActive
                                ]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Plans List */}
                <FlatList
                    data={plansData ? plansData[selectedCategory] : []}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.planCard}
                            onPress={() => {
                                setAmount(item.rs.toString());
                                setSelectedPlan(item); // ✅ SAVE PLAN
                                setPlanModalVisible(false);
                            }}
                        >
                            <View style={styles.planHeader}>
                                <Text style={styles.planPrice}>₹{item.rs}</Text>
                                <View style={styles.validityBadge}>
                                    <Text style={styles.validityText}>{item.validity}</Text>
                                </View>
                            </View>

                            <Text style={styles.planDesc} numberOfLines={3}>
                                {item.desc}
                            </Text>

                            <View style={styles.selectButton}>
                                <Text style={styles.selectButtonText}>Select Plan</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No plans in this category</Text>}
                />
            </CustomModal>

            {/* MODAL: MPIN CONFIRMATION */}
            <CustomModal
                visible={mpinModalVisible}
                onClose={() => {
                    Keyboard.dismiss();
                    setMpinModalVisible(false);
                    setMpin("");
                }}
                title="Enter MPIN"
                subtitle="Confirm your security code to proceed"
            >
                <View style={styles.contentWrapper}>

                    {/* 1. VISUAL DOTS */}
                    <View style={styles.dotsContainer}>
                        {[1, 2, 3, 4].map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.mpinDot,
                                    mpin.length > i && styles.mpinDotFilled,
                                    // Add a primary green color to match your AEPS theme
                                    mpin.length > i && { backgroundColor: "#10B981" }
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
                        disabled={verifyingMpin || mpin.length < 4}
                        activeOpacity={0.8}
                        style={styles.btnSpacing}
                    >
                        <LinearGradient
                            colors={["#10B981", "#059669"]} // Green Gradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                                styles.gradientBtn,
                                (mpin.length < 4 || verifyingMpin) && { opacity: 0.5 }
                            ]}
                        >
                            {verifyingMpin ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <View style={styles.btnInnerContent}>
                                    <CheckCircle2 size={18} color="#FFF" />
                                    <Text style={styles.confirmBtnText}>Confirm Payment</Text>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </CustomModal>


        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.dark },
    scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 },
    header: { marginBottom: 25, paddingLeft: 4, paddingTop: 20 },
    title: { fontSize: 28, fontWeight: "900", color: theme.colors.text.primary },
    subtitle: { color: theme.colors.text.secondary, fontSize: 15, marginTop: 2 },
    formCard: { backgroundColor: "#FFF", borderRadius: 24, padding: 24, elevation: 5, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
    inputGroup: { marginBottom: 20 },
    label: { color: "#475569", fontSize: 11, fontWeight: "800", marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 14, paddingHorizontal: 16, height: 58, borderWidth: 1, borderColor: "#E2E8F0" },
    input: { flex: 1, color: "#1E293B", fontSize: 16, marginLeft: 12, fontWeight: "600" },

    fetchedDataContainer: { flexDirection: 'row', backgroundColor: "#F1F5F9", padding: 14, borderRadius: 16, marginBottom: 20, alignItems: 'center', borderLeftWidth: 4, borderLeftColor: theme.colors.primary[500] },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    infoText: { fontSize: 13, color: "#64748B", marginLeft: 8 },
    infoHighlight: { color: "#1E293B", fontWeight: "700" },

    offerBtn: { backgroundColor: "#FFF", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.primary[200] },
    offerBtnText: { color: theme.colors.primary[600], fontSize: 12, fontWeight: "700", marginLeft: 6 },

    pickerTrigger: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F8FAFC", borderRadius: 14, paddingHorizontal: 16, height: 58, borderWidth: 1, borderColor: "#E2E8F0" },
    pickerTriggerText: { fontSize: 16, color: "#1E293B", fontWeight: "600" },

    /* MODAL STYLES */
    modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.7)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: "#FFF", borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingBottom: 20 },
    modalIndicator: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
    modalTitle: { fontSize: 24, fontWeight: "900", color: "#1E293B" },
    modalSubtitle: { fontSize: 14, color: "#64748B", marginTop: 2 },
    closeBtn: { backgroundColor: "#F1F5F9", padding: 8, borderRadius: 12 },

    operatorItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
    operatorLogoPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary[50], justifyContent: "center", alignItems: "center", marginRight: 15 },
    logoText: { color: theme.colors.primary[500], fontWeight: "800" },
    operatorLabel: { flex: 1, fontSize: 16, fontWeight: "600", color: "#334155" },

    /* OFFER CARD STYLES */
    offerCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    offerCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
    priceSym: { fontSize: 16, fontWeight: '700', color: theme.colors.primary[600], marginRight: 1 },
    priceVal: { fontSize: 24, fontWeight: '900', color: "#1E293B" },
    validityBadge: { backgroundColor: theme.colors.primary[50], paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
    validityText: { color: theme.colors.primary[700], fontSize: 12, fontWeight: '700', marginLeft: 4 },
    offerDescText: { fontSize: 14, color: "#475569", lineHeight: 20, marginBottom: 12 },
    offerFooter: { borderTopWidth: 1, borderTopColor: "#F8FAFC", paddingTop: 10, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    selectText: { color: theme.colors.primary[600], fontWeight: '800', fontSize: 13, marginRight: 4 },

    btn: { backgroundColor: theme.colors.primary[500], height: 60, borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 10 },
    btnLeft: { flexDirection: 'row', alignItems: 'center' },
    btnText: { color: "#FFF", fontSize: 18, fontWeight: "800", marginLeft: 10 },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    browseBtn: {
        paddingLeft: 10,
        paddingVertical: 2,
    },
    browseText: {
        color: theme.colors.primary[600],
        fontSize: 12,
        fontWeight: "800",

    },
    browseContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4, // Space between icon and text
    },

    planCard: {
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#F1F5F9",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    planMainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    planPriceSection: { flexDirection: 'row', alignItems: 'baseline' },
    planRupee: { fontSize: 16, fontWeight: '700', color: theme.colors.primary[600] },
    planPriceText: { fontSize: 24, fontWeight: '900', color: "#1E293B", marginLeft: 2 },
    categoryBadge: { backgroundColor: "#F1F5F9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    categoryText: { fontSize: 10, fontWeight: '800', color: "#64748B", textTransform: 'uppercase' },
    planStatsRow: { flexDirection: 'row', marginBottom: 8 },
    planStat: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    planStatText: { fontSize: 12, fontWeight: '700', color: "#475569", marginLeft: 4 },
    planDescText: { fontSize: 13, color: "#64748B", lineHeight: 18, marginBottom: 12 },
    planFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC'
    },
    applyText: { color: theme.colors.primary[600], fontWeight: '800', fontSize: 13, marginRight: 4 },
    tabItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    tabItemActive: {
        backgroundColor: theme.colors.primary[600],
    },
    tabText: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 13,
    },
    tabTextActive: {
        color: '#FFF',
    },

    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    planPrice: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
    },


    planDesc: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
        marginBottom: 12,
    },
    selectButton: {
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    selectButtonText: {
        color: theme.colors.primary[600],
        fontWeight: '700',
    },
    emptyContainer: {
        paddingVertical: 60, // Gives space so it doesn't look cramped
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: '#94A3B8', // A soft gray/slate color
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 0.3,
    },

    selectedPlanCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    selectedPlanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },

    selectedPlanPrice: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },

    selectedPlanDesc: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
        marginBottom: 8,
    },

    changePlanBtn: {
        alignSelf: 'flex-end',
    },

    changePlanText: {
        color: theme.colors.primary[600],
        fontWeight: '800',
        fontSize: 12,
    },
    modalScrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },


    premiumInputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 70,
        backgroundColor: '#FFF',
        borderRadius: 22,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mpinTextInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginLeft: 12,
    },
    inputDecorDots: {
        flexDirection: 'row',
        gap: 4,
    },
    miniDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#CBD5E1',
    },
    gradientBtnWrapper: {
        width: '100%',
        marginTop: 30,
        elevation: 8,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },


    checkCircleWhite: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    cancelLink: {
        marginTop: 25,
        padding: 10,
    },
    cancelLinkText: {
        color: '#10B981', // Emerald Green from reference
        fontSize: 16,
        fontWeight: '700',
    },
    contentWrapper: { paddingVertical: 10, alignItems: "center" },
    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 30,
        marginTop: 10,
    },
    mpinDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: "#E2E8F0",
        marginHorizontal: 12,
    },
    mpinDotFilled: {
        borderColor: "#10B981",
        transform: [{ scale: 1.1 }],
    },
    keypadGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        width: "100%",
        justifyContent: "center",
        marginBottom: 20,
    },
    key: {
        width: "30%",
        height: 65,
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 5,
    },
    keyText: {
        fontSize: 26,
        fontWeight: "600",
        color: "#1E293B",
    },
    btnSpacing: { width: "100%", marginTop: 10 },
    gradientBtn: {
        height: 55,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    btnInnerContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    confirmBtnText: {
        color: "#FFF",
        fontWeight: "700",
        fontSize: 16,
        marginLeft: 10,
    },

});