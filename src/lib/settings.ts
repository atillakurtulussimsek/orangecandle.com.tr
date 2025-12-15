import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get a single setting value by key
 */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key },
    });

    return setting?.value || null;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
}

/**
 * Get multiple settings by keys
 */
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: keys,
        },
      },
    });

    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
}

/**
 * Get all settings in a category
 */
export async function getSettingsByCategory(category: string): Promise<Record<string, string>> {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { category },
    });

    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error(`Error fetching settings for category ${category}:`, error);
    return {};
  }
}

/**
 * Update a single setting
 */
export async function updateSetting(key: string, value: string): Promise<boolean> {
  try {
    await prisma.siteSetting.update({
      where: { key },
      data: { value },
    });

    return true;
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    return false;
  }
}

/**
 * Update multiple settings at once
 */
export async function updateSettings(settings: Record<string, string>): Promise<boolean> {
  try {
    const updates = Object.entries(settings).map(([key, value]) =>
      prisma.siteSetting.update({
        where: { key },
        data: { value },
      })
    );

    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error('Error updating settings:', error);
    return false;
  }
}

/**
 * Get boolean setting value
 */
export async function getBooleanSetting(key: string, defaultValue: boolean = false): Promise<boolean> {
  const value = await getSetting(key);
  if (value === null) return defaultValue;
  return value === 'true';
}

/**
 * Get number setting value
 */
export async function getNumberSetting(key: string, defaultValue: number = 0): Promise<number> {
  const value = await getSetting(key);
  if (value === null) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get all settings grouped by category
 */
export async function getAllSettings(): Promise<Record<string, Record<string, string>>> {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { label: 'asc' },
      ],
    });

    return settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      acc[setting.category][setting.key] = setting.value;
      return acc;
    }, {} as Record<string, Record<string, string>>);
  } catch (error) {
    console.error('Error fetching all settings:', error);
    return {};
  }
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  return await getBooleanSetting(key, false);
}

/**
 * Get site configuration
 */
export async function getSiteConfig() {
  const generalSettings = await getSettingsByCategory('general');
  
  return {
    siteName: generalSettings.site_name || 'Orange Candle',
    siteDescription: generalSettings.site_description || '',
    siteLogo: generalSettings.site_logo || '/images/logo.png',
    maintenanceMode: generalSettings.maintenance_mode === 'true',
    contactEmail: generalSettings.contact_email || '',
    contactPhone: generalSettings.contact_phone || '',
    address: generalSettings.address || '',
    workingHours: generalSettings.working_hours || '',
  };
}

/**
 * Get shipping configuration
 */
export async function getShippingConfig() {
  const shippingSettings = await getSettingsByCategory('shipping');
  
  return {
    freeShippingThreshold: parseFloat(shippingSettings.free_shipping_threshold || '250'),
    defaultShippingCost: parseFloat(shippingSettings.default_shipping_cost || '49.90'),
    shippingEnabled: shippingSettings.shipping_enabled === 'true',
    maxDeliveryDays: parseInt(shippingSettings.max_delivery_days || '3'),
  };
}

/**
 * Get payment configuration
 */
export async function getPaymentConfig() {
  const paymentSettings = await getSettingsByCategory('payment');
  
  return {
    currency: paymentSettings.currency || 'TRY',
    taxRate: parseFloat(paymentSettings.tax_rate || '20'),
    creditCardEnabled: paymentSettings.credit_card_enabled === 'true',
    bankTransferEnabled: paymentSettings.bank_transfer_enabled === 'true',
    minimumOrderAmount: parseFloat(paymentSettings.minimum_order_amount || '0'),
  };
}

/**
 * Get email configuration
 */
export async function getEmailConfig() {
  const emailSettings = await getSettingsByCategory('email');
  
  return {
    smtpHost: emailSettings.smtp_host || '',
    smtpPort: parseInt(emailSettings.smtp_port || '587'),
    smtpUser: emailSettings.smtp_user || '',
    smtpPassword: emailSettings.smtp_password || '',
    emailFromName: emailSettings.email_from_name || 'Orange Candle',
    orderConfirmationEnabled: emailSettings.order_confirmation_enabled === 'true',
  };
}

/**
 * Get SEO configuration
 */
export async function getSEOConfig() {
  const seoSettings = await getSettingsByCategory('seo');
  
  return {
    metaTitle: seoSettings.meta_title || '',
    metaDescription: seoSettings.meta_description || '',
    metaKeywords: seoSettings.meta_keywords || '',
    googleAnalyticsId: seoSettings.google_analytics_id || '',
    googleTagManagerId: seoSettings.google_tag_manager_id || '',
    facebookPixelId: seoSettings.facebook_pixel_id || '',
  };
}

/**
 * Get social media configuration
 */
export async function getSocialConfig() {
  const socialSettings = await getSettingsByCategory('social');
  
  return {
    facebookUrl: socialSettings.facebook_url || '',
    instagramUrl: socialSettings.instagram_url || '',
    twitterUrl: socialSettings.twitter_url || '',
    youtubeUrl: socialSettings.youtube_url || '',
    whatsappNumber: socialSettings.whatsapp_number || '',
  };
}

/**
 * Get Geliver configuration
 */
export async function getGeliverConfig() {
  const geliverSettings = await getSettingsByCategory('geliver');
  
  return {
    apiToken: geliverSettings.geliver_api_token || '',
    senderAddressId: geliverSettings.geliver_sender_address_id || '',
    testMode: geliverSettings.geliver_test_mode === 'true',
    autoCreateLabel: geliverSettings.geliver_auto_create_label === 'true',
  };
}

/**
 * Get ParamPOS configuration
 */
export async function getParamPOSConfig() {
  const paramposSettings = await getSettingsByCategory('parampos');
  
  return {
    clientCode: paramposSettings.parampos_client_code || '10738',
    clientUsername: paramposSettings.parampos_client_username || 'Test',
    clientPassword: paramposSettings.parampos_client_password || 'Test',
    guid: paramposSettings.parampos_guid || '0c13d406-873b-403b-9c09-a5766840d98c',
    baseUrl: paramposSettings.parampos_base_url || 'https://testposws.param.com.tr/turkpos.ws/service_turkpos_prod.asmx',
    mode: paramposSettings.parampos_mode || 'TEST',
    secure3d: paramposSettings.parampos_3d_secure === 'true',
  };
}
