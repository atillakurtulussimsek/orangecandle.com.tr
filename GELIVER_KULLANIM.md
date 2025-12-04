# Geliver Kargo Entegrasyonu - Kullanım Kılavuzu

## 📦 Kurulum ve Yapılandırma

### 1. Geliver API Token'ı Alın

1. https://app.geliver.io/apitokens adresine gidin
2. Yeni bir API token oluşturun
3. Token'ı kopyalayın

### 2. Environment Variables Ayarlayın

`.env` dosyanızı açın ve Geliver ayarlarını ekleyin:

```env
# Geliver Kargo API
GELIVER_TOKEN=your-actual-token-here
GELIVER_BASE_URL=https://api.geliver.io/api/v1
GELIVER_SENDER_ADDRESS_ID=
```

### 3. Gönderici Adresi Oluşturun

**Seçenek A: Admin Panel Üzerinden (Önerilen)**

1. Tarayıcınızda admin olarak giriş yapın
2. Şu adrese gidin: `http://localhost:3000/admin/shipping/sender`
3. Formu mağaza bilgilerinizle doldurun:
   - **Firma Adı**: Orange Candle
   - **E-posta**: destek@orangecandle.com.tr
   - **Telefon**: +905551234567 (başında + olmalı!)
   - **Adres**: Tam adres bilgisi
   - **Şehir**: İstanbul
   - **Şehir Kodu**: 34
   - **İlçe**: Kadıköy
   - **Posta Kodu**: 34710 (zorunlu!)
   - **Kısa Ad**: Ana Depo (opsiyonel)
4. "Gönderici Adresi Oluştur" butonuna tıklayın
5. Başarılı olursa **Sender ID** gösterilecek
6. Bu ID'yi kopyalayın

**Seçenek B: API ile (Postman/curl)**

```bash
curl -X POST http://localhost:3000/api/admin/shipping/sender \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Orange Candle",
    "email": "destek@orangecandle.com.tr",
    "phone": "+905551234567",
    "address1": "Örnek Mahallesi, Örnek Sokak No:1",
    "cityName": "İstanbul",
    "cityCode": "34",
    "districtName": "Kadıköy",
    "zip": "34710",
    "shortName": "Ana Depo"
  }'
```

### 4. Sender ID'yi .env Dosyasına Ekleyin

```env
GELIVER_SENDER_ADDRESS_ID=abc123-def456-ghi789-jkl012
```

### 5. Uygulamayı Yeniden Başlatın

```bash
# Çalışan sunucuyu durdurun (Ctrl+C)
npm run dev
```

---

## 🚀 Kargo Gönderisi Oluşturma

### Admin Panel'den Sipariş İçin Kargo Oluşturma

1. **Admin Dashboard'a gidin**: `/admin`
2. **Siparişler sayfasına gidin**: `/admin/orders`
3. **Bir sipariş seçin** ve detayına gidin
4. Sağ tarafta **"Kargo İşlemleri"** bölümünü bulun
5. **"📦 Kargo Gönderisi Oluştur"** butonuna tıklayın
6. Modal pencerede bilgileri kontrol edin ve **"Oluştur"** butonuna tıklayın

### Teklifleri Görüntüleme ve Seçme

1. Gönderi oluşturulduktan sonra **"📋 Kargo Tekliflerini Gör"** butonu aktif olur
2. Butona tıklayın (teklifler 2-5 saniye içinde hazır olur)
3. Teklif listesinde şunları göreceksiniz:
   - Kargo firması adı (MNG, Yurtiçi, Aras, vs.)
   - Servis tipi (Standart, Ekspres, vs.)
   - Fiyat (TRY)
   - Tahmini teslimat süresi
4. En uygun teklifi seçin ve **"Bu Teklifi Kabul Et"** butonuna tıklayın

### Kargo Etiketlerini İndirme

Teklif kabul edildikten sonra:

1. **"📄 PDF İndir"** butonu ile PDF formatında etiket
2. **"📱 HTML İndir"** butonu ile responsive HTML etiket
3. Etiketleri yazıcıdan çıktı alın
4. Paketi hazırlayın ve kargo şubesine teslim edin

---

## 📊 Kargo Durumu Takibi

### Otomatik Güncelleme (Webhook ile)

Geliver webhook'ları otomatik olarak şunları günceller:
- ✅ Kargo takip numarası
- ✅ Takip URL'si
- ✅ Sipariş durumu (SHIPPED, DELIVERED)
- ✅ Activity log kayıtları

### Manuel Kontrol

Sipariş detay sayfasında:
- **Kargo Firması**: Hangi kargo şirketi kullanıldı
- **Barkod**: Kargo barkod numarası
- **Takip Numarası**: Müşteriye verilecek takip no
- **🔗 Kargoyu Takip Et**: Direkt kargo firmasının sitesine gider

---

## 🔧 API Endpoints

### 1. Gönderici Adresi Oluştur
```
POST /api/admin/shipping/sender
Authorization: Bearer {admin_token}

Body:
{
  "name": "Orange Candle",
  "email": "destek@orangecandle.com.tr",
  "phone": "+905551234567",
  "address1": "Tam adres",
  "cityName": "İstanbul",
  "cityCode": "34",
  "districtName": "Kadıköy",
  "zip": "34710",
  "shortName": "Ana Depo"
}

Response:
{
  "success": true,
  "sender": {
    "id": "sender-uuid",
    "name": "Orange Candle",
    ...
  }
}
```

### 2. Gönderi Oluştur
```
POST /api/admin/shipping/create
Authorization: Bearer {admin_token}

Body:
{
  "orderId": "order-uuid",
  "test": true  // false: production
}

Response:
{
  "success": true,
  "shipment": {
    "id": "shipment-uuid",
    ...
  }
}
```

### 3. Teklifleri Getir
```
GET /api/admin/shipping/offers?shipmentId={shipment-uuid}
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "offers": {
    "data": [
      {
        "id": "offer-uuid",
        "providerName": "MNG",
        "serviceName": "Standart",
        "price": "25.50",
        "currency": "TRY",
        "deliveryTime": "2-3 gün"
      }
    ],
    "cheapest": { ... }
  }
}
```

### 4. Teklif Kabul Et
```
POST /api/admin/shipping/accept
Authorization: Bearer {admin_token}

Body:
{
  "orderId": "order-uuid",
  "offerId": "offer-uuid",
  "providerName": "MNG"
}

Response:
{
  "success": true,
  "barcode": "1234567890",
  "trackingNumber": "TR123456789",
  "labelURL": "https://...",
  "responsiveLabelURL": "https://...",
  "trackingUrl": "https://..."
}
```

### 5. Etiket İndir
```
GET /api/admin/shipping/label?url={encoded-url}&format=pdf
Authorization: Bearer {admin_token}

Response: Binary (PDF or HTML file)
```

### 6. Takip Bilgisi
```
GET /api/admin/shipping/track?shipmentId={shipment-uuid}
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "trackingStatus": {
    "trackingStatusCode": "IN_TRANSIT",
    "trackingSubStatusCode": "..."
  },
  "trackingNumber": "TR123456789",
  "trackingUrl": "https://..."
}
```

---

## 🔔 Webhook Kurulumu

### Geliver Panel'de Webhook Ekleme

1. https://app.geliver.io adresine gidin
2. Webhook ayarlarına gidin
3. Yeni webhook ekleyin:
   ```
   URL: https://yourdomain.com/api/webhooks/geliver
   Events: Tümünü seçin
   ```

### Webhook Güvenliği (Production)

`src/app/api/webhooks/geliver/route.ts` dosyasında:

```typescript
// Test ortamı için false
const isValid = verifyGeliverWebhook(body, headers, false);

// Production ortamı için true yapın
const isValid = verifyGeliverWebhook(body, headers, true);
```

### Desteklenen Webhook Events

- `TRACK_UPDATED`: Kargo durumu güncellendi
- `SHIPMENT_CREATED`: Yeni gönderi oluşturuldu
- `LABEL_READY`: Etiket hazır

---

## ⚙️ Yapılandırma

### Test vs Production Modu

**Test Modu** (Şu anki ayar):
- Gerçek kargo gönderilmez
- Test takip numaraları oluşturulur
- Para çekilmez

**Production Modu**:
1. `src/app/api/admin/shipping/create/route.ts` dosyasını açın
2. Frontend kısmında `test: true` değerini `test: false` yapın
3. Gerçek kargo gönderimleri başlayacaktır

### Şehir/İlçe Kodları

Yaygın şehir kodları:
- İstanbul: 34
- Ankara: 06
- İzmir: 35
- Bursa: 16
- Antalya: 07

API ile tam liste almak için:
```javascript
import { getCities, getDistricts } from '@/lib/geliver';

// Tüm şehirler
const cities = await getCities('TR');

// Belirli şehrin ilçeleri
const districts = await getDistricts('TR', '34');
```

### Paket Boyutları

Şu an sabit değerler kullanılıyor:
- **Boyutlar**: 30cm x 20cm x 15cm
- **Ağırlık**: Ürünlere göre hesaplanıyor (varsayılan: 0.5kg/ürün)

Özelleştirmek için `src/app/api/admin/shipping/create/route.ts` dosyasındaki bu satırları değiştirin:
```typescript
length: '30.0', // cm
width: '20.0',  // cm
height: '15.0', // cm
```

---

## ❗ Önemli Notlar

### Zorunlu Alanlar

**Gönderici Adresi İçin:**
- ✅ Telefon (uluslararası format: +90...)
- ✅ Posta kodu (zip)
- ✅ Tüm adres bileşenleri

**Alıcı Adresi İçin:**
- ✅ Telefon (uluslararası format)
- ⚠️ Posta kodu opsiyonel (ama tavsiye edilir)

### Telefon Formatı

✅ Doğru: `+905551234567`
❌ Yanlış: `05551234567`, `5551234567`, `0555 123 45 67`

### Sık Karşılaşılan Hatalar

**"uuid: incorrect UUID length"**
- Çözüm: Gönderici adresi oluşturun ve .env'e ekleyin

**"Phone field is required"**
- Çözüm: Telefon numarası + ile başlamalı

**"Zip code is required for sender"**
- Çözüm: Gönderici adresi oluştururken posta kodu girin

**"Teklifler henüz hazır değil"**
- Çözüm: 3-5 saniye bekleyip tekrar deneyin

---

## 📝 Database Şeması

Order modeline eklenen kargo alanları:

```prisma
model Order {
  // ... mevcut alanlar
  
  // Geliver Cargo Details
  geliverShipmentId     String?
  geliverTransactionId  String?
  geliverOfferId        String?
  cargoProvider         String?
  cargoTrackingUrl      String?
  cargoTrackingNumber   String?
  cargoBarcode          String?
  cargoLabelUrl         String?
  cargoResponsiveLabelUrl String?
  cargoCreatedAt        DateTime?
}
```

---

## 🆘 Sorun Giderme

### Log Kontrolü

Sunucu terminalinde Geliver hatalarını görebilirsiniz:
```
liver createShipment error: GeliverError: ...
```

### Activity Log

Admin panelde tüm kargo işlemleri loglanır:
- Gönderi oluşturma
- Teklif kabul
- Webhook güncellemeleri

### Test Adımları

1. **Gönderici adresi kontrolü:**
   ```bash
   # .env dosyasında var mı?
   cat .env | grep GELIVER_SENDER
   ```

2. **Token kontrolü:**
   ```bash
   # Token geçerli mi?
   curl https://api.geliver.io/api/v1/test \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Test gönderisi:**
   - Admin panelden küçük bir test siparişi oluşturun
   - Kargo gönderisi oluşturmayı deneyin
   - Hataları terminal'den takip edin

---

## 📚 Daha Fazla Bilgi

- **Geliver Dökümantasyon**: https://docs.geliver.io
- **Geliver Dashboard**: https://app.geliver.io
- **SDK GitHub**: https://github.com/geliver/sdk

---

**Hazırlayan:** GitHub Copilot  
**Tarih:** 4 Aralık 2025  
**Versiyon:** 1.0
