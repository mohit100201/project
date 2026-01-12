import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { secureStorage } from "@/services/secureStorage";
import { useAuth } from "@/context/AuthContext";
import SplashScreen from "@/app/splash";

export default function Index() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [hasOpened, setHasOpened] = useState<boolean | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const opened = await secureStorage.getHasOpened();
        setHasOpened(!!opened);
      } catch (e) {
        setHasOpened(false);
      } finally {
        setIsCheckingOnboarding(false);
      }
    }
    checkStatus();
  }, []);

  // Show the splash screen first
  if (showSplash) {
    return (
      <SplashScreen 
        onComplete={() => setShowSplash(false)} 
      />
    );
  }

  // Wait for both Auth and Onboarding checks to finish
  if (isCheckingOnboarding || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // // NAVIGATION LOGIC
  // if (hasOpened === false) {
  //   return <Redirect href="/(auth)/login" />;
  // }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}