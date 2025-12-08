# Kargo Durumu Otomatik Güncelleme Sistemi

## 📋 Genel Bakış

Bu sistem, Geliver API üzerinden kargo durumlarını otomatik olarak kontrol eder ve sipariş durumlarını günceller. Sistem her 5 dakikada bir çalışır ve PENDING veya PROCESSING durumundaki siparişleri kontrol eder.

## 🔄 Çalışma Mantığı

### 1. Kontrol Edilen Siparişler
- **Durum**: PENDING veya PROCESSING
- **Kriter**: `geliverShipmentId` dolu (kargo gönderisi oluşturulmuş)

### 2. Durum Güncellemeleri

| Geliver Status | Sipariş Durumu | Açıklama |
|---------------|----------------|-----------|
| `PICKED_UP` | `PENDING/PROCESSING` → `SHIPPED` | Kargo firmaya teslim edildi |
| `IN_TRANSIT` | `PENDING/PROCESSING` → `SHIPPED` | Kargo yolda |
| `OUT_FOR_DELIVERY` | `PENDING/PROCESSING` → `SHIPPED` | Teslimat için yola çıktı |
| `DELIVERED` | `ANY` → `DELIVERED` | Müşteriye teslim edildi |
| `RETURNED` | `ANY` → `CANCELLED` | Kargo iade edildi |
| `FAILED` | Değişmez | Teslimat başarısız (manuel kontrol gerekli) |

### 3. Konsol Logları

Sistem çalışırken detaylı loglar üretir:

```
🔄 ========================================
⏰ CRON JOB BAŞLADI: 2025-12-05T10:00:00.000Z
🔄 ========================================

📦 Kontrol edilecek sipariş sayısı: 3

📋 Sipariş: ORD-1764696200388-CJPFJNDHS
   Mevcut Durum: PROCESSING
   Shipment ID: 9f6ee1cd-bae2-4554-8945-a8d5d2a4f289
   📍 Geliver Status: IN_TRANSIT
   📍 Sub Status: Şubeden çıkış yapıldı
   🔄 Durum güncelleniyor: PROCESSING → SHIPPED
   ✅ Sipariş durumu güncellendi!

🔄 ========================================
✅ CRON JOB TAMAMLANDI
📊 İstatistikler:
   - Kontrol edilen: 3
   - Güncellenen: 1
   - Hata: 0
   - Süre: 2458ms
🔄 ========================================
```

## 🚀 Kullanım

### Local Development (Önerilen)

1. **Dev server'ı başlat:**
```bash
npm run dev
```

2. **Ayrı bir terminal'de cron job'u başlat:**
```bash
npm run cron:cargo
```

3. **Çıktı:**
```
🎯 Kargo Durumu Otomatik Güncelleme Başlatıldı
📍 API URL: http://localhost:3000/api/cron/update-cargo-status
⏱️  Çalışma Aralığı: 5 dakika

🚀 Cron Job Çalıştırılıyor (1. çalışma) - 5.12.2025 10:00:00
✅ Cron job başarılı: { stats: { checked: 3, updated: 1, errors: 0 } }
⏰ Sonraki çalışma: 5.12.2025 10:05:00
```

4. **Durdurmak için:** `Ctrl+C`

### Manuel Test

Tek seferlik manuel test için:

```bash
curl http://localhost:3000/api/cron/update-cargo-status
```

### Production (Vercel)

Vercel'de otomatik çalışır. `vercel.json` dosyası sayesinde her 5 dakikada bir tetiklenir.

**Vercel Dashboard'da kontrol:**
1. Project Settings → Cron Jobs
2. `/api/cron/update-cargo-status` endpoint'i göreceksiniz
3. "Run Now" ile manuel tetikleyebilirsiniz

### Production (Plesk / Diğer)

Plesk'te cron job oluşturun:

1. **Cron Jobs** → **Add Task**
2. **Command:**
```bash
curl -X GET https://orangecandle.com.tr/api/cron/update-cargo-status
```
3. **Schedule:** `*/5 * * * *` (her 5 dakika)

## 📊 API Endpoint

### GET `/api/cron/update-cargo-status`

**Response:**
```json
{
  "success": true,
  "message": "Kargo durumları güncellendi",
  "stats": {
    "checked": 5,
    "updated": 2,
    "errors": 0,
    "duration": 3245
  },
  "updates": [
    {
      "orderNumber": "ORD-123",
      "oldStatus": "PROCESSING",
      "newStatus": "SHIPPED",
      "cargoStatus": "IN_TRANSIT",
      "cargoSubStatus": "Şubeden çıkış yapıldı"
    }
  ]
}
```

## ⚙️ Yapılandırma

### Çalışma Aralığını Değiştirme

**Local (scripts/cargo-cron.js):**
```javascript
const CRON_INTERVAL = 5 * 60 * 1000; // 5 dakika
```

**Production (vercel.json):**
```json
"schedule": "*/5 * * * *"  // Her 5 dakika
"schedule": "*/10 * * * *" // Her 10 dakika
"schedule": "0 * * * *"    // Her saat başı
```

### Rate Limiting

API çağrıları arasında 500ms bekleme var (Geliver API limitleri için):

```typescript
await new Promise(resolve => setTimeout(resolve, 500));
```

## 🔍 Troubleshooting

### Cron Job Çalışmıyor

1. **Local'de test et:**
```bash
npm run cron:cargo
```

2. **API'yi manuel çağır:**
```bash
curl http://localhost:3000/api/cron/update-cargo-status
```

3. **Konsol loglarını kontrol et** - detaylı hata mesajları görürsünüz

### Durum Güncellenmiyor

1. **Sipariş kriterlerini kontrol et:**
   - Sipariş durumu PENDING veya PROCESSING mi?
   - `geliverShipmentId` dolu mu?

2. **Geliver API durumunu kontrol et:**
   - Tracking endpoint'i çalışıyor mu?
   - Token geçerli mi?

3. **Manuel tracking test et:**
```bash
curl "http://localhost:3000/api/admin/shipping/track?shipmentId=xxx" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 📈 İzleme ve Monitoring

### Production Logs

**Vercel:**
- Dashboard → Project → Logs
- Cron job çalışmalarını göreceksiniz

**Plesk:**
- Cron Jobs → View Logs

### Custom Monitoring (İsteğe Bağlı)

Webhook veya email notification ekleyebilirsiniz:

```typescript
// route.ts içinde
if (updatedCount > 0) {
  // Slack webhook
  await fetch('SLACK_WEBHOOK_URL', {
    method: 'POST',
    body: JSON.stringify({
      text: `🚚 ${updatedCount} sipariş durumu güncellendi`
    })
  });
}
```

## ⚠️ Önemli Notlar

1. **İlk Çalıştırma**: İlk kez çalıştığında tüm uygun siparişleri kontrol eder
2. **Rate Limiting**: Geliver API'ye aşırı yük bindirmemek için her istek arası 500ms bekler
3. **Error Handling**: Tek bir sipariş hatası tüm job'u durdurmaz
4. **Idempotent**: Aynı siparişi birden fazla kez kontrol etmek güvenlidir

## 🎯 Sonraki Adımlar

- [ ] Email/SMS bildirimleri ekle (durum değişikliğinde müşteriye)
- [ ] Webhook entegrasyonu (harici sistemlere bildirim)
- [ ] Dashboard widget (son cron çalışma bilgisi)
- [ ] Failed deliveries için otomatik retry mekanizması
