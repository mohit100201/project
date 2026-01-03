import React, { useState, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { theme } from '@/theme';

export default function AepsWebView() {
  const { url, pipe } = useLocalSearchParams<{ url: string; pipe: string }>();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. MEMOIZE THE URL: Decoding it once to prevent unnecessary re-renders
  const decodedUrl = useMemo(() => {
    if (!url) return '';
    // Double decoding is sometimes necessary if the router encoded it once more
    return decodeURIComponent(decodeURIComponent(url));
  }, [url]);

  if (!url) {
    router.back();
    return null;
  }

  // 2. DESKTOP-LIKE USER AGENT: This tricks the 403 firewall into thinking it's a PC browser
  const customUserAgent = Platform.OS === 'android' 
    ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: pipe ? `${pipe} Gateway` : "Payment Gateway",
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
        }} 
      />

      <WebView
        source={{ 
          uri: decodedUrl,
          headers: {
            // Some gateways require these to allow the connection
            'Upgrade-Insecure-Requests': '1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="always"
        // Force the Desktop User Agent
        userAgent={customUserAgent}
        // Additional settings for Banking security
        incognito={false} 
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
      />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});