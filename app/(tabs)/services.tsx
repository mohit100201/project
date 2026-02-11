import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Linking,
} from "react-native";
import { Search, Package } from "lucide-react-native";
import Constants from "expo-constants";
import { useBranding } from '@/context/BrandingContext';
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

import { theme } from "@/theme";
import { AnimatedCard } from "@/components/animated/AnimatedCard";
import { getLatLong } from "@/utils/location";
import { getServicesApi } from "../../api/service.api";
import { ServiceCardSkeleton } from "@/components/shimmer/ServiceCardSkeleton";
import { VALID_ROUTES } from "@/utils/routes";

export type ServiceItem = {
  id: number;
  name: string;
  slug: string;
  image: string;
  url: string;
  status: number;
  category: string;
  is_purchased: boolean;
  amount: number | null;
  is_locked: boolean;
};
const EmptyServicesState = () => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconWrapper}>
      <Package size={40} color={theme.colors.text.tertiary} />
    </View>

    <Text style={styles.emptyTitle}>No services available</Text>
    <Text style={styles.emptySubtitle}>
      Services will appear here once they are enabled
    </Text>
  </View>
);

export default function ServicesScreen() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

   
 

  /* ===========================
      FETCH SERVICES
  ============================ */
  const handleFetchServices = async () => {
    setLoading(true);
    try {
      const location = await getLatLong();
      if (!location) {
        Toast.show({
          type: "error",
          text1: "Location Required",
          text2: "Please enable location permission",
        });
        setLoading(false);
        return;
      }

      const token = await SecureStore.getItemAsync("userToken");
     

      const json = await getServicesApi({
       
        latitude: location.latitude,
        longitude: location.longitude,
        token: token!,
        status: "active",
        perPage: 50,
      });
      
      setServices(json.data.items || []);

    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to load services",
        text2: err.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchServices();
  }, []);

  /* ===========================
      GROUP + SORT (A → Z)
  ============================ */
  const groupedServices = useMemo(() => {
    const map: Record<string, ServiceItem[]> = {};

    services.forEach((service) => {
      const category = service.category || "Others";
      if (!map[category]) map[category] = [];
      map[category].push(service);
    });

    Object.keys(map).forEach((category) => {
      map[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return Object.keys(map)
      .sort((a, b) => a.localeCompare(b))
      .map((category) => ({
        category,
        items: map[category],
      }));
  }, [services]);

  /* ===========================
      CARD CLICK HANDLER
  ============================ */
  const handleServicePress = (service: ServiceItem) => {
    const url = service.url?.trim();

    // External URL
    if (url && url.startsWith("http")) {
      Linking.openURL(url);
      return;
    }

    if (url && url.startsWith("/")) {
      if (VALID_ROUTES.includes(url)) {
        router.push(url as any);
      } else {
        router.push("/CommingSoon");
      }
      return;
    }

    // Fallback
    router.push("/CommingSoon");


  };


  /* ===========================
      UI
  ============================ */
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
      </View>

      {/* CONTENT */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ marginTop: 10 }}>
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
          </View>
        ) : services.length === 0 ? (
          <EmptyServicesState />
        ) : (
          groupedServices.map(({ category, items }) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {category.toUpperCase()}
              </Text>

              <View style={styles.servicesGrid}>
                {items.map((service, index) => (
                  <Pressable
                    key={service.id}
                    onPress={() => handleServicePress(service)}
                    style={({ pressed }) => [
                      styles.pressable,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <AnimatedCard
                      style={styles.serviceCard}
                      delay={index * 60}
                    >
                      {/* Left side: Service Image */}
                      <View style={styles.iconWrapper}>
                        <Image
                          source={{ uri: service.image }}
                          style={styles.serviceImage}
                          resizeMode="contain"
                        />
                      </View>

                      {/* Right side: Info (Title & Category) */}
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName} numberOfLines={1}>
                          {service.name}
                        </Text>
                        <Text style={styles.serviceCategory}>
                          {service.category}
                        </Text>
                      </View>
                    </AnimatedCard>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

/* ===========================
    STYLES
=========================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.dark,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[12],
    paddingBottom: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSizes["3xl"],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.light,
    justifyContent: "center",
    alignItems: "center",
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
    fontWeight: "700",
    color: theme.colors.primary[500],
    marginBottom: theme.spacing[3],
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  servicesGrid: {
    gap: theme.spacing[4],
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.background.light,
    paddingVertical: theme.spacing[3],
    borderWidth: 1,
    borderColor: `${theme.colors.primary[500]}10`,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    marginLeft: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.dark,
    justifyContent: "center",
    alignItems: "center",
    overflow: 'hidden', // Ensures image stays within rounded corners
  },
  serviceImage: {
    width: 55, // Size matches the skeleton perfectly
    height: 55,
  },
  serviceInfo: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
    gap: 4,
  },
  serviceName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
  },
  serviceCategory: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.secondary,
  },
  pressable: {
    borderRadius: theme.borderRadius.xl,
  },
  emptyState: {
    flex: 1,
    marginTop: 80,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,

  },

  emptyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.background.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: 6,
  },

  emptySubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },

});