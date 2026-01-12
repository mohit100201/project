import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const LIGHT_GRAY_SHIMMER = ['#EBEBEB', '#F5F5F5', '#EBEBEB'];

export const PlansSkeleton = () => {
  return (
    <View style={styles.planCard}>
      {/* cardHeader was likely a <div>, now a <View> */}
      <View style={styles.cardHeader}>
        <ShimmerPlaceholder style={styles.nameShimmer} shimmerColors={LIGHT_GRAY_SHIMMER} />
        <ShimmerPlaceholder style={styles.badgeShimmer} shimmerColors={LIGHT_GRAY_SHIMMER} />
      </View>

      <ShimmerPlaceholder style={styles.priceShimmer} shimmerColors={LIGHT_GRAY_SHIMMER} />
      <ShimmerPlaceholder style={styles.descShimmer} shimmerColors={LIGHT_GRAY_SHIMMER} />

      <View style={styles.divider} />

      <View style={styles.featuresContainer}>
        {[1, 2, 3, 4].map((f) => (
          <View key={f} style={styles.featureRow}>
            <ShimmerPlaceholder style={styles.featureIcon} shimmerColors={LIGHT_GRAY_SHIMMER} />
            <ShimmerPlaceholder style={styles.featureLine} shimmerColors={LIGHT_GRAY_SHIMMER} />
          </View>
        ))}
      </View>

      <ShimmerPlaceholder style={styles.buttonShimmer} shimmerColors={LIGHT_GRAY_SHIMMER} />
    </View>
  );
};

const styles = StyleSheet.create({
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameShimmer: { width: '50%', height: 24, borderRadius: 6 },
  badgeShimmer: { width: 60, height: 18, borderRadius: 6 },
  priceShimmer: { width: '40%', height: 35, borderRadius: 6, marginBottom: 8 },
  descShimmer: { width: '30%', height: 14, borderRadius: 4, marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginBottom: 16 },
  featuresContainer: { marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureIcon: { width: 18, height: 18, borderRadius: 9, marginRight: 10 },
  featureLine: { flex: 1, height: 12, borderRadius: 4 },
  buttonShimmer: { width: '100%', height: 48, borderRadius: 10 },
});