import CustomDropdown from '@/components/ui/CustomDropdown'
import CustomInput from '@/components/ui/CustomInput'
import { theme } from '@/theme'
import { getLatLong } from '@/utils/location'
import { RotateCcw, Search, Send, User } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { useBranding } from '@/context/BrandingContext';
import { doPayoutTransferApi, getActiveRecipientsApi, getPaymentMethodsApi } from '../../api/payout.api'
import Toast from 'react-native-toast-message'
import { getProfileApi } from '../../api/profile.api'
import { useLocalSearchParams } from 'expo-router'

interface BeneficiaryData {
    id: number;
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    account_holder_name: string;
}

interface BeneficiaryDropdownItem {
    label: string;
    value: string;
    rawData: BeneficiaryData; // We use 'rawData' to store the full object
}

const RequestPayout = () => {
    const params = useLocalSearchParams();
    const { heading } = params
    const [beneficiary, setBeneficiary] = useState("")
    const [accountHolderName, setAccountHolderName] = useState("")
    const [bankName, setBankName] = useState("")
    const [accountNumber, setAccountNumber] = useState("")
    const [IFSCCode, setIFSCCode] = useState("")
    const [remark, setRemark] = useState('')
    const [transferAmount, setTransferAmount] = useState("")
    const [openTransferMode, setOpenTransferMode] = useState(false);
    const [transferModeValue, setTransferModeValue] = useState("All");
    const [transferMode, setTransferMode] = useState([]);
    const [transferModeLoading, setTransferModeLoading] = useState(false);


    const [openBene, setOpenBene] = useState(false);
    const [beneValue, setBeneValue] = useState(null);
    const [beneList, setBeneList] = useState<BeneficiaryDropdownItem[]>([]);
    const [beneLoading, setBeneLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [merchantProfile, setMerchantProfile] = useState<{ email: string, phone: string } | null>(null);


    useEffect(() => {
        fetchBeneficiaries();
        fetchPaymentMethods();
        fetchMerchantProfile();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            setTransferModeLoading(true);

            const location = await getLatLong();
            const token = await SecureStore.getItemAsync("userToken");

            if (!location || !token) {
                console.error("Location or Token missing");
                return;
            }

            const res = await getPaymentMethodsApi({

                latitude: location.latitude,
                longitude: location.longitude,
                token,
            });

            if (res.success && res.data?.items) {
                const mappedMethods = res.data.items.map((item: any) => ({
                    label: item.value,
                    value: item.value,
                    selectable: !item.is_locked,
                    containerStyle: item.is_locked ? { opacity: 0.4, backgroundColor: '#f5f5f5' } : {},
                    labelStyle: item.is_locked ? { color: '#999' } : {},
                }));
                setTransferMode(mappedMethods);
            }
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Failed to load payment methods",
                text2: err.message || "Please check your connection",
            });
        } finally {
            setTransferModeLoading(false);
        }
    };
    const fetchBeneficiaries = async () => {
        try {
            setBeneLoading(true);
            const location = await getLatLong();
            const token = await SecureStore.getItemAsync("userToken");

            if (!location || !token) {
                console.error("Location or Token missing");
                return;
            }

            const res = await getActiveRecipientsApi({
                latitude: location.latitude,
                longitude: location.longitude,
                token,
            });

            if (res.success && res.data) {
                const mapped = res.data.map((item: BeneficiaryData) => ({
                    label: `${item.account_holder_name} (${item.account_number})`,
                    value: item.id.toString(),
                    rawData: item // Storing the full object here
                }));
                setBeneList(mapped);
            }
        } catch (err: any) {
            console.error("Failed to load beneficiaries", err);
        } finally {
            setBeneLoading(false);
        }
    };

    const handleBeneSelect = (callback: any) => {
        const value = typeof callback === 'function' ? callback(beneValue) : callback;
        setBeneValue(value);

        // TypeScript now knows 'b' has a 'value' property
        const selected = beneList.find((b) => b.value === value);

        if (selected && selected.rawData) {
            const data = selected.rawData;
            setAccountHolderName(data.account_holder_name);
            setBankName(data.bank_name);
            setAccountNumber(data.account_number);
            setIFSCCode(data.ifsc_code);
        }
    };

    const handleReset = () => {
        // 1. Reset the Dropdown Selection Value
        setBeneValue(null);

        // 2. Reset the Search/Display state
        setBeneficiary("");

        // 3. Reset all Auto-filled states
        setAccountHolderName("");
        setBankName("");
        setAccountNumber("");
        setIFSCCode("");

        // 4. Reset User-entry states
        setRemark("");
        setTransferAmount("");
        setTransferModeValue("All");

        
    };

   const handleTransfer = async () => {
    // 1️⃣ Frontend Validation (Match Backend Rules)
    if (!transferAmount || Number(transferAmount) < 100) {
        Toast.show({
            type: 'error',
            text1: 'Validation Error',
            text2: 'Amount must be at least ₹100',
        });
        return;
    }

    if (!beneValue || !transferModeValue || transferModeValue === "All") {
        Toast.show({
            type: 'error',
            text1: 'Input Error',
            text2: 'Please select Transfer Mode and Beneficiary',
        });
        return;
    }

    if (!remark || remark.trim().length < 3) {
        Toast.show({
            type: 'error',
            text1: 'Validation Error',
            text2: 'Remarks must be at least 3 characters',
        });
        return;
    }

    if (!merchantProfile) {
        Toast.show({
            type: 'error',
            text1: 'Profile Error',
            text2: 'Merchant profile not loaded yet',
        });
        return;
    }

    try {
        setIsSubmitting(true);

        // 2️⃣ Location & Auth
        const location = await getLatLong();
        const token = await SecureStore.getItemAsync("userToken");

        if (!location || !token) {
            Toast.show({
                type: 'error',
                text1: 'Auth Error',
                text2: 'Session expired or location unavailable',
            });
            return;
        }

        // 3️⃣ Payload (Exact Postman Mapping)
        const payload = {
            amount: Number(transferAmount),
            transferMode: transferModeValue,
            bankName: bankName,
            bankAccount: String(accountNumber),
            ifsc: IFSCCode.trim().toUpperCase(),
            phone: String(merchantProfile.phone),
            name: accountHolderName,
            email: merchantProfile.email,
            remarks: remark.trim(),
            recipient_id: String(beneValue),
        };

        // 4️⃣ API Call
        const res = await doPayoutTransferApi({
            token,
            latitude: location.latitude.toString(),
            longitude: location.longitude.toString(),
            payload,
        });

        // 5️⃣ Success / Error Handling
        if (res?.success) {
            Toast.show({
                type: 'success',
                text1: 'Transfer Successful',
                text2: res.message || 'Amount transferred successfully',
            });
            handleReset();
        } else {
            const errorMessage = res?.errors
                ? Object.values(res.errors).flat().join(', ')
                : res?.message || 'Transfer failed';

            Toast.show({
                type: 'error',
                text1: 'Transfer Failed',
                text2: errorMessage,
            });
        }
    } catch (error: any) {
        Toast.show({
            type: 'error',
            text1: 'System Error',
            text2: error?.message || 'Something went wrong',
        });
    } finally {
        setIsSubmitting(false);
    }
};

    const fetchMerchantProfile = async () => {
        try {
            const location = await getLatLong();
            const token = await SecureStore.getItemAsync("userToken");
            if (!location || !token) return;

            const res = await getProfileApi({

                latitude: location.latitude.toString(),
                longitude: location.longitude.toString(),
                token,
            });

            if (res.success && res.data?.user) {
                setMerchantProfile({
                    email: res.data.user.email,
                    phone: res.data.user.phone
                });
            }
        } catch (err) {
            console.error("Profile fetch error:", err);
        }
    };

    useEffect(() => {
        fetchBeneficiaries();
        fetchPaymentMethods();
        fetchMerchantProfile(); // Added this
    }, []);
    return (
        <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: "600" }}>{heading ? heading : "Send Payout Amount"}</Text>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
            >
                <ScrollView style={{ marginTop: 16 }} showsVerticalScrollIndicator={false} >
                    <View style={{ zIndex: 5000 }}>
                        <CustomDropdown
                            label="Select Beneficiary"
                            placeholder="Search or Select Beneficiary"
                            open={openBene}
                            value={beneValue}
                            items={beneList}
                            setOpen={setOpenBene}
                            setValue={handleBeneSelect} // This handles the auto-fill
                            loading={beneLoading}
                            searchable={true}
                            zIndex={5000}
                        />
                    </View>
                    <CustomInput
                        label="Account Holder Name"
                        placeholder="Account Holder Name"
                        value={accountHolderName}
                        onChangeText={setAccountHolderName}
                        editable={false}
                    />
                    <CustomInput
                        label="Bank Name"
                        placeholder="Bank Name"
                        value={bankName}
                        onChangeText={setBankName}
                        editable={false}
                    />
                    <CustomInput
                        label="Account Number"
                        placeholder="Account Number"
                        value={accountNumber}
                        onChangeText={setAccountNumber}
                        editable={false}
                    />
                    <CustomInput
                        label="IFSC Code"
                        placeholder="IFSC Code"
                        value={IFSCCode}
                        onChangeText={setIFSCCode}
                        editable={false}
                    />
                    <CustomInput
                        label="Remarks"
                        placeholder="Remarks"
                        value={remark}
                        onChangeText={setRemark}
                    />
                    <CustomInput
                        label="Enter Transfer Amount"
                        placeholder="Enter Transfer Amount"
                        value={transferAmount}
                        onChangeText={setTransferAmount}
                        keyboardType='decimal-pad'
                    />
                    <CustomDropdown
                        label="Status"
                        open={openTransferMode}
                        value={transferModeValue}
                        items={transferMode}
                        setOpen={setOpenTransferMode}
                        setValue={setTransferModeValue}
                        placeholder="Select Transfer Mode"
                        zIndex={3000}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
                        {/* Reset Button */}
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: "rgba(0,0,0,0.1)", // Consistent with your inputs
                                borderRadius: 14,                // Consistent 14px radius
                                height: 55,                      // Consistent height
                                backgroundColor: '#FFF',
                                gap: 8
                            }}
                            activeOpacity={0.7}
                            onPress={handleReset}
                        >
                            <RotateCcw size={18} color={theme.colors.text.secondary} />
                            <Text style={{
                                color: theme.colors.text.secondary,
                                fontWeight: '600',
                                fontSize: 15
                            }}>
                                Reset
                            </Text>
                        </TouchableOpacity>

                        {/* Do Payout Button */}

                        <TouchableOpacity
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                // Darken or lighten the button when loading
                                backgroundColor: isSubmitting ? theme.colors.primary[300] : theme.colors.primary[500],
                                borderRadius: 14,
                                height: 55,
                                gap: 8,
                                elevation: isSubmitting ? 0 : 2, // Remove shadow when pressed/loading
                            }}
                            activeOpacity={0.8}
                            onPress={handleTransfer}
                            disabled={isSubmitting} // Disable clicks while loading
                        >
                            {isSubmitting ? (
                                // Show only the loader or loader + text
                                <>
                                    <ActivityIndicator size="small" color="#FFF" />
                                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>
                                        Processing...
                                    </Text>
                                </>
                            ) : (
                                // Show normal text when not loading
                                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>
                                    Do Payout
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    <View style={{ height: 130 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    )
}

export default RequestPayout