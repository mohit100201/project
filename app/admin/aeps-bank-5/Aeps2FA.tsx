import { AnimatedButton } from "@/components/animated/AnimatedButton";
import { AnimatedCard } from "@/components/animated/AnimatedCard";
import { BiometricScanner } from "@/components/ui/BiometricScanner";
import { useEffect, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { getLatLong } from "@/utils/location";
import { paysprin2FA } from "@/api/paysprint.api";
import { theme } from "@/theme";

type Aeps2FAProps = {
    fetchStatus: () => void;
    bank?: string; // Optional bank parameter, defaults to "bank5"
}

const Aeps2FA = (props: Aeps2FAProps) => {
    const WADH = "E0jzJ/P8UopUHAieZn8CKqS4WPMi5ZSYXgfnlfkWjrc=";
    const [pidData, setPidData] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [ipAddress, setIpAddress] = useState<string>("");

    // Fetch IP address on component mount
    useEffect(() => {
        fetch("https://api.ipify.org?format=json")
            .then(res => res.json())
            .then(data => setIpAddress(data.ip))
            .catch(() => {
                setIpAddress("192.168.1.1"); // Fallback IP
                console.error("IP fetch failed");
            });
    }, []);

    const handleSubmit = async () => {
        if (!pidData) {
            Toast.show({
                type: "error",
                text1: "Biometric Required",
                text2: "Please scan your fingerprint first",
            });
            return;
        }

        setLoading(true);

        try {
            // Get location
            const location = await getLatLong();
            if (!location) {
                Toast.show({
                    type: "error",
                    text1: "Location Required",
                    text2: "Please enable location permission",
                });
                setLoading(false);
                return;
            }

            // Get token
            const token = await SecureStore.getItemAsync("userToken");
            if (!token) {
                throw new Error("User not authenticated");
            }

            // Prepare payload
            const payload = {
                token: token,
                latitude: location.latitude,
                longitude: location.longitude,
                bank: props.bank || "bank5",
                accessmodetype: "APP",
                piddata: pidData,
                ipaddress: ipAddress,
            };

            // Call 2FA API
            const response = await paysprin2FA(payload);

            if (response?.success) {
                Toast.show({
                    type: "success",
                    text1: "Authentication Successful",
                    text2: response.message || "Biometric verified successfully",
                });
                
                // Call fetchStatus to refresh parent component
                props.fetchStatus();
                
                // Reset biometric scanner
                setPidData(null);
            } else {
                throw new Error(response?.message || "Authentication failed");
            }
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Authentication Failed",
                text2: err.message || "Network Error",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                AEPS Two-Factor Authentication
            </Text>

            <AnimatedCard style={styles.card}>
                <BiometricScanner
                   wadh=""
                    onScanSuccess={(data) => {
                        setPidData(data);
                        Toast.show({
                            type: "success",
                            text1: "Biometric Captured",
                            text2: "Fingerprint scanned successfully",
                        });
                    }}
                    onScanError={(err) =>
                        Toast.show({ type: "error", text1: "Scan Error", text2: err })
                    }
                />

                <AnimatedButton
                    title="Verify Biometric"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={!pidData || loading}
                    style={styles.button}
                    variant="primary"
                    size="large"
                />

                {!pidData && !loading && (
                    <Text style={styles.hint}>
                        Please scan your fingerprint to continue
                    </Text>
                )}
            </AnimatedCard>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: theme.colors.background.light,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        color: theme.colors.text.primary,
        marginVertical: 16,
    },
    card: {
        marginTop: 16,
    },
    button: {
        marginTop: 20,
    },
    hint: {
        textAlign: "center",
        color: theme.colors.text.secondary,
        fontSize: 12,
        marginTop: 8,
    },
});

export default Aeps2FA;