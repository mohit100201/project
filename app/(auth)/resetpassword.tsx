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
import { theme } from '@/theme';
import { AnimatedInput } from '@/components/animated/AnimatedInput';
import { AnimatedButton } from '@/components/animated/AnimatedButton';
import Constants from 'expo-constants';
import { BrandedLogo } from '@/components/ui/BrandLogo';
import { resetPasswordApi } from '@/api/auth.api';
import { getLatLong } from '@/utils/location';
import Toast from 'react-native-toast-message';

// Get window height for full-screen centering
const { height: WINDOW_HEIGHT } = Dimensions.get('window');

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { login, otp } = useLocalSearchParams<{ login: string; otp: string }>();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const tenantData = Constants.expoConfig?.extra?.tenantData;
    const domainName = tenantData?.domain || "laxmeepay.com";

    const handleResetPassword = async () => {
        setError('');
        if (!password || !confirmPassword) {
            setError('Please fill all fields');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

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

        setLoading(true);
        try {
            const payload = {
                login: login,
                otp: otp,
                new_password: password,
                new_password_confirmation: confirmPassword,
            }
            const response = await resetPasswordApi(payload, {

                latitude: location.latitude,
                longitude: location.longitude,
            })



            if (response.success) {
                router.replace('/(auth)/login');
            } else {
                setError(response.message || 'Reset failed. Please try again.');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
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
                    {/* Logo Section */}
                    <View style={styles.logoContainer}>
                        <BrandedLogo size={120} />
                    </View>

                    {/* Header Section */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Set New Password</Text>
                        <Text style={styles.subtitle}>
                            Create a strong, unique password for your account.
                        </Text>
                    </View>

                    {/* Card Section */}
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

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>Error:</Text>
                                <Text style={styles.errorMessage}>{error}</Text>
                            </View>
                        ) : null}

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
        flexGrow: 1, // Allows content to fill space
        justifyContent: 'center', // Centers content vertically
        paddingHorizontal: theme.spacing[6],
        paddingBottom: theme.spacing[8],
        // Ensures the scrollview background covers the full screen
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
        width: '100%', // Ensure card stays full width within padding
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
    errorContainer: {
        backgroundColor: '#FFF5F5',
        padding: 10,
        borderRadius: 8,
        marginBottom: theme.spacing[4],
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.error[500],
    },
    errorText: {
        fontSize: theme.typography.fontSizes.xs,
        fontWeight: 'bold',
        color: theme.colors.error[500],
        textTransform: 'uppercase',
    },
    errorMessage: {
        fontSize: theme.typography.fontSizes.sm,
        color: theme.colors.text.secondary,
    },
    resetButton: {
        marginTop: theme.spacing[2],
    },
});