'use client';

import { createContext, useContext, ReactNode } from 'react';

interface SettingsContextType {
  shipping: {
    freeShippingThreshold: number;
    defaultShippingCost: number;
    enabled: boolean;
  };
  site: {
    name: string;
    contactEmail: string;
    contactPhone: string;
  };
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ 
  children, 
  settings 
}: { 
  children: ReactNode;
  settings: SettingsContextType;
}) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    // Fallback değerler
    return {
      shipping: {
        freeShippingThreshold: 250,
        defaultShippingCost: 49.90,
        enabled: true,
      },
      site: {
        name: 'Orange Candle',
        contactEmail: 'info@orangecandle.com.tr',
        contactPhone: '+90 XXX XXX XX XX',
      },
    };
  }
  return context;
}
