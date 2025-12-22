import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Calendar, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react-native';
import { theme } from '@/theme';
import { AnimatedCard } from '@/components/animated/AnimatedCard';

const mockTransactions = [
  {
    id: '1',
    description: 'Mobile Recharge',
    amount: 10.00,
    type: 'purchase',
    status: 'completed' as const,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    description: 'DTH Recharge',
    amount: 15.00,
    type: 'purchase',
    status: 'completed' as const,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    description: 'Electricity Bill',
    amount: 50.00,
    type: 'purchase',
    status: 'pending' as const,
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: '4',
    description: 'Refund',
    amount: 25.00,
    type: 'refund',
    status: 'completed' as const,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function TransactionsScreen() {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const filteredTransactions = filter === 'all'
    ? mockTransactions
    : mockTransactions.filter(t => t.status === filter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.success[500];
      case 'pending':
        return theme.colors.warning[500];
      case 'failed':
        return theme.colors.error[500];
      default:
        return theme.colors.text.secondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Pressable style={styles.filterButton}>
          <Filter size={20} color={theme.colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
        style={{
          marginBottom: 16,
          maxHeight: 40, 
        }}
      >
        <Pressable
          style={{
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: filter === 'all' ? theme.colors.primary[500] : theme.colors.background.light,
            marginRight: 8,
          }}
          onPress={() => setFilter('all')}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: filter === 'all' ? theme.colors.text.inverse : theme.colors.text.secondary,
            }}
          >
            All
          </Text>
        </Pressable>

        <Pressable
          style={{
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: filter === 'completed' ? theme.colors.primary[500] : theme.colors.background.light,
            marginRight: 8,
          }}
          onPress={() => setFilter('completed')}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: filter === 'completed' ? theme.colors.text.inverse : theme.colors.text.secondary,
            }}
          >
            Completed
          </Text>
        </Pressable>

        <Pressable
          style={{
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: filter === 'pending' ? theme.colors.primary[500] : theme.colors.background.light,
          }}
          onPress={() => setFilter('pending')}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: filter === 'pending' ? theme.colors.text.inverse : theme.colors.text.secondary,
            }}
          >
            Pending
          </Text>
        </Pressable>
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptySubtitle}>Your transactions will appear here</Text>
          </View>
        ) : (
          filteredTransactions.map((transaction, index) => (
            <AnimatedCard key={transaction.id} style={styles.transactionCard} delay={index * 50}>
              <View style={styles.transactionHeader}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: transaction.type === 'purchase' ? theme.colors.error[50] : theme.colors.success[50] }
                ]}>
                  {transaction.type === 'purchase' ? (
                    <ArrowUpRight size={20} color={theme.colors.error[500]} />
                  ) : (
                    <ArrowDownLeft size={20} color={theme.colors.success[500]} />
                  )}
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>{transaction.description || 'Transaction'}</Text>
                  <Text style={styles.transactionDate}>{formatDate(transaction.created_at)}</Text>
                </View>
              </View>

              <View style={styles.transactionFooter}>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'purchase' ? theme.colors.error[500] : theme.colors.success[500] }
                ]}>
                  {transaction.type === 'purchase' ? '-' : '+'}₹{transaction.amount.toFixed(2)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(transaction.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                    {transaction.status}
                  </Text>
                </View>
              </View>
            </AnimatedCard>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[12],
    paddingBottom: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSizes['3xl'],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing[6],
    marginBottom: theme.spacing[4],
  },
  filterChip: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.light,
    marginRight: theme.spacing[2],
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary[500],
  },
  filterChipText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.secondary,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChipTextActive: {
    color: theme.colors.text.inverse,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[6],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[16],
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.secondary,
  },
  transactionCard: {
    marginBottom: theme.spacing[3],
    padding: theme.spacing[4],
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
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
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold,
    textTransform: 'capitalize',
  },
});
