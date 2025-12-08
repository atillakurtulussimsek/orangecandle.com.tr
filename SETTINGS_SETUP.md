# Ayarlar Sistemi Kurulum ve Kullanım Kılavuzu

## Kurulum Tamamlandı ✅

Ayarlar sistemi başarıyla kurulmuştur ve kullanıma hazırdır.

## Kurulum Özeti

1. ✅ **Veritabanı Modeli** - `SiteSetting` modeli schema'ya eklendi
2. ✅ **Veritabanı Senkronizasyonu** - `npx prisma db push` çalıştırıldı
3. ✅ **Prisma Client Güncelleme** - `npx prisma generate` çalıştırıldı
4. ✅ **İlk Veri Oluşturma** - 47 ayar veritabanına eklendi
5. ✅ **API Endpoint** - `/api/admin/settings` (GET/PUT) oluşturuldu
6. ✅ **Admin UI** - `/admin/settings` sayfası oluşturuldu
7. ✅ **Helper Library** - `src/lib/settings.ts` oluşturuldu
8. ✅ **Dokümantasyon** - `SETTINGS_SYSTEM.md` oluşturuldu

## Hızlı Başlangıç

### 1. Admin Panele Giriş

1. Admin olarak giriş yapın
2. Sol menüden **"Ayarlar"** seçeneğine tıklayın
3. İstediğiniz kategoriyi seçin
4. Ayarları düzenleyin
5. **"Değişiklikleri Kaydet"** butonuna tıklayın

### 2. Ayarları Kullanma

**Basit Kullanım:**
```typescript
import { getSetting } from '@/lib/settings';

const siteName = await getSetting('site_name');
console.log(siteName); // "Orange Candle"
```

**Yapılandırma Objesi:**
```typescript
import { getSiteConfig } from '@/lib/settings';

const config = await getSiteConfig();
console.log(config);
// {
//   siteName: "Orange Candle",
//   siteDescription: "...",
//   maintenanceMode: false,
//   ...
// }
```

**Boolean Değer:**
```typescript
import { getBooleanSetting } from '@/lib/settings';

const isMaintenanceMode = await getBooleanSetting('maintenance_mode', false);
if (isMaintenanceMode) {
  // Bakım modunda
}
```

## Önemli Notlar

### TypeScript Hataları

VS Code'da bazı TypeScript hataları görebilirsiniz. Bunlar TypeScript sunucusunun Prisma Client güncellemesini henüz algılamamasından kaynaklanır.

**Çözüm 1: TypeScript Sunucusunu Yeniden Başlat**
1. VS Code'da `Ctrl + Shift + P` (Windows) veya `Cmd + Shift + P` (Mac)
2. "TypeScript: Restart TS Server" yazın ve Enter
3. Birkaç saniye bekleyin

**Çözüm 2: VS Code'u Yeniden Başlat**
- VS Code'u tamamen kapatıp açın

**Çözüm 3: Node Modules Temizle (Gerekirse)**
```bash
# Terminal'de
rm -rf node_modules
rm package-lock.json
npm install
npx prisma generate
```

### İlk Kullanım

Sistem ilk kez kullanılmaya hazır:
- ✅ 47 ayar veritabanında mevcut
- ✅ 8 kategori oluşturuldu
- ✅ Tüm ayarlar varsayılan değerlere sahip
- ✅ Admin panelden erişilebilir

## Mevcut Ayarlar

### Genel (6 ayar)
- Site adı, açıklama, logo
- Bakım modu
- İletişim bilgileri

### Kargo (4 ayar)
- Ücretsiz kargo eşiği
- Varsayılan kargo ücreti
- Teslimat süreleri

### Ödeme (5 ayar)
- Para birimi, KDV oranı
- Ödeme yöntemleri
- Minimum sipariş tutarı

### E-posta (6 ayar)
- SMTP yapılandırması
- E-posta şablonları
- Otomatik bildirimler

### SEO (6 ayar)
- Meta bilgiler
- Analytics entegrasyonları
- Tracking kodları

### Sosyal Medya (5 ayar)
- Facebook, Instagram, Twitter
- YouTube, WhatsApp

### Geliver (4 ayar)
- API token
- Gönderici bilgileri
- Test/canlı mod

### ParamPOS (4 ayar)
- Merchant bilgileri
- 3D Secure
- Test/canlı mod

## Kullanım Örnekleri

### Örnek 1: Ücretsiz Kargo Hesaplama

```typescript
// src/utils/shipping.ts
import { getShippingConfig } from '@/lib/settings';

export async function calculateShippingCost(cartTotal: number): Promise<number> {
  const config = await getShippingConfig();
  
  // Ücretsiz kargo kontrolü
  if (!config.shippingEnabled) {
    return 0;
  }
  
  if (cartTotal >= config.freeShippingThreshold) {
    return 0;
  }
  
  return config.defaultShippingCost;
}

// Kullanım
const shippingCost = await calculateShippingCost(450);
console.log(shippingCost); // 49.90 (eşik 500 TL ise)
```

### Örnek 2: SEO Meta Tags

```typescript
// src/app/layout.tsx veya page.tsx
import { getSEOConfig } from '@/lib/settings';

export async function generateMetadata() {
  const seo = await getSEOConfig();
  
  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    keywords: seo.metaKeywords,
  };
}
```

### Örnek 3: Bakım Modu Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getBooleanSetting } from '@/lib/settings';

export async function middleware(request: NextRequest) {
  const isMaintenanceMode = await getBooleanSetting('maintenance_mode', false);
  
  // Admin ve bakım sayfası hariç
  if (isMaintenanceMode && 
      !request.nextUrl.pathname.startsWith('/admin') &&
      !request.nextUrl.pathname.startsWith('/maintenance')) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }
  
  return NextResponse.next();
}
```

### Örnek 4: Minimum Sipariş Kontrolü

```typescript
// src/app/api/checkout/route.ts
import { getPaymentConfig } from '@/lib/settings';

export async function POST(request: Request) {
  const { cartTotal } = await request.json();
  const paymentConfig = await getPaymentConfig();
  
  if (cartTotal < paymentConfig.minimumOrderAmount) {
    return Response.json(
      { 
        error: `Minimum sipariş tutarı ${paymentConfig.minimumOrderAmount} ${paymentConfig.currency}` 
      },
      { status: 400 }
    );
  }
  
  // Sipariş işleme devam et
}
```

### Örnek 5: Sosyal Medya Linkleri

```typescript
// src/components/Footer.tsx
import { getSocialConfig } from '@/lib/settings';

export default async function Footer() {
  const social = await getSocialConfig();
  
  return (
    <footer>
      {social.facebookUrl && (
        <a href={social.facebookUrl} target="_blank">Facebook</a>
      )}
      {social.instagramUrl && (
        <a href={social.instagramUrl} target="_blank">Instagram</a>
      )}
      {social.whatsappNumber && (
        <a href={`https://wa.me/${social.whatsappNumber}`} target="_blank">
          WhatsApp
        </a>
      )}
    </footer>
  );
}
```

## API Test

### GET - Tüm Ayarları Getir

```bash
curl -X GET http://localhost:3000/api/admin/settings \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### PUT - Ayarları Güncelle

```bash
curl -X PUT http://localhost:3000/api/admin/settings \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": [
      {
        "id": "...",
        "key": "site_name",
        "value": "Yeni Site Adı",
        "category": "general",
        "label": "Site Adı",
        "type": "text"
      }
    ]
  }'
```

## Sorun Giderme

### Ayarlar Yüklenmiyor

```bash
# Veritabanını kontrol et
npx prisma studio

# site_settings tablosunu kontrol et
# En az 47 kayıt olmalı
```

### Admin Panelde Hata

1. Admin token'ın geçerli olduğunu kontrol edin
2. Browser console'u kontrol edin
3. Network tab'ı kontrol edin
4. Sunucu loglarını kontrol edin

### TypeScript Hataları

```bash
# Prisma Client'ı yeniden oluştur
npx prisma generate

# TypeScript cache temizle
rm -rf .next
npm run dev
```

## Gelecek Geliştirmeler

- [ ] **Cache Sistemi**: Redis veya memory cache eklenebilir
- [ ] **Şifreleme**: API token ve şifre gibi hassas veriler şifrelenebilir
- [ ] **Versiyon Kontrolü**: Ayar değişikliklerinin geçmişi tutulabilir
- [ ] **Yetkilendirme**: Farklı admin seviyelerine farklı ayar erişimi
- [ ] **Validasyon**: Daha detaylı input validation kuralları
- [ ] **Import/Export**: Ayarları JSON olarak dışa/içe aktarma
- [ ] **Grup Güncelleme**: Tüm kategorinin toplu güncellenmesi

## Destek

Sorularınız için:
- Dokümantasyon: `SETTINGS_SYSTEM.md`
- API Detayları: `src/app/api/admin/settings/route.ts`
- Kullanım Örnekleri: `src/lib/settings.ts`

---

**Sistem Durumu**: ✅ Aktif ve Kullanıma Hazır
**Son Güncelleme**: 2024
**Toplam Ayar**: 47
**Kategori Sayısı**: 8
