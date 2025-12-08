# Ayarlar Sistemi Dokümantasyonu

## Genel Bakış

Orange Candle e-ticaret platformu için merkezi ayarlar yönetim sistemi. Tüm site ve sistem yapılandırmaları bu sistem üzerinden yönetilebilir.

## Özellikler

- ✅ **Kategori Bazlı Organizasyon**: Ayarlar mantıksal gruplara ayrılmıştır
- ✅ **Çoklu Veri Tipi Desteği**: Text, Number, Boolean, Email, URL, Textarea, Select
- ✅ **Kolay Yönetim**: Admin panel üzerinden sürükle-bırak olmadan basit düzenleme
- ✅ **API Entegrasyonu**: Programatik erişim için RESTful API
- ✅ **TypeScript Desteği**: Tip güvenli helper fonksiyonlar
- ✅ **Veritabanı Entegrasyonu**: MySQL üzerinde saklanır

## Veritabanı Yapısı

```prisma
model SiteSetting {
  id          String   @id @default(cuid())
  key         String   @unique          // Benzersiz anahtar
  value       String   @db.Text        // Değer
  category    String                   // Kategori (general, shipping, vb.)
  label       String                   // Görünen etiket
  type        String                   // Veri tipi
  description String?  @db.Text        // Açıklama
  options     String?  @db.Text        // Select için seçenekler (JSON)
  isActive    Boolean  @default(true)  // Aktiflik durumu
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Ayar Kategorileri

### 1. Genel Ayarlar (general)
- `site_name` - Site adı
- `site_description` - Site açıklaması
- `site_logo` - Logo dosya yolu
- `maintenance_mode` - Bakım modu (boolean)
- `contact_email` - İletişim e-postası
- `contact_phone` - İletişim telefonu

### 2. Kargo Ayarları (shipping)
- `free_shipping_threshold` - Ücretsiz kargo eşiği (TL)
- `default_shipping_cost` - Varsayılan kargo ücreti
- `shipping_enabled` - Kargo hizmeti aktif mi
- `max_delivery_days` - Maksimum teslimat süresi (gün)

### 3. Ödeme Ayarları (payment)
- `currency` - Para birimi (TRY, USD, EUR)
- `tax_rate` - KDV oranı (%)
- `credit_card_enabled` - Kredi kartı ödemesi
- `bank_transfer_enabled` - Havale/EFT
- `minimum_order_amount` - Minimum sipariş tutarı

### 4. E-posta Ayarları (email)
- `smtp_host` - SMTP sunucu adresi
- `smtp_port` - SMTP port
- `smtp_user` - SMTP kullanıcı adı
- `smtp_password` - SMTP şifresi
- `email_from_name` - Gönderici adı
- `order_confirmation_enabled` - Sipariş onay e-postası

### 5. SEO Ayarları (seo)
- `meta_title` - Ana sayfa meta başlığı
- `meta_description` - Ana sayfa meta açıklaması
- `meta_keywords` - Anahtar kelimeler
- `google_analytics_id` - Google Analytics ID
- `google_tag_manager_id` - Google Tag Manager ID
- `facebook_pixel_id` - Facebook Pixel ID

### 6. Sosyal Medya (social)
- `facebook_url` - Facebook sayfa linki
- `instagram_url` - Instagram profil linki
- `twitter_url` - Twitter profil linki
- `youtube_url` - YouTube kanal linki
- `whatsapp_number` - WhatsApp numarası

### 7. Geliver Entegrasyonu (geliver)
- `geliver_api_token` - API token
- `geliver_sender_address_id` - Gönderici adres ID
- `geliver_test_mode` - Test modu
- `geliver_auto_create_label` - Otomatik etiket oluşturma

### 8. ParamPOS Entegrasyonu (parampos)
- `parampos_merchant_id` - Merchant ID
- `parampos_merchant_key` - Merchant Key
- `parampos_production_mode` - Canlı mod
- `parampos_3d_secure` - 3D Secure aktif

## API Kullanımı

### Tüm Ayarları Getir

```typescript
GET /api/admin/settings
Authorization: Bearer {admin_token}

// Response:
{
  "settings": {
    "general": [
      {
        "id": "cuid123",
        "key": "site_name",
        "value": "Orange Candle",
        "category": "general",
        "label": "Site Adı",
        "type": "text",
        "description": "Web sitenizin genel adı"
      },
      // ... diğer ayarlar
    ],
    "shipping": [...],
    // ... diğer kategoriler
  }
}
```

### Ayarları Güncelle

```typescript
PUT /api/admin/settings
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "settings": [
    {
      "id": "cuid123",
      "key": "site_name",
      "value": "Yeni Site Adı",
      "category": "general",
      "label": "Site Adı",
      "type": "text"
    },
    // ... güncellenecek diğer ayarlar
  ]
}

// Response:
{
  "success": true,
  "updated": 15
}
```

## Programatik Kullanım

### Helper Fonksiyonlar

```typescript
import {
  getSetting,
  getSettings,
  getBooleanSetting,
  getNumberSetting,
  updateSetting,
  updateSettings,
  getSiteConfig,
  getShippingConfig,
  getPaymentConfig,
  getEmailConfig,
  getSEOConfig,
  getSocialConfig,
  getGeliverConfig,
  getParamPOSConfig,
} from '@/lib/settings';

// Tek bir ayar
const siteName = await getSetting('site_name');

// Boolean ayar
const maintenanceMode = await getBooleanSetting('maintenance_mode', false);

// Number ayar
const taxRate = await getNumberSetting('tax_rate', 20);

// Birden fazla ayar
const settings = await getSettings(['site_name', 'contact_email']);

// Kategori bazlı yapılandırma
const siteConfig = await getSiteConfig();
// {
//   siteName: "Orange Candle",
//   siteDescription: "...",
//   siteLogo: "/images/logo.png",
//   maintenanceMode: false,
//   contactEmail: "info@orangecandle.com.tr",
//   contactPhone: "+90 XXX XXX XX XX"
// }

// Kargo yapılandırması
const shippingConfig = await getShippingConfig();
// {
//   freeShippingThreshold: 500,
//   defaultShippingCost: 49.90,
//   shippingEnabled: true,
//   maxDeliveryDays: 3
// }

// Ayar güncelleme
await updateSetting('site_name', 'Yeni İsim');

// Çoklu güncelleme
await updateSettings({
  'site_name': 'Yeni İsim',
  'contact_email': 'yeni@email.com'
});
```

### Örnek Kullanım Senaryoları

#### 1. Ücretsiz Kargo Kontrolü

```typescript
import { getShippingConfig } from '@/lib/settings';

export async function calculateShipping(cartTotal: number) {
  const config = await getShippingConfig();
  
  if (cartTotal >= config.freeShippingThreshold) {
    return 0;
  }
  
  return config.defaultShippingCost;
}
```

#### 2. Bakım Modu Kontrolü

```typescript
import { getSiteConfig } from '@/lib/settings';

export async function checkMaintenanceMode() {
  const config = await getSiteConfig();
  
  if (config.maintenanceMode) {
    return {
      redirect: {
        destination: '/maintenance',
        permanent: false,
      },
    };
  }
  
  return { props: {} };
}
```

#### 3. Minimum Sipariş Tutarı Kontrolü

```typescript
import { getPaymentConfig } from '@/lib/settings';

export async function validateOrderAmount(amount: number) {
  const config = await getPaymentConfig();
  
  if (amount < config.minimumOrderAmount) {
    throw new Error(`Minimum sipariş tutarı ${config.minimumOrderAmount} TL`);
  }
}
```

## Yeni Ayar Ekleme

### 1. Veritabanına Ekle

```typescript
// prisma/seed-settings.ts dosyasına ekle
{
  key: 'new_setting_key',
  value: 'default_value',
  category: 'general',
  label: 'Yeni Ayar',
  type: 'text',
  description: 'Bu ayarın açıklaması',
}
```

### 2. Seed Çalıştır

```bash
npx tsx prisma/seed-settings.ts
```

### 3. Helper Fonksiyonuna Ekle (Opsiyonel)

```typescript
// src/lib/settings.ts
export async function getCustomConfig() {
  const settings = await getSettingsByCategory('custom');
  
  return {
    newSetting: settings.new_setting_key || 'default',
  };
}
```

## Veri Tipleri

### text
Standart metin girişi. Kısa metinler için uygundur.

```typescript
{
  type: 'text',
  value: 'Orange Candle'
}
```

### number
Sayısal değerler için. Ücret, oran, süre gibi değerler.

```typescript
{
  type: 'number',
  value: '500'  // String olarak saklanır, kullanırken parse edilir
}
```

### boolean
Açık/kapalı, aktif/pasif durumlar için.

```typescript
{
  type: 'boolean',
  value: 'true'  // 'true' veya 'false' string olarak
}
```

### email
E-posta adresleri için. Tarayıcı doğrulaması içerir.

```typescript
{
  type: 'email',
  value: 'info@orangecandle.com.tr'
}
```

### url
Web adresleri için. URL formatı doğrulaması içerir.

```typescript
{
  type: 'url',
  value: 'https://orangecandle.com.tr'
}
```

### textarea
Uzun metinler, açıklamalar için. Çok satırlı giriş.

```typescript
{
  type: 'textarea',
  value: 'Uzun bir açıklama metni...'
}
```

### select
Önceden tanımlı seçenekler arasından seçim.

```typescript
{
  type: 'select',
  value: 'TRY',
  options: '["TRY", "USD", "EUR"]'  // JSON string
}
```

## Güvenlik

- ✅ **Admin Authentication**: Tüm API endpoint'leri admin JWT doğrulaması gerektirir
- ✅ **Input Validation**: Tüm girişler validate edilir
- ✅ **Type Safety**: TypeScript ile tip güvenliği sağlanır
- ⚠️ **Hassas Veriler**: API token, şifre gibi bilgiler şifrelenmez (dikkatli olun)

## Performans

- ✅ **Index**: `category` alanında index mevcut
- ✅ **Caching**: Gerekirse Redis/memory cache eklenebilir
- ⚠️ **Database Calls**: Her ayar çağrısı DB query'si, dikkatli kullanın

## Geliştirme Notları

### Cache Ekleme (Gelecek)

```typescript
// Örnek cache implementasyonu
import NodeCache from 'node-cache';
const settingsCache = new NodeCache({ stdTTL: 600 }); // 10 dakika

export async function getSetting(key: string): Promise<string | null> {
  // Cache'te var mı kontrol et
  const cached = settingsCache.get<string>(key);
  if (cached !== undefined) return cached;
  
  // Veritabanından al
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  const value = setting?.value || null;
  
  // Cache'e kaydet
  if (value) settingsCache.set(key, value);
  
  return value;
}
```

### Şifreleme Ekleme (Gelecek)

```typescript
// Hassas verileri şifrele
import { encrypt, decrypt } from '@/lib/crypto';

export async function updateSensitiveSetting(key: string, value: string) {
  const encrypted = encrypt(value);
  await updateSetting(key, encrypted);
}

export async function getSensitiveSetting(key: string) {
  const encrypted = await getSetting(key);
  return encrypted ? decrypt(encrypted) : null;
}
```

## Sorun Giderme

### Ayarlar Yüklenmiyor

1. Veritabanı bağlantısını kontrol edin
2. `npx prisma generate` çalıştırın
3. `npx prisma db push` ile şemayı senkronize edin
4. Seed script'i çalıştırın: `npx tsx prisma/seed-settings.ts`

### Ayar Güncellenmiyor

1. Admin token'ın geçerli olduğunu kontrol edin
2. Request body formatını kontrol edin
3. Browser console'da hataları kontrol edin
4. Sunucu log'larını inceleyin

### Ayar Bulunamıyor

1. Key'in doğru yazıldığından emin olun
2. Veritabanında ayarın mevcut olduğunu kontrol edin
3. `isActive` alanının `true` olduğunu kontrol edin

## Test

```typescript
// API test
const response = await fetch('/api/admin/settings', {
  headers: {
    Authorization: `Bearer ${adminToken}`,
  },
});

// Helper test
import { getSetting } from '@/lib/settings';

const siteName = await getSetting('site_name');
console.log('Site Name:', siteName);
```

## Kaynaklar

- **API Route**: `/api/admin/settings/route.ts`
- **UI Sayfası**: `/admin/settings/page.tsx`
- **Helper Library**: `/lib/settings.ts`
- **Seed Script**: `/prisma/seed-settings.ts`
- **Schema**: `/prisma/schema.prisma`

## Sürüm Geçmişi

- **v1.0.0** (2024): İlk sürüm
  - 8 kategori, 47 ayar
  - RESTful API
  - Admin panel UI
  - Helper fonksiyonlar
  - TypeScript desteği
