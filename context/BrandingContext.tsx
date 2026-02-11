import React, { createContext, useContext, useEffect, useState } from 'react';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { Image } from 'react-native';
import * as SecureStore from "expo-secure-store";
import { setApiHeaders } from '@/api/api.header';

type BrandingState = {
  logoUrl: string | null;
  domainName: string | null;
  tenant: any | null;
  loading: boolean;
};

const BrandingContext = createContext<BrandingState>({
  logoUrl: null,
  domainName: null,
  tenant: null,
  loading: true,
});

export const useBranding = () => useContext(BrandingContext);

// Use tenant list API requested; will match app name to choose the tenant
const TENANTS_API = 'https://api.pinepe.in/api/users?type=whitelabel&per_page=10&page=1';

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [domainName, setDomainName] = useState<string | null>(null);
  const [tenant, setTenant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {


        // Otherwise, try to infer tenant by the installed application name
        // const appName = (Application.applicationName || '').toString().trim();
        const appName = "pinepe";
       
        if (!appName) {
          setLoading(false);
          return;
        }


        // Fetch tenant list and match by name / unique_id (case-insensitive)
        const token = "346|y1Jka32RNDwMg1gGkNGAhO1txb319kghZkkIqfiHf5049b46";
        
        const res = await fetch(TENANTS_API, { headers: { Accept: 'application/json', 'Authorization': `Bearer ${token}`, } });
        const json = await res.json();
       
        if (json?.data?.items && Array.isArray(json.data.items)) {
          const key = appName.toLowerCase();
          const found = json.data.items.find((t: any) => {
            return (
              (t.name && t.name.toLowerCase() === key) ||
              (t.unique_id && t.unique_id.toString().toLowerCase() === key) ||
              (t.domain && t.domain.toLowerCase().includes(key))
            );
          });

          

          if (found) {
            setTenant(found);

            const domain = found.domain || null;
            setDomainName(domain);

            if (domain) {
              setApiHeaders({
                domain,
              });
            }

            const photo = found.photo || null;
            if (photo) {
              try {
                await Image.prefetch(photo);
              } catch { }
            }
            setLogoUrl(photo);
          }

        }
      } catch (err) {
        console.warn('Branding init failed:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return (
    <BrandingContext.Provider value={{ logoUrl, domainName, tenant, loading }}>
      {children}
    </BrandingContext.Provider>
  );
};

export default BrandingContext;
