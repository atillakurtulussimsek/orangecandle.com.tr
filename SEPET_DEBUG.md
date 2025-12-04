# Sepet Özel Teklif Debugging Guide

## Problem
Ürün detay sayfasında özel teklif görünüyor ancak sepete eklendiğinde özel teklife göre fiyatlandırma görünmüyor.

## Çözüm Adımları

### 1. handleAddToCart Fonksiyonu Güncellendi
**Dosya:** `src/app/products/[slug]/page.tsx`

**Değişiklikler:**
- ✅ `originalPrice` artık her zaman set ediliyor (özel teklif olsun ya da olmasın)
- ✅ Özel teklif varsa `originalPrice` ürünün gerçek fiyatı olarak ayarlanıyor
- ✅ `price` özel teklif sonrası indirimli fiyat olarak ayarlanıyor
- ✅ Tüm özel teklif bilgileri (discountPercent, discountAmount, buyQuantity, getQuantity) cart item'a ekleniyor

### 2. Sepet Görünümü Zaten Hazırdı
**Dosya:** `src/app/cart/page.tsx`

- ✅ `item.personalOfferId` kontrolü yapıyor
- ✅ Mor renk ile özel teklif fiyatını gösteriyor
- ✅ Original fiyatı üstü çizili gösteriyor
- ✅ Tasarruf miktarını gösteriyor

### 3. CartContext Hesaplamaları Zaten Doğruydu
**Dosya:** `src/contexts/CartContext.tsx`

- ✅ `getSubtotal()` - originalPrice kullanarak hesaplıyor
- ✅ `getDiscount()` - Özel teklif indirimlerini doğru hesaplıyor
- ✅ `getTotal()` - subtotal - discount

## Test Adımları

### Adım 1: Mevcut Sepeti Temizle
1. Tarayıcı console'u aç (F12)
2. Console'a şunu yaz:
   ```javascript
   localStorage.removeItem('cart');
   location.reload();
   ```

### Adım 2: Giriş Yap
1. Özel teklif görmek için kullanıcı girişi yap
2. `/login` sayfasına git
3. Kullanıcı bilgileriyle giriş yap

### Adım 3: Özel Teklifli Ürün Bul
1. Ana sayfaya git
2. Özel teklif olan bir ürünü bul (mor "Size Özel Teklif" rozeti olmalı)
3. Ürün detay sayfasına git

### Adım 4: Ürünü Sepete Ekle
1. Miktar seç
2. "Sepete Ekle" butonuna tıkla
3. Sağ üstteki sepet ikonuna tıkla (CartSidebar açılır)

### Adım 5: CartSidebar'da Kontrol Et
**Beklenen Görünüm:**
- ✅ "🎁 Size Özel" badge'i görünmeli
- ✅ Fiyat MOR renkte olmalı
- ✅ Üstü çizili original fiyat görünmeli
- ✅ "Kampanya İndirimi" satırı mor arka plan ile görünmeli

### Adım 6: Sepet Sayfasını Kontrol Et
1. "Sepete Git" butonuna tıkla veya `/cart` sayfasına git

**Beklenen Görünüm:**
- ✅ Ürün fiyatı MOR renkte olmalı
- ✅ Üstü çizili original fiyat görünmeli
- ✅ Yeşil renkte indirim detayı (örn: "%20 indirim - ₺40.00 tasarruf") görünmeli
- ✅ Sipariş özetinde "Özel Kampanya İndirimi" mor arka plan ile görünmeli
- ✅ İndirim tutarı doğru hesaplanmalı

## Debugging Console Commands

### Cart İçeriğini Kontrol Et
```javascript
// LocalStorage'daki sepeti görüntüle
console.log('Cart:', JSON.parse(localStorage.getItem('cart')));
```

### Belirli Bir Ürünü İncele
```javascript
const cart = JSON.parse(localStorage.getItem('cart'));
const item = cart[0]; // İlk ürün
console.log('Product ID:', item.productId);
console.log('Price:', item.price);
console.log('Original Price:', item.originalPrice);
console.log('Personal Offer ID:', item.personalOfferId);
console.log('Offer Type:', item.offerType);
console.log('Discount Percent:', item.discountPercent);
console.log('Discount Amount:', item.discountAmount);
```

### Hesaplamaları Test Et
```javascript
const cart = JSON.parse(localStorage.getItem('cart'));
const subtotal = cart.reduce((total, item) => {
  const price = item.originalPrice || item.price;
  return total + price * item.quantity;
}, 0);

const discount = cart.reduce((total, item) => {
  if (!item.personalOfferId) return total;
  
  if (item.offerType === 'PERCENTAGE_DISCOUNT' && item.discountPercent) {
    return total + (item.originalPrice || item.price) * (item.discountPercent / 100) * item.quantity;
  }
  
  if (item.offerType === 'FIXED_DISCOUNT' && item.discountAmount) {
    return total + item.discountAmount * item.quantity;
  }
  
  return total;
}, 0);

console.log('Subtotal:', subtotal);
console.log('Discount:', discount);
console.log('Total:', subtotal - discount);
```

## Örnek Cart Item Yapısı

### Özel Teklifsiz Normal Ürün
```json
{
  "id": "product-123-1732972800000",
  "productId": "product-123",
  "name": "Lavanta Mum",
  "slug": "lavanta-mum",
  "price": 199.99,
  "originalPrice": 199.99,
  "image": "/uploads/products/lavanta-mum.jpg",
  "quantity": 1,
  "stock": 50,
  "stockTracking": true,
  "allowBackorder": false
}
```

### Yüzde İndirimli Özel Teklif
```json
{
  "id": "product-123-1732972800000",
  "productId": "product-123",
  "name": "Lavanta Mum",
  "slug": "lavanta-mum",
  "price": 159.99,
  "originalPrice": 199.99,
  "image": "/uploads/products/lavanta-mum.jpg",
  "quantity": 1,
  "stock": 50,
  "stockTracking": true,
  "allowBackorder": false,
  "personalOfferId": "offer-456",
  "offerType": "PERCENTAGE_DISCOUNT",
  "discountPercent": 20
}
```

### Sabit Tutar İndirimli Özel Teklif
```json
{
  "id": "product-123-1732972800000",
  "productId": "product-123",
  "name": "Lavanta Mum",
  "slug": "lavanta-mum",
  "price": 149.99,
  "originalPrice": 199.99,
  "image": "/uploads/products/lavanta-mum.jpg",
  "quantity": 1,
  "stock": 50,
  "stockTracking": true,
  "allowBackorder": false,
  "personalOfferId": "offer-456",
  "offerType": "FIXED_DISCOUNT",
  "discountAmount": 50
}
```

### N Al M Öde Kampanyası
```json
{
  "id": "product-123-1732972800000",
  "productId": "product-123",
  "name": "Lavanta Mum",
  "slug": "lavanta-mum",
  "price": 199.99,
  "originalPrice": 199.99,
  "image": "/uploads/products/lavanta-mum.jpg",
  "quantity": 3,
  "stock": 50,
  "stockTracking": true,
  "allowBackorder": false,
  "personalOfferId": "offer-456",
  "offerType": "BUY_X_GET_Y",
  "buyQuantity": 2,
  "getQuantity": 1
}
```

## Olası Sorunlar ve Çözümler

### Problem 1: Sepette Özel Teklif Görünmüyor
**Sebep:** localStorage cache
**Çözüm:** 
```javascript
localStorage.removeItem('cart');
location.reload();
```

### Problem 2: Original Price Gösterilmiyor
**Sebep:** `originalPrice` undefined
**Çözüm:** ✅ handleAddToCart'ta her zaman set ediliyor artık

### Problem 3: İndirim Hesaplaması Yanlış
**Sebep:** CartContext'te yanlış field kullanılıyor
**Çözüm:** ✅ Düzeltildi - `item.originalPrice || item.price` kullanıyor

### Problem 4: Kampanya Badge'i Görünmüyor
**Sebep:** `personalOfferId` eksik
**Çözüm:** ✅ handleAddToCart'ta personalOfferId ekleniyor

## Kontrol Listesi

Sepete özel teklifli ürün ekledikten sonra:

### CartSidebar (Header'daki sepet)
- [ ] "🎁 Size Özel" badge'i görünüyor mu?
- [ ] Fiyat MOR renkte mi?
- [ ] Original fiyat üstü çizili mi?
- [ ] "Kampanya İndirimi" mor arka plan ile mi?

### Sepet Sayfası (/cart)
- [ ] Ürün kartında "🎁 Size Özel Teklif" badge'i var mı?
- [ ] Özel teklif tipi gösteriliyor mu? (örn: "%20 indirim")
- [ ] Fiyat MOR renkte mi?
- [ ] Original fiyat üstü çizili mi?
- [ ] Yeşil renkte tasarruf miktarı gösteriliyor mu?
- [ ] Sipariş özetinde "Özel Kampanya İndirimi" var mı?
- [ ] İndirim tutarı doğru hesaplanmış mı?

### Checkout Sayfası (/checkout)
- [ ] Sipariş özetinde "Özel Kampanya İndirimi" var mı?
- [ ] İndirim tutarı mor arka plan ile vurgulanmış mı?

## Test Senaryoları

### Senaryo 1: %20 İndirim
1. 200₺'lik ürüne %20 indirimli özel teklif
2. Sepete ekle
3. **Beklenen:**
   - Subtotal: 200₺
   - İndirim: 40₺
   - Total: 160₺
   - Görünen fiyat: 160₺ (mor)
   - Original: 200₺ (üstü çizili)

### Senaryo 2: 50₺ Sabit İndirim
1. 200₺'lik ürüne 50₺ indirimli özel teklif
2. Sepete ekle
3. **Beklenen:**
   - Subtotal: 200₺
   - İndirim: 50₺
   - Total: 150₺
   - Görünen fiyat: 150₺ (mor)
   - Original: 200₺ (üstü çizili)

### Senaryo 3: 2 Al 1 Bedava
1. 100₺'lik ürüne 2 al 1 bedava kampanyası
2. 3 adet sepete ekle
3. **Beklenen:**
   - Subtotal: 300₺
   - İndirim: 100₺ (1 ürün bedava)
   - Total: 200₺
   - Badge: "1 set - 1 ürün bedava"

## Sonuç

Tüm güncellemeler yapıldı. Eğer hala sorun varsa:

1. LocalStorage'ı temizle
2. Tarayıcıyı yenile
3. Yeniden giriş yap
4. Yeni bir ürün ekle
5. Console'dan cart içeriğini kontrol et

Sorun devam ederse bu dökümanı kullanarak debug yapabilirsiniz.
