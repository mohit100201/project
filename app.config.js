import fs from "fs";
import path from "path";

const PROJECT_IDS = {
  pinepe: "b54319dc-24f4-4efa-88b2-8bf3e75a8559",
  "klj-pay": "REPLACE_WITH_ID_FROM_EXPO",
  laxmeepay: "98add4ed-acbe-4fdc-a574-881813ac2981",
};

export default ({ config }) => {
  const metadataPath = path.join(__dirname, "tenant-metadata.json");

  // Generated tenant assets (created by fetch-tenant.js)
  const iconPath = "./assets/generated/icon.png";
  const splashPath = "./assets/generated/icon.png";

  let tenant = null;

  if (fs.existsSync(metadataPath)) {
    tenant = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
  }

  // Fallback (dev / safety)
  if (!tenant) {
    console.warn("⚠️ No tenant-metadata.json found. Using default config.");
    return config;
  }

  const tenantSlug = tenant.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return {
    ...config,
    jsEngine: "hermes",
    /** ===============================
     *  APP IDENTITY
     *  =============================== */
    name: tenant.name,
    slug: tenantSlug,
    icon: iconPath,

    /** ===============================
     *  SPLASH (CRITICAL FOR WHITE-LABEL)
     *  =============================== */
    splash: {
      image: splashPath,
      resizeMode: "contain",
      backgroundColor: "#FFFFFF",
    },

    /** ===============================
     *  PLUGINS
     *  =============================== */
    plugins: [
      ...(config.plugins || []),
      "expo-secure-store",
      "@react-native-community/datetimepicker",
    ],

    /** ===============================
     *  iOS CONFIG
     *  =============================== */
    ios: {
      ...config.ios,
      bundleIdentifier: `in.pinepe.${tenantSlug}`,
      icon: iconPath,

      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "We need your location to show nearby services and offers.",
        NSPhotoLibraryUsageDescription:
          "Allow access to your photos to upload profile picture",
        NSCameraUsageDescription:
          "Allow camera access to take profile picture",
      },
    },

    /** ===============================
     *  ANDROID CONFIG
     *  =============================== */
    android: {
      ...config.android,
      package: `in.pinepe.${tenantSlug}`,
      icon: iconPath,

      adaptiveIcon: {
        foregroundImage: iconPath,
        backgroundColor: "#FFFFFF",
      },

      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
      ],
    },

    /** ===============================
     *  EXTRA (TENANT + EAS)
     *  =============================== */
    extra: {
      tenantData: tenant,

      eas: {
        projectId:
          PROJECT_IDS[tenantSlug] ||
          "3d149857-ae73-4ed1-a34d-12a0018a87c8",
      },
    },
  };
};
