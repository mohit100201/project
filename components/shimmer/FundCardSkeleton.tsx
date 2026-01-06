import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { theme } from "@/theme";

interface FundCardSkeletonProps {
  count?: number;
}

const FundCardSkeleton = ({ count = 3 }: FundCardSkeletonProps) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulse.start();
    return () => pulse.stop();
  }, []);

  const SkeletonItem = () => (
    <Animated.View style={[styles.card, { opacity: pulseAnim }]}>
      {/* Header Skeleton */}
      <View style={styles.cardHeader}>
        <View>
          <View style={[styles.skeletonLine, { width: 100, height: 10, marginBottom: 8 }]} />
          <View style={[styles.skeletonLine, { width: 150, height: 24 }]} />
        </View>
        <View style={[styles.skeletonLine, { width: 80, height: 28, borderRadius: 20 }]} />
      </View>

      <View style={styles.divider} />

      {/* Details Skeleton */}
      <View style={styles.detailsGrid}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.detailRow}>
            <View style={styles.iconCirclePlaceholder} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={[styles.skeletonLine, { width: 60, height: 8 }]} />
              <View style={[styles.skeletonLine, { width: '80%', height: 12 }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Image Placeholder Skeleton */}
      <View style={styles.imagePlaceholder} />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    backgroundColor: theme.colors.background.light,
    padding: theme.layout.cardPadding,
    marginBottom: theme.spacing[4],
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  skeletonLine: {
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCirclePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.neutral[100],
  },
  imagePlaceholder: {
    height: 140,
    borderRadius: 12,
    marginTop: 16,
    backgroundColor: theme.colors.neutral[100],
  },
});

export default FundCardSkeleton;