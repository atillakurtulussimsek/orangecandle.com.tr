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
      contact: {
        email: siteConfig.contactEmail || 'info@orangecandle.com.tr',
        phone: siteConfig.contactPhone || '+90 (5xx) xxx xx xx',
        address: siteConfig.address || 'İstanbul, Türkiye',
        workingHours: siteConfig.workingHours || 'Pzt-Cum: 09:00-18:00',
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
