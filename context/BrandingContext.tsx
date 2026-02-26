import React, { createContext, useContext, useEffect, useState } from 'react';
import { Image } from 'react-native';
import * as Application from 'expo-application';
import { setApiHeaders } from '@/api/api.header';

// --- Types ---
type BrandingState = {
  logoUrl: string | null;
  domainName: string | null;
  tenant: any | null;
  loading: boolean;
};

// --- Context Definition ---
const BrandingContext = createContext<BrandingState>({
  logoUrl: null,
  domainName: null,
  tenant: null,
  loading: true,
});

export const useBranding = () => useContext(BrandingContext);

const TENANTS_API = 'https://api.pinepe.in/api/whitelabel/theme';

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [domainName, setDomainName] = useState<string | null>(null);
  const [tenant, setTenant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Maps the internal App Name to the specific Production Domain
   */
  const getDomainFromAppName = (appName: string): string => {
    const name = appName.toLowerCase().trim();

    switch (name) {
      case 'pinepe':
        return 'app.pinepe.in';
      case 'cashpe':
        return 'cashpe.net';
      case 'nexapay':
        return 'nexapay.co.in';
      case 'loksevapay':
        return 'loksevapay.in';
      case 'nkpay':
        return 'nkpay.in';
      default:
        // Default fallback
        return 'app.pinepe.in';
    }
  };

  useEffect(() => {
    const initBranding = async () => {
      try {
        const appName = (Application.applicationName || '').toString().trim();
        // const appName = "cashpe"; 
        
        // 2. Resolve Domain immediately via switch case
        const resolvedDomain = getDomainFromAppName(appName);
        setDomainName(resolvedDomain);
        console.log("domain",resolvedDomain)

        // 3. Update global API headers so subsequent calls are authorized/contextualized
        setApiHeaders({
          domain: resolvedDomain,
        });

        console.log("domain",resolvedDomain)

        // 4. Fetch the specific Whitelabel configuration for this domain
        // Note: We pass the resolvedDomain in the 'domain' header
        const response = await fetch(TENANTS_API, {
          headers: {
            'Accept': 'application/json',
            'domain': resolvedDomain 
          }
        });

        const json = await response.json();

        if (json.success && json.data) {
          // The API returns { theme: {...}, plans: [...] } in json.data
          const themeData = json.data.theme;
          
          // Set the full tenant object (includes theme and plans)
          setTenant(json.data);

          // 5. Determine the best Logo (Priority: Mobile Logo > Standard Logo)
          const finalLogo = themeData?.mobile_logo || themeData?.logo;
          
          if (finalLogo) {
            setLogoUrl(finalLogo);
            // Optimization: Prefetch image into cache
            try {
              await Image.prefetch(finalLogo);
            } catch (e) {
              console.warn("Logo prefetch failed", e);
            }
          }
        } else {
          console.warn("API responded successfully but data was missing.");
        }

      } catch (err) {
        console.warn('Branding initialization failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ logoUrl, domainName, tenant, loading }}>
      {children}
    </BrandingContext.Provider>
  );
};

export default BrandingContext;