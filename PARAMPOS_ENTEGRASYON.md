# ParamPOS Ödeme Entegrasyonu

## 📋 Genel Bakış

ParamPOS ödeme entegrasyonu SOAP/XML tabanlı olarak tamamlanmıştır. Sistem hem normal (Non-3D) hem de 3D Secure ödemeleri desteklemektedir.

## 🔧 Teknik Detaylar

### 1. ParamPOS Servisi (`src/lib/parampos.ts`)

**Özellikler:**
- SOAP/XML protokolü ile iletişim
- SHA1 + Base64 + ISO-8859-9 (Latin-5) hash algoritması
- Türk Lirası format desteği (1.234,56)
- Non-3D ve 3D Secure ödeme metotları
- İptal ve iade işlemleri

**Ana Metodlar:**
```typescript
// Normal ödeme (Non-3D)
processPayment(paymentData: PaymentRequest): Promise<PaymentResponse>

// 3D Secure başlatma
init3DSecurePayment(paymentData: PaymentRequest): Promise<PaymentResponse>

// 3D Secure tamamlama (callback sonrası)
complete3DSecurePayment(params: any): Promise<PaymentResponse>

// İşlem sorgulama
queryTransaction(orderId: string): Promise<any>

// İptal işlemi
cancelTransaction(orderId: string, transactionId: string): Promise<PaymentResponse>

// İade işlemi
refundTransaction(orderId: string, transactionId: string, amount: number): Promise<PaymentResponse>
```

### 2. HASH Algoritması

ParamPOS özel hash algoritması kullanır:

```typescript
// Hash verisi formatı
const hashData = `${CLIENT_CODE}${GUID}${taksit}${islemTutar}${toplamTutar}${siparisID}`;

// SHA1 + Latin-5 encoding + Base64
const buffer = Buffer.from(data, 'latin1');
const hash = crypto.createHash('sha1').update(buffer).digest('base64');
```

### 3. SOAP Request Formatı

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <TP_WMD_UCD xmlns="https://turkpos.com.tr/">
      <G>
        <CLIENT_CODE>10738</CLIENT_CODE>
        <CLIENT_USERNAME>Test</CLIENT_USERNAME>
        <CLIENT_PASSWORD>Test</CLIENT_PASSWORD>
      </G>
      <GUID>0c13d406-873b-403b-9c09-a5766840d98c</GUID>
      <KK_Sahibi>AD SOYAD</KK_Sahibi>
      <KK_No>5406675406675403</KK_No>
      <KK_SK_Ay>12</KK_SK_Ay>
      <KK_SK_Yil>26</KK_SK_Yil>
      <KK_CVC>000</KK_CVC>
      <Siparis_ID>ORD123456</Siparis_ID>
      <Islem_Tutar>100,00</Islem_Tutar>
      <Toplam_Tutar>100,00</Toplam_Tutar>
      <Islem_Hash>BASE64_HASH</Islem_Hash>
      <Islem_Guvenlik_Tip>NS</Islem_Guvenlik_Tip>
      <Basarili_URL>https://site.com/api/payment/callback</Basarili_URL>
      <Hata_URL>https://site.com/checkout?payment=failed</Hata_URL>
    </TP_WMD_UCD>
  </soap:Body>
</soap:Envelope>
```

## 🚀 API Endpoints

### 1. Ödeme İşleme (`/api/payment/process`)

**Method:** POST  
**Auth:** Bearer Token (JWT)

**Request Body:**
```json
{
  "orderId": "order-uuid",
  "amount": 100.50,
  "cardNumber": "5406675406675403",
  "cardName": "AHMET YILMAZ",
  "expiryMonth": "12",
  "expiryYear": "26",
  "cvv": "123",
  "installment": 1,
  "use3DSecure": false
}
```

**Response (Non-3D Success):**
```json
{
  "success": true,
  "message": "Ödeme başarıyla tamamlandı",
  "transactionId": "TRX123456",
  "orderId": "order-uuid"
}
```

**Response (3D Secure):**
```json
{
  "success": true,
  "redirectUrl": "https://testposws.param.com.tr/...",
  "requires3DSecure": true
}
```

### 2. 3D Secure Callback (`/api/payment/callback`)

**Methods:** POST, GET  
**Content-Type:** application/x-www-form-urlencoded, application/json, query params

ParamPOS 3D doğrulama sonrası bu endpoint'e yönlendirir.

**ParamPOS Gönderdiği Parametreler:**
- `Siparis_ID`: Sipariş numarası
- `Sonuc`: Sonuç kodu (1=başarılı)
- `Sonuc_Str`: Sonuç açıklaması
- `UCD_MD`: Transaction ID
- `Islem_GUID`: İşlem GUID

**Flow:**
1. ParamPOS'tan gelen parametreleri al
2. `Sonuc !== '1' ` ise hata sayfasına yönlendir
3. `Sonuc === '1'` ise `TP_WMD_Pay` ile ödemeyi tamamla
4. Başarılı ise `/order/success` sayfasına yönlendir

## 💳 Kart Formatları

### Kart Numarası
- 16 haneli
- Boşluksuz gönderilmeli: `5406675406675403`

### Son Kullanma Tarihi
- Ay: `MM` format (01-12)
- Yıl: `YY` format (son 2 hane)
- Örnek: Aralık 2026 → `12` + `26`

### CVV
- 3-4 haneli
- String olarak gönderilmeli

## 🔐 Test Kartları

ParamPOS test ortamı için:

**Başarılı İşlem:**
- Kart No: `5406675406675403`
- CVV: `000`
- Son Kullanma: Gelecek herhangi bir tarih

**Başarısız İşlem:**
- Kart No: `4355084355084358`
- CVV: `000`

## 🔄 Ödeme Akışı

### Normal Ödeme (Non-3D)

```
1. Kullanıcı checkout sayfasında kart bilgilerini girer
2. Frontend → POST /api/orders (sipariş oluştur)
3. Frontend → POST /api/payment/process (use3DSecure: false)
4. Backend → ParamPOS TP_WMD_UCD (Non-3D)
5. ParamPOS anında sonuç döner
6. Başarılı ise:
   - Payment kaydı oluştur (PAID)
   - Order durumu güncelle (PROCESSING)
   - Stokları azalt
   - Sepeti temizle
   - /order/success sayfasına yönlendir
```

### 3D Secure Ödeme

```
1. Kullanıcı checkout sayfasında kart bilgilerini girer
2. Frontend → POST /api/orders (sipariş oluştur)
3. Frontend → POST /api/payment/process (use3DSecure: true)
4. Backend → ParamPOS TP_WMD_UCD (3D)
5. ParamPOS 3D URL döner
6. Frontend → 3D URL'e yönlendir
7. Kullanıcı banka 3D sayfasında doğrulama yapar
8. Banka → ParamPOS callback
9. ParamPOS → /api/payment/callback (POST/GET)
10. Backend → ParamPOS TP_WMD_Pay (ödemeyi tamamla)
11. Başarılı ise:
    - Payment kaydı güncelle (PAID)
    - Order durumu güncelle (PROCESSING)
    - Stokları azalt
    - /order/success sayfasına yönlendir
```

## 📊 Veritabanı Yapısı

### Payment Model
```prisma
model Payment {
  id            String   @id @default(cuid())
  orderId       String
  order         Order    @relation(fields: [orderId], references: [id])
  amount        Float
  status        PaymentStatus
  method        String
  transactionId String?
  paymentData   Json?
  failureReason String?
  createdAt     DateTime @default(now())
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
  CANCELLED
}
```

### Order İlişkisi
```prisma
model Order {
  id            String        @id @default(cuid())
  orderNumber   String        @unique
  userId        String
  paymentStatus PaymentStatus @default(PENDING)
  orderStatus   OrderStatus   @default(PENDING)
  payments      Payment[]
  // ...
}
```

## ⚙️ Environment Variables

```.env
# ParamPOS Test Credentials
PARAMPOS_CLIENT_CODE=10738
PARAMPOS_CLIENT_USERNAME=Test
PARAMPOS_CLIENT_PASSWORD=Test
PARAMPOS_GUID=0c13d406-873b-403b-9c09-a5766840d98c
PARAMPOS_URL=https://testposws.param.com.tr/turkpos.ws/service_turkpos_prod.asmx

# Production için
# PARAMPOS_URL=https://posws.param.com.tr/turkpos.ws/service_turkpos_prod.asmx
```

## 🐛 Hata Kodları

ParamPOS yaygın hata kodları:

| Kod | Açıklama |
|-----|----------|
| 00  | Başarılı işlem |
| 01  | Kart sahibi ile bankayı arayınız |
| 02  | Özel kod girişi gerekli |
| 03  | Geçersiz üye |
| 05  | İşlem onaylanmadı |
| 12  | Geçersiz işlem |
| 13  | Geçersiz tutar |
| 14  | Geçersiz kart numarası |
| 30  | Format hatası |
| 51  | Yetersiz bakiye |
| 54  | Kartın son kullanma tarihi geçmiş |
| 57  | Kart sahibine kapalı işlem |

## 📝 Önemli Notlar

1. **Tutar Formatı:** ParamPOS Türk Lirası formatını kullanır:
   - JavaScript: `100.50`
   - ParamPOS: `100,50`
   - Formatı `formatAmount()` fonksiyonu halleder

2. **Hash Encoding:** SHA1 hash'i oluştururken mutlaka `latin1` (ISO-8859-9) encoding kullanılmalı

3. **SOAP vs REST:** ParamPOS SOAP/XML kullanır, REST API yok

4. **Callback URL:** Production'da HTTPS zorunlu, test ortamında HTTP da çalışabilir

5. **3D Secure Timeout:** 3D doğrulama için maksimum 5 dakika süre var

6. **İptal/İade Süresi:** 
   - İptal: İşlem gününde saat 00:00'a kadar
   - İade: İşlem günü sonrasında

## 🧪 Test Senaryoları

### Test 1: Normal Ödeme (Non-3D) - Başarılı
```bash
curl -X POST http://localhost:3000/api/payment/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-123",
    "amount": 100,
    "cardNumber": "5406675406675403",
    "cardName": "TEST USER",
    "expiryMonth": "12",
    "expiryYear": "26",
    "cvv": "000",
    "use3DSecure": false
  }'
```

**Beklenen Sonuç:** `success: true`, payment kaydı oluşturuldu, order durumu PROCESSING

### Test 2: 3D Secure Ödeme - Başarılı
1. Checkout sayfasında "3D Secure" seçeneğini aktifleştir
2. Test kartı bilgilerini gir
3. 3D doğrulama sayfasına yönlendirildiğini kontrol et
4. Doğrulamayı tamamla
5. `/order/success` sayfasına yönlendirildiğini kontrol et

### Test 3: Başarısız Ödeme
Test kartı: `4355084355084358` kullan
**Beklenen Sonuç:** Hata mesajı gösterilir, payment kaydı FAILED

## 🔍 Debugging

### SOAP Request/Response Loglama

`src/lib/parampos.ts` içinde:

```typescript
private async sendSOAPRequest(method: string, params: any): Promise<any> {
  const xml = this.createXMLRequest(method, params);
  
  console.log('🚀 SOAP Request:', method);
  console.log('📄 XML:', xml);

  const response = await fetch(this.config.baseUrl, { /* ... */ });
  const responseText = await response.text();
  
  console.log('📥 SOAP Response:', responseText);
  
  return this.parseXMLResponse(responseText, method);
}
```

### Database Queries

Payment durumlarını kontrol et:
```sql
SELECT 
  p.id, 
  p.status, 
  p.amount, 
  p.transactionId,
  o.orderNumber,
  o.orderStatus
FROM Payment p
JOIN Order o ON p.orderId = o.id
ORDER BY p.createdAt DESC
LIMIT 10;
```

## 📚 Kaynaklar

- ParamPOS Test Ortamı: `https://testposws.param.com.tr`
- ParamPOS Dökümanları: `modules/parampos/` klasöründeki JS dosyaları referans alınmıştır
- WSDL URL: `https://testposws.param.com.tr/turkpos.ws/service_turkpos_prod.asmx?wsdl`

## ✅ Kontrol Listesi

- [x] ParamPOS servisi oluşturuldu (`src/lib/parampos.ts`)
- [x] Ödeme API endpoint'i (`/api/payment/process`)
- [x] 3D Secure callback handler (`/api/payment/callback`)
- [x] Başarılı sipariş sayfası (`/order/success`)
- [x] Checkout sayfası entegrasyonu
- [x] SHA1 + Latin-5 hash algoritması
- [x] SOAP/XML request/response handling
- [x] Türk Lirası format desteği
- [x] Test kartları ve senaryolar
- [ ] Production environment variables
- [ ] Email notifications
- [ ] Admin order management

## 🚧 Yapılacaklar

1. **3D Secure UI:** Checkout sayfasında 3D Secure seçeneği ekle
2. **Email Notifications:** Sipariş onay emaili gönder
3. **Admin Panel:** Siparişleri görüntüleme, iptal/iade yapabilme
4. **Error Handling:** Daha detaylı hata mesajları
5. **Retry Logic:** Başarısız ödemeleri tekrar deneme
6. **Webhook:** ParamPOS webhook entegrasyonu (opsiyonel)
