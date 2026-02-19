import { paysprintEkyc } from "@/api/paysprint.api";
import { AnimatedButton } from "@/components/animated/AnimatedButton";
import { AnimatedCard } from "@/components/animated/AnimatedCard"
import { BiometricScanner } from "@/components/ui/BiometricScanner";
import CustomInput from "@/components/ui/CustomInput";
import { theme } from "@/theme"
import { useState } from "react";
import { Text, View } from "react-native"
import * as SecureStore from "expo-secure-store";
import { getLatLong } from "@/utils/location";
import Toast from "react-native-toast-message";
import CustomDropdownPicker2 from "@/components/ui/AppDropdown";
import { natureOfBusinessItems } from "@/utils/paysprintData";


type EkycProps = {
    fetchStatus: () => void;

}

const Ekyc = (props: EkycProps) => {
    const [annualIncome, setAnnualIncome] = useState("");
    const [businessNature, setBusinessNature] = useState("");
    const [errors, setErrors] = useState<{
        annualIncome?: string;
        businessNature?: string;
        biometricData?: string;
    }>({});
    const [loading, setLoading] = useState(false)
    const [biometricData, setBiometricData] = useState<string | null>(null);

    const validate = () => {

        const newErrors: typeof errors = {};

        // Annual Income validation
        if (!annualIncome.trim()) {
            newErrors.annualIncome = "Annual income is required";
        } else if (isNaN(Number(annualIncome))) {
            newErrors.annualIncome = "Annual income must be a number";
        } else if (Number(annualIncome) <= 0) {
            newErrors.annualIncome = "Annual income must be greater than 0";
        }

        // Business Nature validation
        if (!businessNature.trim()) {
            newErrors.businessNature = "Nature of business is required";
        } else if (businessNature.trim().length < 3) {
            newErrors.businessNature = "Enter a valid business nature";
        }

        if (!biometricData?.trim()) {
            newErrors.biometricData = "Biometric Data is required"
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };



    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);

        try {
            // 📍 Get location
            const location = await getLatLong();


            if (!location) {
                Toast.show({
                    type: "error",
                    text1: "Location Required",
                    text2: "Please enable location permission to continue",
                });
                setLoading(false);
                return;
            }


            const token = await SecureStore.getItemAsync("userToken");

            if (!token) {
                throw new Error("User not authenticated");
            }

            if (!biometricData) {
                throw new Error("Biometric data missing");
            }

            console.log("businessNature",businessNature)

            const response = await paysprintEkyc(

                {
                    token: token,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    bank: "bank5",
                    piddata: biometricData,
                    annual_income: annualIncome,
                    nature_of_bussiness: businessNature,
                    accessmode:"APP"

                }
            );

            if (
                response?.success === true &&
                response?.code === 2 &&
                response?.data?.status === true
            ) {
                Toast.show({
                    type: "success",
                    text1: "eKYC Completed",
                    text2: response.message || "eKYC completed successfully",
                });


                props.fetchStatus();

            } else {
                Toast.show({
                    type: "error",
                    text1: "eKYC Failed",
                    text2:
                        response?.data?.message ||
                        response?.message ||
                        "eKYC failed",
                });


            }

        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Status Not Fetched",
                text2: err.message || "Network Error",
            });
        } finally {
            setLoading(false);
        }
    };




    return (
        <View style={{ flex: 1, marginHorizontal: 16 }}>
            <Text style={{ fontSize: theme.typography.fontSizes["xl"], fontWeight: theme.typography.fontWeights.medium, alignSelf: 'center', marginTop: 16 }}>Biometric eKYC Verification</Text>

            <View style={{ marginTop: 16, }}>
                <AnimatedCard>
                    <View>
                        <CustomInput
                            label="Annual Income (₹)"
                            placeholder="Enter your annual income"
                            value={annualIncome}
                            maxLength={10}
                            error={errors.annualIncome}
                            keyboardType='number-pad'
                            onChangeText={(text: string) => {
                                setAnnualIncome(text)

                                if (errors.annualIncome) {
                                    console.log("err", errors.annualIncome)
                                    setErrors(prev => ({ ...prev, annualIncome: undefined }));
                                }
                            }}
                        />

                        <CustomDropdownPicker2
                            label="Nature of Business"
                            placeholder="Select business type"
                            items={natureOfBusinessItems}
                            value={businessNature}
                            onValueChange={(val) => {
                                setBusinessNature(val);
                                if (errors.businessNature) setErrors(prev => ({ ...prev, businessNature: undefined }));
                            }}
                            error={errors.businessNature}
                            zIndex={3000}
                            zIndexInverse={1000}
                            listMode="MODAL"
                        />

                        <BiometricScanner
                            wadh="E0jzJ/P8UopUHAieZn8CKqS4WPMi5ZSYXgfnlfkWjrc="
                            onScanSuccess={(data) => setBiometricData(data)}
                            onScanError={() => setBiometricData(null)}
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

export default Ekyc