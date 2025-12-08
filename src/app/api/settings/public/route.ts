import { NextResponse } from 'next/server';
import { getShippingConfig, getSiteConfig } from '@/lib/settings';

export async function GET() {
  try {
    const [shippingConfig, siteConfig] = await Promise.all([
      getShippingConfig(),
      getSiteConfig(),
    ]);

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json(
      { error: 'Ayarlar yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}
