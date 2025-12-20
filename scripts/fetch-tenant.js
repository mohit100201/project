const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// --- 1. CONFIGURATION ---
const API_URL = 'https://api.pinepe.in/api/users?type=whitelabel&per_page=10&page=1';
const TOKEN = '346|y1Jka32RNDwMg1gGkNGAhO1txb319kghZkkIqfiHf5049b46';
const TENANT_ID = process.env.TENANT_ID;

// --- 2. CORRECTED METADATA LOGIC ---
function updateAppConfig(tenantData) {
  // This must match the path in your app.config.js
  const metadataPath = path.join(__dirname, '../tenant-metadata.json');
  
  // We write the RAW tenant object. 
  // Your app.config.js will handle mapping this to the app name/package.
  fs.writeFileSync(metadataPath, JSON.stringify(tenantData, null, 2));
  
  console.log(`\x1b[32m%s\x1b[0m`, `[Config] ✅ tenant-metadata.json updated for: ${tenantData.name}`);
}

// --- 3. IMAGE PROCESSOR ---
async function downloadIcon(url) {
  const brandingDir = path.join(__dirname, '../assets/generated');
  const iconPath = path.join(brandingDir, 'icon.png');

  if (!fs.existsSync(brandingDir)) {
    fs.mkdirSync(brandingDir, { recursive: true });
  }

  try {
    console.log(`[Image] 📥 Downloading logo: ${url}`);
    const response = await axios({ url, method: 'GET', responseType: 'arraybuffer' });

    await sharp(Buffer.from(response.data))
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent padding
      })
      .png()
      .toFile(iconPath);

    console.log(`\x1b[32m%s\x1b[0m`, `[Image] ✅ Icon processed and saved.`);
  } catch (error) {
    console.error(`\x1b[31m%s\x1b[0m`, `[Image] ❌ Failed to process icon: ${error.message}`);
  }
}

// --- 4. MAIN EXECUTION ---
async function startSync() {
  console.log(`\x1b[36m%s\x1b[0m`, `[Sync] 🚀 Fetching Tenant: ${TENANT_ID}`);

  if (!TENANT_ID) {
    console.error(`\x1b[31m%s\x1b[0m`, `[Sync] ❌ No TENANT_ID provided!`);
    process.exit(1);
  }

  try {
    const response = await axios.get(API_URL, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      }
    });

    const tenants = response.data.data.items;
    const currentTenant = tenants.find(t => 
      t.unique_id === TENANT_ID || t.id.toString() === TENANT_ID
    );

    if (currentTenant) {
      // Step 1: Write to tenant-metadata.json
      updateAppConfig(currentTenant);
      
      // Step 2: Download the photo from API
      if (currentTenant.photo) {
        await downloadIcon(currentTenant.photo);
      }
      
      console.log(`\x1b[32m%s\x1b[0m`, `[Sync] ✨ Sync Complete.`);
    } else {
      console.error(`\x1b[31m%s\x1b[0m`, `[Sync] ❌ Tenant ID ${TENANT_ID} not found.`);
    }
  } catch (error) {
    console.error(`\x1b[31m%s\x1b[0m`, `[Sync] ❌ API Error: ${error.message}`);
  }
}

startSync();