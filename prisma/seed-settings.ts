import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialSettings = [
  // General Settings
  {
    key: 'site_name',
    value: 'Orange Candle',
    category: 'general',
    label: 'Site Adı',
    type: 'text',
    description: 'Web sitenizin genel adı',
  },
  {
    key: 'site_description',
    value: 'Premium mum ve ev dekorasyon ürünleri',
    category: 'general',
    label: 'Site Açıklaması',
    type: 'textarea',
    description: 'Sitenizin kısa açıklaması',
  },
  {
    key: 'site_logo',
    value: '/images/logo.png',
    category: 'general',
    label: 'Site Logosu',
    type: 'url',
    description: 'Logo dosyasının yolu',
  },
  {
    key: 'maintenance_mode',
    value: 'false',
    category: 'general',
    label: 'Bakım Modu',
    type: 'boolean',
    description: 'Aktif olduğunda site ziyaretçilere kapalı olur',
  },
  {
    key: 'maintenance_end_time',
    value: '',
    category: 'general',
    label: 'Bakım Modu Bitiş Zamanı',
    type: 'datetime',
    description: 'Bakım modunun otomatik olarak kapanacağı tarih ve saat (ISO format: 2025-12-31T23:59:59)',
  },
  {
    key: 'maintenance_message',
    value: 'Sitemiz şu anda bakımda. En kısa sürede yeniden hizmetinizdeyiz!',
    category: 'general',
    label: 'Bakım Modu Mesajı',
    type: 'textarea',
    description: 'Bakım modu ekranında gösterilecek mesaj',
  },
  {
    key: 'contact_email',
    value: 'info@orangecandle.com.tr',
    category: 'general',
    label: 'İletişim E-postası',
    type: 'email',
    description: 'Müşteri iletişimi için e-posta adresi',
  },
  {
    key: 'contact_phone',
    value: '+90 XXX XXX XX XX',
    category: 'general',
    label: 'İletişim Telefonu',
    type: 'text',
    description: 'Müşteri iletişimi için telefon numarası',
  },

  // Shipping Settings
  {
    key: 'free_shipping_threshold',
    value: '500',
    category: 'shipping',
    label: 'Ücretsiz Kargo Eşiği',
    type: 'number',
    description: 'Bu tutarın üzerindeki siparişlerde ücretsiz kargo (TL)',
  },
  {
    key: 'default_shipping_cost',
    value: '49.90',
    category: 'shipping',
    label: 'Varsayılan Kargo Ücreti',
    type: 'number',
    description: 'Standart kargo ücreti (TL)',
  },
  {
    key: 'shipping_enabled',
    value: 'true',
    category: 'shipping',
    label: 'Kargo Etkin',
    type: 'boolean',
    description: 'Kargo hizmetinin aktif olup olmadığı',
  },
  {
    key: 'max_delivery_days',
    value: '3',
    category: 'shipping',
    label: 'Maksimum Teslimat Günü',
    type: 'number',
    description: 'Tahmini maksimum teslimat süresi (gün)',
  },

  // Payment Settings
  {
    key: 'currency',
    value: 'TRY',
    category: 'payment',
    label: 'Para Birimi',
    type: 'select',
    description: 'Site para birimi',
    options: JSON.stringify(['TRY', 'USD', 'EUR']),
  },
  {
    key: 'tax_rate',
    value: '20',
    category: 'payment',
    label: 'KDV Oranı',
    type: 'number',
    description: 'Varsayılan KDV oranı (%)',
  },
  {
    key: 'credit_card_enabled',
    value: 'true',
    category: 'payment',
    label: 'Kredi Kartı Ödemesi',
    type: 'boolean',
    description: 'Kredi kartı ile ödeme aktif mi',
  },
  {
    key: 'bank_transfer_enabled',
    value: 'true',
    category: 'payment',
    label: 'Havale/EFT',
    type: 'boolean',
    description: 'Havale/EFT ile ödeme aktif mi',
  },
  {
    key: 'minimum_order_amount',
    value: '100',
    category: 'payment',
    label: 'Minimum Sipariş Tutarı',
    type: 'number',
    description: 'Minimum sipariş tutarı (TL)',
  },

  // Email Settings
  {
    key: 'smtp_host',
    value: '',
    category: 'email',
    label: 'SMTP Host',
    type: 'text',
    description: 'SMTP sunucu adresi',
  },
  {
    key: 'smtp_port',
    value: '587',
    category: 'email',
    label: 'SMTP Port',
    type: 'number',
    description: 'SMTP port numarası',
  },
  {
    key: 'smtp_user',
    value: '',
    category: 'email',
    label: 'SMTP Kullanıcı Adı',
    type: 'email',
    description: 'SMTP kullanıcı adı/e-posta',
  },
  {
    key: 'smtp_password',
    value: '',
    category: 'email',
    label: 'SMTP Şifre',
    type: 'text',
    description: 'SMTP şifresi',
  },
  {
    key: 'email_from_name',
    value: 'Orange Candle',
    category: 'email',
    label: 'Gönderici Adı',
    type: 'text',
    description: 'E-postalarda görünecek gönderici adı',
  },
  {
    key: 'order_confirmation_enabled',
    value: 'true',
    category: 'email',
    label: 'Sipariş Onay E-postası',
    type: 'boolean',
    description: 'Sipariş alındığında otomatik e-posta gönder',
  },

  // SEO Settings
  {
    key: 'meta_title',
    value: 'Orange Candle - Premium Mum ve Dekorasyon',
    category: 'seo',
    label: 'Meta Başlık',
    type: 'text',
    description: 'Ana sayfa meta başlığı',
  },
  {
    key: 'meta_description',
    value: 'En kaliteli mum ve ev dekorasyon ürünleri Orange Candle\'da. Hızlı teslimat, güvenli alışveriş.',
    category: 'seo',
    label: 'Meta Açıklama',
    type: 'textarea',
    description: 'Ana sayfa meta açıklaması',
  },
  {
    key: 'meta_keywords',
    value: 'mum, kokulu mum, dekorasyon, ev dekorasyon, candle',
    category: 'seo',
    label: 'Meta Anahtar Kelimeler',
    type: 'textarea',
    description: 'SEO anahtar kelimeleri (virgülle ayırın)',
  },
  {
    key: 'google_analytics_id',
    value: '',
    category: 'seo',
    label: 'Google Analytics ID',
    type: 'text',
    description: 'Google Analytics izleme kodu (örn: UA-XXXXXXXXX-X)',
  },
  {
    key: 'google_tag_manager_id',
    value: '',
    category: 'seo',
    label: 'Google Tag Manager ID',
    type: 'text',
    description: 'Google Tag Manager kodu (örn: GTM-XXXXXXX)',
  },
  {
    key: 'facebook_pixel_id',
    value: '',
    category: 'seo',
    label: 'Facebook Pixel ID',
    type: 'text',
    description: 'Facebook Pixel izleme kodu',
  },

  // Social Media Settings
  {
    key: 'facebook_url',
    value: '',
    category: 'social',
    label: 'Facebook URL',
    type: 'url',
    description: 'Facebook sayfa bağlantısı',
  },
  {
    key: 'instagram_url',
    value: '',
    category: 'social',
    label: 'Instagram URL',
    type: 'url',
    description: 'Instagram profil bağlantısı',
  },
  {
    key: 'twitter_url',
    value: '',
    category: 'social',
    label: 'Twitter URL',
    type: 'url',
    description: 'Twitter profil bağlantısı',
  },
  {
    key: 'youtube_url',
    value: '',
    category: 'social',
    label: 'YouTube URL',
    type: 'url',
    description: 'YouTube kanal bağlantısı',
  },
  {
    key: 'whatsapp_number',
    value: '',
    category: 'social',
    label: 'WhatsApp Numarası',
    type: 'text',
    description: 'WhatsApp iletişim numarası (ör: 905XXXXXXXXX)',
  },

  // Geliver Settings
  {
    key: 'geliver_api_token',
    value: '',
    category: 'geliver',
    label: 'Geliver API Token',
    type: 'text',
    description: 'Geliver API erişim token\'ı',
  },
  {
    key: 'geliver_sender_address_id',
    value: '',
    category: 'geliver',
    label: 'Gönderici Adres ID',
    type: 'text',
    description: 'Geliver\'daki gönderici adres ID\'si',
  },
  {
    key: 'geliver_test_mode',
    value: 'true',
    category: 'geliver',
    label: 'Test Modu',
    type: 'boolean',
    description: 'Geliver test modunu kullan',
  },
  {
    key: 'geliver_auto_create_label',
    value: 'false',
    category: 'geliver',
    label: 'Otomatik Etiket Oluştur',
    type: 'boolean',
    description: 'Sipariş onaylandığında otomatik kargo etiketi oluştur',
  },

  // ParamPOS Settings
  {
    key: 'parampos_client_code',
    value: '10738',
    category: 'parampos',
    label: 'Client Code',
    type: 'text',
    description: 'ParamPOS müşteri kodu (Test: 10738)',
  },
  {
    key: 'parampos_client_username',
    value: 'Test',
    category: 'parampos',
    label: 'Client Username',
    type: 'text',
    description: 'ParamPOS kullanıcı adı (Test: Test)',
  },
  {
    key: 'parampos_client_password',
    value: 'Test',
    category: 'parampos',
    label: 'Client Password',
    type: 'password',
    description: 'ParamPOS şifre (Test: Test)',
  },
  {
    key: 'parampos_guid',
    value: '0c13d406-873b-403b-9c09-a5766840d98c',
    category: 'parampos',
    label: 'GUID',
    type: 'text',
    description: 'ParamPOS GUID değeri',
  },
  {
    key: 'parampos_base_url',
    value: 'https://testposws.param.com.tr/turkpos.ws/service_turkpos_prod.asmx',
    category: 'parampos',
    label: 'API URL',
    type: 'text',
    description: 'ParamPOS API endpoint URL (Test/Production)',
  },
  {
    key: 'parampos_mode',
    value: 'TEST',
    category: 'parampos',
    label: 'Mod',
    type: 'select',
    description: 'ParamPOS çalışma modu (TEST/PROD)',
    options: JSON.stringify(['TEST', 'PROD']),
  },
  {
    key: 'parampos_3d_secure',
    value: 'true',
    category: 'parampos',
    label: '3D Secure',
    type: 'boolean',
    description: '3D Secure ödemelerini aktif et',
  },
];

async function seedSettings() {
  console.log('🌱 Seeding settings...');

  for (const setting of initialSettings) {
    try {
      await prisma.siteSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting,
      });
      console.log(`✅ ${setting.label} (${setting.key})`);
    } catch (error) {
      console.error(`❌ Error seeding ${setting.key}:`, error);
    }
  }

  console.log('\n✨ Settings seeding completed!');
}

seedSettings()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
