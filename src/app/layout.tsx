import { getShippingConfig, getSiteConfig } from '@/lib/settings';
import ClientLayout from './ClientLayout';

// Next.js cache'i devre dışı bırak - ayarlar her zaman güncel olsun
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side'da ayarları fetch et
  const [shippingConfig, siteConfig] = await Promise.all([
    getShippingConfig(),
    getSiteConfig(),
  ]);

  const settings = {
    shipping: {
      freeShippingThreshold: shippingConfig.freeShippingThreshold,
      defaultShippingCost: shippingConfig.defaultShippingCost,
      enabled: shippingConfig.shippingEnabled,
    },
    site: {
      name: siteConfig.siteName,
      contactEmail: siteConfig.contactEmail,
      contactPhone: siteConfig.contactPhone,
    },
  };

  return <ClientLayout settings={settings}>{children}</ClientLayout>;
}
