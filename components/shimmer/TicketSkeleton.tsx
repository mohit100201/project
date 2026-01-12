import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/theme';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

/**
 * Consistent LIGHT GRAY PALETTE
 */
const LIGHT_GRAY_SHIMMER = [
  '#EBEBEB', // Base light gray
  '#F5F5F5', // Highlight
  '#EBEBEB', // Base light gray
];

const TicketSkeleton = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4].map((key) => (
        <View key={key} style={styles.ticketCard}>
          
          {/* Header Row: ID Badge & Status Badge */}
          <View style={styles.cardHeader}>
            <ShimmerPlaceholder 
                style={styles.idBadgeShimmer} 
                shimmerColors={LIGHT_GRAY_SHIMMER} 
            />
            <ShimmerPlaceholder 
                style={styles.statusBadgeShimmer} 
                shimmerColors={LIGHT_GRAY_SHIMMER} 
            />
          </View>

          {/* Subject Shimmer */}
          <ShimmerPlaceholder 
            style={styles.subjectShimmer} 
            shimmerColors={LIGHT_GRAY_SHIMMER} 
          />

          {/* Description Shimmer (Two Lines) */}
          <View style={styles.descContainer}>
            <ShimmerPlaceholder 
                style={styles.descLineLong} 
                shimmerColors={LIGHT_GRAY_SHIMMER} 
            />
            <ShimmerPlaceholder 
                style={styles.descLineShort} 
                shimmerColors={LIGHT_GRAY_SHIMMER} 
            />
          </View>

          <View style={styles.divider} />

          {/* Footer Row: Priority & Date */}
          <View style={styles.cardFooter}>
            <ShimmerPlaceholder 
                style={styles.footerItemShimmer} 
                shimmerColors={LIGHT_GRAY_SHIMMER} 
            />
            <ShimmerPlaceholder 
                style={styles.footerItemShimmer} 
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
    padding: 16,
  },
  ticketCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  idBadgeShimmer: {
    width: 50,
    height: 20,
    borderRadius: 6,
  },
  statusBadgeShimmer: {
    width: 70,
    height: 22,
    borderRadius: 8,
  },
  subjectShimmer: {
    width: '85%',
    height: 18,
    borderRadius: 4,
    marginBottom: 10,
  },
  descContainer: {
    gap: 6,
    marginBottom: 12,
  },
  descLineLong: {
    width: '100%',
    height: 12,
    borderRadius: 4,
  },
  descLineShort: {
    width: '60%',
    height: 12,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItemShimmer: {
    width: 90,
    height: 14,
    borderRadius: 4,
  },
});

export default TicketSkeleton;