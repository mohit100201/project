import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message'; // 1. Import Toast
import Constants from 'expo-constants';
import { useBranding } from '@/context/BrandingContext';
import { theme } from '@/theme';
import { AnimatedInput } from '@/components/animated/AnimatedInput';
import { AnimatedButton } from '@/components/animated/AnimatedButton';
import { BrandedLogo } from '@/components/ui/BrandLogo';
import { forgotPasswordApi } from '../../api/auth.api';
import { getLatLong } from '@/utils/location';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

   
 

  const handleSubmit = async () => {
    if (!identifier.trim()) {
      Toast.show({
        type: "error",
        text1: "Input Required",
        text2: "Please enter your Email or Username",
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

      const json = await forgotPasswordApi(
        { login: identifier },
        {
          
          latitude: location.latitude,
          longitude: location.longitude,
        }
      );

      Toast.show({
        type: "success",
        text1: "OTP Sent",
        text2: json.message || "Verification code sent successfully.",
      });

      setTimeout(() => {
        router.push({
          pathname: "/(auth)/otp",
          params: {
            otp_sent_to: identifier,
            from: "forgotpassword",
          },
        });
      }, 500);
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "User Not Found",
        text2: err.message || "No account associated with this information.",
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
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandedLogo size={140} style={styles.logo} />

          <View style={styles.header}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              No worries, we'll send you reset instructions.
            </Text>
          </View>

          <View style={styles.form}>
            <AnimatedInput
              label="Email / Username"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />

            <AnimatedButton
              title="Submit"
              onPress={handleSubmit}
              variant="primary"
              size="large"
              loading={loading}
              style={styles.submitButton}
            />

            <Pressable style={styles.backToLogin} onPress={() => router.back()}>
              <Text style={styles.backToLoginText}>Back to log in</Text>
            </Pressable>
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
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: theme.spacing[6],
    width: 40,
    height: 40,
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    marginBottom: theme.spacing[4],
    alignSelf: 'center',
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
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing[4],
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  submitButton: {
    width: '100%',
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[6],
  },
  backToLogin: {
    paddingVertical: theme.spacing[2],
  },
  backToLoginText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
});