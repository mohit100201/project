import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Toast from 'react-native-toast-message';
import { AuthProvider } from "@/context/AuthContext";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { BrandingProvider } from '@/context/BrandingContext';

// This helps the APK know where to start
export const unstable_settings = {
  initialRouteName: "index",
};

// MUST BE DEFAULT EXPORT
export default function RootLayout() {
  useFrameworkReady();

  return (
    <BrandingProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* We define the screens here, but index.tsx handles the logic */}
          <Stack.Screen name="index" /> 
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
        <Toast /> 
      </AuthProvider>
    </BrandingProvider>
  );
}