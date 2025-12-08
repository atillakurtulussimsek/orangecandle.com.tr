'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OfflineDetector from '@/components/OfflineDetector';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { CartProvider } from '@/contexts/CartContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

interface SettingsType {
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

export default function ClientLayout({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: SettingsType;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <html lang="tr" className="m-0 p-0">
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} font-sans antialiased m-0 p-0`}>
        <SettingsProvider settings={settings}>
          <CartProvider>
            <WishlistProvider>
              <OfflineDetector />
              {!isAdminRoute && <Header />}
              <main className={isAdminRoute ? 'min-h-screen' : 'min-h-screen lg:mt-[140px] mt-[80px]'}>
                {children}
              </main>
              {!isAdminRoute && <Footer />}
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
