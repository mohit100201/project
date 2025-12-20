import fs from 'fs';
import path from 'path';

// --- ADD YOUR PROJECT IDs HERE ---
const PROJECT_IDS = {
  "pinepe": "b54319dc-24f4-4efa-88b2-8bf3e75a8559",
  "klj-pay": "REPLACE_WITH_ID_FROM_EXPO", 
  "laxmeepay": "98add4ed-acbe-4fdc-a574-881813ac2981",
  // Add others as you create them
};

export default ({ config }) => {
  const metadataPath = path.join(__dirname, 'tenant-metadata.json');
  const iconPath = "./assets/generated/icon.png"; 

  let tenant = null;
  if (fs.existsSync(metadataPath)) {
    tenant = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  }

  if (!tenant) return config;

  const tenantSlug = tenant.name.toLowerCase().replace(/\s/g, '-');

  return {
    ...config,
    name: tenant.name,
    slug: tenantSlug, 
    icon: iconPath,
    ios: {
      ...config.ios,
      bundleIdentifier: `in.pinepe.${tenantSlug}`,
      icon: iconPath
    },
    android: {
      ...config.android,
      package: `in.pinepe.${tenantSlug}`,
      icon: iconPath,
      adaptiveIcon: {
        foregroundImage: iconPath,
        backgroundColor: "#FFFFFF"
      }
    },
    extra: {
      tenantData: tenant,
      eas: {
        // DYNAMICALLY selects the correct Project ID
        projectId: PROJECT_IDS[tenantSlug] || "3d149857-ae73-4ed1-a34d-12a0018a87c8"
      }
    },
  };
};