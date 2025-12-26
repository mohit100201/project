import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/theme';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

/**
 * Same LIGHT GRAY PALETTE used in ServiceCardSkeleton
 */
const LIGHT_GRAY_SHIMMER = [
  '#EBEBEB', // Base light gray
  '#F5F5F5', // Highlight
  '#EBEBEB', // Base light gray
];

export const TransactionSkeleton = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6].map((key) => (
        <View key={key} style={styles.card}>
          <View style={styles.cardRow}>
            {/* Circular Icon Shimmer */}
            <ShimmerPlaceholder 
              style={styles.iconCircle} 
              shimmerColors={LIGHT_GRAY_SHIMMER}
            />

            <View style={styles.details}>
              {/* Transaction ID Line */}
              <ShimmerPlaceholder 
                style={styles.txnIdLine} 
                shimmerColors={LIGHT_GRAY_SHIMMER}
              />
              {/* Date Line */}
              <ShimmerPlaceholder 
                style={styles.dateLine} 
                shimmerColors={LIGHT_GRAY_SHIMMER}
              />
              {/* Status Badge Shimmer */}
              <ShimmerPlaceholder 
                style={styles.statusBadge} 
                shimmerColors={LIGHT_GRAY_SHIMMER}
              />
            </View>

            {/* Amount Shimmer */}
            <ShimmerPlaceholder 
              style={styles.amountLine} 
              shimmerColors={LIGHT_GRAY_SHIMMER}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  card: {
    height: 100, 
    backgroundColor: theme.colors.background.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'center',
    // Border matches the subtle light gray theme
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  details: {
    flex: 1,
    gap: 8,
  },
  txnIdLine: {
    width: '65%',
    height: 14,
    borderRadius: 4,
  },
  dateLine: {
    width: '40%',
    height: 10,
    borderRadius: 4,
  },
  statusBadge: {
    width: 70,
    height: 18,
    borderRadius: 10,
    marginTop: 4,
  },
  amountLine: {
    width: 65,
    height: 20,
    borderRadius: 4,
  },
});