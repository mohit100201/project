// src/utils/location.ts
import * as Location from "expo-location";

type LatLong = {
  latitude: string;
  longitude: string;
};


let cachedLocation: LatLong | null = null;

export const getLatLong = async (): Promise<LatLong | null> => {
  try {
    /** ✅ Use memory cache */
    if (cachedLocation) {
      
      return cachedLocation;
    }

    /** ✅ Check permission */
    const { status } =
      await Location.getForegroundPermissionsAsync();

    let finalStatus = status;

    if (status !== "granted") {
      const permission =
        await Location.requestForegroundPermissionsAsync();
      finalStatus = permission.status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    /** ✅ Fetch location */
    const location =
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

    cachedLocation = {
      latitude: String(location.coords.latitude),
      longitude: String(location.coords.longitude),
    };

    return cachedLocation;
  } catch (err) {
    console.error("Location error:", err);
    return null;
  }
};

/** Optional manual clear (logout, account switch) */
export const clearCachedLocation = () => {
  cachedLocation = null;
};
