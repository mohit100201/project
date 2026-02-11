import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
    StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import Toast from 'react-native-toast-message'; // 1. Import Toast
import { theme } from '@/theme';
import { AnimatedInput } from '@/components/animated/AnimatedInput';
import { AnimatedButton } from '@/components/animated/AnimatedButton';
import Constants from 'expo-constants';
import { useBranding } from '@/context/BrandingContext';
import { BrandedLogo } from '@/components/ui/BrandLogo';
import { getLatLong } from '@/utils/location';
import { resetPasswordApi } from '../api/auth.api';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { login, otp } = useLocalSearchParams<{ login: string; otp: string }>();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

     


    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            Toast.show({
                type: "error",
                text1: "Required",
                text2: "Please fill all fields",
            });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({
                type: "error",
                text1: "Mismatch",
                text2: "Passwords do not match",
            });
            return;
        }

        setLoading(true);

        try {
            // 📍 Get location
            const location = await getLatLong();

            // ❌ Block if location missing
            if (!location) {
                Toast.show({
                    type: "error",
                    text1: "Location Required",
                    text2: "Please enable location permission to continue",
                });
                return;
            }

            const json = await resetPasswordApi(
                {
                    login,
                    otp,
                    new_password: password,
                    new_password_confirmation: confirmPassword,
                },
                {
                    
                    latitude: location.latitude,
                    longitude: location.longitude,
                }
            );

            Toast.show({
                type: "success",
                text1: "Success",
                text2: "Password reset successfully. Please login.",
            });

            router.replace("/(auth)/login");
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Reset Failed",
                text2: err.message || "Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.logoContainer}>
                        <BrandedLogo size={120} />
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.title}>Set New Password</Text>
                        <Text style={styles.subtitle}>
                            Create a strong, unique password for your account.
                        </Text>
                    </View>

                    <View style={styles.formCard}>
                        <View style={styles.inputWrapper}>
                            <AnimatedInput
                                label="Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <Pressable
                                style={styles.eyeIconContainer}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff size={20} color={theme.colors.text.secondary} />
                                ) : (
                                    <Eye size={20} color={theme.colors.text.secondary} />
                                )}
                            </Pressable>
                        </View>

                        <View style={styles.inputWrapper}>
                            <AnimatedInput
                                label="Confirm Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <Pressable
                                style={styles.eyeIconContainer}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={20} color={theme.colors.text.secondary} />
                                ) : (
                                    <Eye size={20} color={theme.colors.text.secondary} />
                                )}
                            </Pressable>
                        </View>

                        <AnimatedButton
                            title="Reset Password"
                            onPress={handleResetPassword}
                            variant="primary"
                            size="large"
                            loading={loading}
                            style={styles.resetButton}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.light,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[6],
        paddingBottom: theme.spacing[8],
        minHeight: WINDOW_HEIGHT - (StatusBar.currentHeight || 0),
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing[4],
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing[8],
    },
    title: {
        fontSize: theme.typography.fontSizes['3xl'],
        fontWeight: theme.typography.fontWeights.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[2],
        textAlign: 'center',
    },
    subtitle: {
        fontSize: theme.typography.fontSizes.md,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing[6],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        width: '100%',
    },
    inputWrapper: {
        position: 'relative',
        marginBottom: theme.spacing[4],
    },
    eyeIconContainer: {
        position: 'absolute',
        right: 15,
        top: 15,
        justifyContent: 'center',
    },
    resetButton: {
        marginTop: theme.spacing[2],
    },
});