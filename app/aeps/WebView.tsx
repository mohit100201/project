import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '@/theme';

export default function AepsWebView() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  if (!url) {
    router.back();
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: url }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        // Ensures the bridge works for bank forms
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
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
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});