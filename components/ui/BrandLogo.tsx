// components/BrandedLogo.tsx
import React from "react";
import { View, Image, StyleSheet, ViewStyle } from "react-native";
import { theme } from "@/theme";
import { useBranding } from '@/context/BrandingContext';

interface BrandedLogoProps {
  size?: number;
  style?: ViewStyle;
}



export const BrandedLogo = ({
  size = 120,
  style,
}: BrandedLogoProps) => {
  const { logoUrl } = useBranding();

  const source = { uri: logoUrl }

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size },
        style,
      ]}
    >
      <Image
        source={source as any}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
