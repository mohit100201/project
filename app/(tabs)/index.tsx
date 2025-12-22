import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Wallet, ArrowUpRight, ArrowDownLeft, Zap, CreditCard } from 'lucide-react-native';
import { theme } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { AnimatedCard } from '@/components/animated/AnimatedCard';

const mockServices = [
  { id: '1', name: 'Mobile Recharge', price: 10 },
  { id: '2', name: 'DTH Recharge', price: 15 },
  { id: '3', name: 'Electricity Bill', price: 50 },
  { id: '4', name: 'Water Bill', price: 30 },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const balance = 2540.50;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.primary[700]]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          </View>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitial}>
              {user?.full_name?.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        <AnimatedCard style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIconContainer}>
              <Wallet size={20} color={theme.colors.primary[500]} />
            </View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>

          <View style={styles.actions}>
            <Pressable style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.success[50] }]}>
                <ArrowDownLeft size={20} color={theme.colors.success[500]} />
              </View>
              <Text style={styles.actionText}>Receive</Text>
            </Pressable>

            <Pressable style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.error[50] }]}>
                <ArrowUpRight size={20} color={theme.colors.error[500]} />
              </View>
              <Text style={styles.actionText}>Send</Text>
            </Pressable>
          </View>
        </AnimatedCard>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Services</Text>
          <Pressable>
            <Text style={styles.seeAllText}>See All</Text>
          </Pressable>
        </View>

        <View style={styles.servicesGrid}>
          {mockServices.map((service, index) => (
            <AnimatedCard
              key={service.id}
              style={styles.serviceCard}
              delay={index * 100}
            >
              <View style={styles.serviceIconContainer}>
                <Zap size={24} color={theme.colors.primary[500]} />
              </View>
              <Text style={styles.serviceName} numberOfLines={1}>
                {service.name}
              </Text>
              <Text style={styles.servicePrice}>₹{service.price}</Text>
            </AnimatedCard>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Pressable>
            <Text style={styles.seeAllText}>See All</Text>
          </Pressable>
        </View>

        {[1, 2, 3].map((item, index) => (
          <AnimatedCard key={item} style={styles.transactionCard} delay={index * 100}>
            <View style={styles.transactionIconContainer}>
              <CreditCard size={20} color={theme.colors.text.inverse} />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionTitle}>Mobile Recharge</Text>
              <Text style={styles.transactionDate}>Today, 10:30 AM</Text>
            </View>
            <Text style={styles.transactionAmount}>-₹10.00</Text>
          </AnimatedCard>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.dark,
  },
  header: {
    paddingTop: theme.spacing[12],
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[8],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  greeting: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.inverse,
    opacity: 0.9,
  },
  userName: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.inverse,
    marginTop: theme.spacing[1],
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.text.inverse,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary[500],
  },
  balanceCard: {
    backgroundColor: theme.colors.background.light,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  balanceIconContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[2],
  },
  balanceLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  balanceAmount: {
    fontSize: theme.typography.fontSizes['4xl'],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[6],
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing[4],
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  actionText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeights.medium,
  },
  content: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
  },
  seeAllText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary[500],
    fontWeight: theme.typography.fontWeights.semibold,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[4],
    marginBottom: theme.spacing[8],
  },
  serviceCard: {
    width: '47%',
    padding: theme.spacing[4],
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  serviceName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  servicePrice: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  transactionDate: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  transactionAmount: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.error[500],
  },
});
