import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/theme';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

/**
 * LIGHT GRAY PALETTE
 * Use these for a clean, light look.
 */
const LIGHT_GRAY_SHIMMER = [
  '#EBEBEB', // Base light gray
  '#F5F5F5', // Highlight (almost white)
  '#EBEBEB', // Base light gray
];

/**
 * IF YOU ARE IN DARK MODE but want a "Lighter" gray than before:
 * const DARK_MODE_LIGHTER_GRAY = ['#3A3A3A', '#4A4A4A', '#3A3A3A'];
 */

export const ServiceCardSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Category Title Shimmer */}
      <ShimmerPlaceholder 
        style={styles.categoryTitle} 
        shimmerColors={LIGHT_GRAY_SHIMMER} 
      />
      
      {[1, 2, 3].map((key) => (
        <View key={key} style={styles.card}>
          <View style={styles.iconWrapper}>
            <ShimmerPlaceholder 
              style={styles.image} 
              shimmerColors={LIGHT_GRAY_SHIMMER}
            />
          </View>
          
          <View style={styles.info}>
            <ShimmerPlaceholder 
              style={styles.nameLine} 
              shimmerColors={LIGHT_GRAY_SHIMMER}
            />
            <ShimmerPlaceholder 
              style={styles.categoryLine} 
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
    marginBottom: 20,
  },
  categoryTitle: {
    width: 100,
    height: 14,
    borderRadius: 4,
    marginBottom: 15,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.light,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing[3],
    marginBottom: theme.spacing[4],
    // For light mode, adding a very subtle border helps definition
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    marginLeft: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#F9F9F9', // Very light background for the icon box
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 55,
    height: 55,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
    gap: 10,
  },
  nameLine: {
    width: '80%',
    height: 16,
    borderRadius: 4,
  },
  categoryLine: {
    width: '45%',
    height: 12,
    borderRadius: 4,
  },
});