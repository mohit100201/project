import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from 'react-native';
import { Search } from 'lucide-react-native';
import { theme } from '@/theme';
import { AnimatedCard } from '@/components/animated/AnimatedCard';
import { AnimatedButton } from '@/components/animated/AnimatedButton';
import { MPINModal } from '@/components/ui/MPINModal';

const mockServices = [
  {
    id: '1',
    name: 'Mobile Recharge',
    description: 'Instant mobile recharge',
    price: 10.00,
    category: 'recharge',
    image: 'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: '2',
    name: 'DTH Recharge',
    description: 'Recharge your DTH',
    price: 15.00,
    category: 'recharge',
    image: 'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: '3',
    name: 'Electricity Bill',
    description: 'Pay electricity bills',
    price: 50.00,
    category: 'bills',
    image: 'https://images.pexels.com/photos/949587/pexels-photo-949587.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: '4',
    name: 'Water Bill',
    description: 'Pay water bills',
    price: 30.00,
    category: 'bills',
    image: 'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

export default function ServicesScreen() {
  const [selectedService, setSelectedService] = useState<typeof mockServices[0] | null>(null);
  const [showMPINModal, setShowMPINModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBuyService = (service: typeof mockServices[0]) => {
    setSelectedService(service);
    setShowMPINModal(true);
  };

  const handleMPINSuccess = async () => {
    if (!selectedService) return;

    setShowMPINModal(false);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', `${selectedService.name} purchased successfully!`);
      setSelectedService(null);
    }, 500);
  };

  const getCategoryServices = (category: string) => {
    return mockServices.filter(s => s.category === category);
  };

  const categories = Array.from(new Set(mockServices.map(s => s.category)));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
        <Pressable style={styles.searchButton}>
          <Search size={20} color={theme.colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {categories.map((category) => {
          const categoryServices = getCategoryServices(category);
          if (categoryServices.length === 0) return null;

          return (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
              <View style={styles.servicesGrid}>
                {categoryServices.map((service, index) => (
                  <AnimatedCard
                    key={service.id}
                    style={styles.serviceCard}
                    delay={index * 50}
                  >
                    <Image
                      source={{ uri: service.image }}
                      style={styles.serviceImage}
                      resizeMode="cover"
                    />
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName} numberOfLines={2}>
                        {service.name}
                      </Text>
                      <Text style={styles.serviceDescription} numberOfLines={2}>
                        {service.description}
                      </Text>
                      <View style={styles.serviceFooter}>
                        <Text style={styles.servicePrice}>₹{service.price.toFixed(2)}</Text>
                        <AnimatedButton
                          title="Buy Now"
                          onPress={() => handleBuyService(service)}
                          variant="primary"
                          size="small"
                          loading={loading && selectedService?.id === service.id}
                        />
                      </View>
                    </View>
                  </AnimatedCard>
                ))}
              </View>
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      <MPINModal
        visible={showMPINModal}
        onSuccess={handleMPINSuccess}
        onCancel={() => {
          setShowMPINModal(false);
          setSelectedService(null);
        }}
      />
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
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[6],
  },
  categorySection: {
    marginBottom: theme.spacing[6],
  },
  categoryTitle: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[3],
    letterSpacing: 1,
  },
  servicesGrid: {
    gap: theme.spacing[4],
  },
  serviceCard: {
    flexDirection: 'row',
    padding: 0,
    overflow: 'hidden',
  },
  serviceImage: {
    width: 100,
    height: 100,
  },
  serviceInfo: {
    flex: 1,
    padding: theme.spacing[3],
    justifyContent: 'space-between',
  },
  serviceName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  serviceDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary[500],
  },
});
