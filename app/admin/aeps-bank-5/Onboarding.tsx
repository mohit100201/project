import { paysprintOnboard } from "@/api/paysprint.api";
import { AnimatedButton } from "@/components/animated/AnimatedButton";
import { AnimatedCard } from "@/components/animated/AnimatedCard"
import CustomDatePicker from "@/components/ui/CustomDatePicker";
import CustomInput from "@/components/ui/CustomInput";
import { theme } from "@/theme"
import { getLatLong } from "@/utils/location";
import { Fingerprint, Mail, Smartphone } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native"
import * as SecureStore from "expo-secure-store";

import { NativeModules } from 'react-native';
import Toast from "react-native-toast-message";
import SdkResultModal from "./mini-statement/SdkResultModal";

const { PaysprintModule } = NativeModules;

type PaysprintForm = {
    pId: string;
    pApiKey: string;
    mCode: string;
    mobile: string;
    pipe: string;
    firm: string;
    email: string;
    aadhaar: string;
    dob: string;
};

type OnboardingScreenProps = {
    merchantCode: string;
    fetchStatus: () => void;


}

const OnboardingScreen = (props: OnboardingScreenProps) => {

    const [loading, setLoading] = useState(false)
    const [lat, setLat] = useState("")
    const [lng, setLng] = useState("")
    const [errors, setErrors] = useState<{
        mobile?: string;
        email?: string;
        aadhaar?: string;
        dob?: string;
    }>({});


    const validate = () => {
        const newErrors: typeof errors = {};

        // Mobile validation
        if (!form.mobile.trim()) {
            newErrors.mobile = "Mobile number is required";
        } else if (!/^[6-9]\d{9}$/.test(form.mobile)) {
            newErrors.mobile = "Enter a valid 10-digit mobile number";
        }

        // Email validation
        if (!form.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Enter a valid email address";
        }

        // Aadhaar validation
        if (!form.aadhaar.trim()) {
            newErrors.aadhaar = "Aadhaar number is required";
        } else if (!/^[2-9]{1}[0-9]{11}$/.test(form.aadhaar)) {
            newErrors.aadhaar = "Enter a valid 12-digit Aadhaar number";
        }

        // DOB validation
        if (!form.dob) {
            newErrors.dob = "Date of birth is required";
        } else {
            const dobDate = new Date(form.dob);
            const today = new Date();

            let age = today.getFullYear() - dobDate.getFullYear();
            const monthDiff = today.getMonth() - dobDate.getMonth();

            if (
                monthDiff < 0 ||
                (monthDiff === 0 && today.getDate() < dobDate.getDate())
            ) {
                age--;
            }

            if (age < 18) {
                newErrors.dob = "You must be at least 18 years old";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const [form, setForm] = useState<PaysprintForm>({
        pId: '',
        pApiKey: '',
        mCode: "",
        mobile: '',
        pipe: 'bank5',
        firm: '',
        email: '',
        aadhaar: "",
        dob: ""
    });

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);

        try {
            const location = await getLatLong();

            if (!location) {
                Toast.show({
                    type: "error",
                    text1: "Location Required",
                    text2: "Please enable location permission to continue",
                });
                return;
            }

            const token = await SecureStore.getItemAsync("userToken");
            if (!token) {
                throw new Error("User not authenticated");
            }

            // 🔹 Call API
            const response: any = await paysprintOnboard({
                token,
                latitude: location.latitude,
                longitude: location.longitude,
                mobile: form.mobile,
                aadhaar: form.aadhaar,
                email: form.email,
                dob: form.dob,
                callback: "https://app.pinepe.in/",
            });

            // 🔹 Extract values ONCE
            const partnerId = response.credentials.partner_id;
            const apiKey = response.credentials.jwt_secret;
            const firm = response.credentials.firm;
            const merchantCode = response.response.merchantcode;

            // 🔹 Update state (UI purpose only)
            setForm(prev => ({
                ...prev,
                pId: partnerId,
                pApiKey: apiKey,
                firm: firm,
                mCode: merchantCode,
            }));

            setLat(String(location.latitude));
            setLng(String(location.longitude));

            // 🔹 CALL SDK WITH REAL VALUES (NOT STATE)
            const sdkResult = await PaysprintModule.startPaysprint(
                partnerId,
                apiKey,
                merchantCode,
                form.mobile,
                String(location.latitude),
                String(location.longitude),
                form.pipe,
                firm,
                form.email
            );

            props.fetchStatus();

            let parsedResult: any;

            if (typeof sdkResult === "string") {
                parsedResult = JSON.parse(sdkResult);
            } else {
                parsedResult = sdkResult;
            }

         if(parsedResult.status){
            Toast.show({
                type:'success',
                text1:"Sdk success result",
                text2:parsedResult.message
            })
         }
         else{
             Toast.show({
                type:"error",
                text1:"Sdk failure result",
                text2:parsedResult.message
            })

         }




            console.log("sdk result", sdkResult);

        } catch (err) {
            console.error(err);
            Toast.show({
                type: "error",
                text1: "Onboarding Failed",
                text2: "Please try again",
            });
        } finally {
            setLoading(false);
        }
    };

    const update = (key: keyof PaysprintForm, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    return (
        <View style={{ flex: 1, marginHorizontal: 16 }}>
            <Text style={{ fontSize: theme.typography.fontSizes["xl"], fontWeight: theme.typography.fontWeights.medium, alignSelf: 'center', marginTop: 16 }}>Merchant Onboarding</Text>

            <View style={{ marginTop: 16, }}>
                <AnimatedCard>
                    <View>
                        <CustomInput
                            label="Mobile Number"
                            placeholder="Enter your number"
                            value={form.mobile}
                            maxLength={10}
                            error={errors.mobile}
                            keyboardType='number-pad'
                            onChangeText={(text: string) => {
                                update("mobile", text);
                                if (errors.mobile) {
                                    setErrors(prev => ({ ...prev, mobile: undefined }));
                                }
                            }}
                            iconStart={Smartphone}
                        />

                        <CustomInput
                            label="Email"
                            placeholder="Enter your email"
                            value={form.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                            onChangeText={(text: string) => {
                                update("email", text);
                                if (errors.email) {
                                    setErrors(prev => ({ ...prev, email: undefined }));
                                }
                            }}
                            iconStart={Mail}
                        />
                        <CustomInput
                            label="Aadhaar Number"
                            placeholder="Enter aadhhar number"
                            value={form.aadhaar}
                            keyboardType="number-pad"
                            error={errors.aadhaar}
                            maxLength={12}
                            onChangeText={(text: string) => {
                                update("aadhaar", text);
                                if (errors.aadhaar) {
                                    setErrors(prev => ({ ...prev, aadhaar: undefined }));
                                }
                            }}
                            iconStart={Fingerprint}
                        />

                        <CustomDatePicker
                            label="Date of Birth"
                            dateValue={form.dob}
                            error={errors.dob}
                            onDateChange={(formattedDate) => {
                                if (formattedDate && formattedDate.includes("-")) {
                                    const [day, month, year] = formattedDate.split("-");
                                    update("dob", `${year}-${month}-${day}`);
                                } else {
                                    update("dob", formattedDate);
                                }

                                if (errors.dob) {
                                    setErrors(prev => ({ ...prev, dob: undefined }));
                                }
                            }}
                        />

                        <AnimatedButton
                            title="Submit"
                            onPress={handleSubmit}
                            variant="primary"
                            size="large"
                            loading={loading}
                            style={{ marginTop: 16 }}
                        />
                    </View>
                </AnimatedCard>
            </View>
        </View>
    )
}

export default OnboardingScreen