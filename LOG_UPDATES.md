# Activity Logging Güncellemeleri

## Performans Optimizasyonu
- `logActivity` fonksiyonu artık **non-blocking** (fire-and-forget)
- `setImmediate` kullanılarak ana akış yavaşlatılmıyor
- Loglama hataları sessizce yakalanıyor, uygulama etkilenmiyor

## Eklenen Loglar

### ✅ Tamamlanan
1. **Auth API** (`/api/auth/login`)
   - LOGIN / ADMIN_LOGIN
   - Failed login attempts

2. **Cart API** (`/api/cart`)
   - CART_VIEW (sepet görüntüleme)
   - CART_ADD (yeni ürün ekleme)
   - CART_UPDATE (miktar güncelleme)
   - CART_CLEAR (sepeti temizleme)

3. **Wishlist API** (`/api/wishlist`)
   - WISHLIST_VIEW (import eklendi, kod eklenmeli)
   - WISHLIST_ADD (kod eklenmeli)
   - WISHLIST_REMOVE (kod eklenmeli)

4. **Admin Products API** (`/api/admin/products`)
   - ADMIN_PRODUCT_CREATE
   - ADMIN_PRODUCT_UPDATE
   - ADMIN_PRODUCT_DELETE

### 🔄 Eklenecek API'ler

#### Yüksek Öncelik
- `/api/addresses` (ADDRESS_ADD, ADDRESS_UPDATE, ADDRESS_DELETE, ADDRESS_SET_DEFAULT)
- `/api/cart/[id]` (CART_REMOVE - tek ürün silme)
- `/api/orders` (ORDER_CREATE, ORDER_VIEW, ORDER_CANCEL)
- `/api/payment/*` (PAYMENT_INITIATED, PAYMENT_SUCCESS, PAYMENT_FAILED)

#### Orta Öncelik
- `/api/admin/categories` (ADMIN_CATEGORY_CREATE, UPDATE, DELETE)
- `/api/admin/orders` (ADMIN_ORDER_VIEW, ADMIN_ORDER_UPDATE_STATUS, ADMIN_ORDER_CANCEL)
- `/api/admin/customers` (ADMIN_CUSTOMER_VIEW, ADMIN_CUSTOMER_UPDATE, DELETE, ROLE_CHANGE)
- `/api/admin/personal-offers` (ADMIN_OFFER_CREATE, UPDATE, DELETE)

#### Düşük Öncelik
- `/api/upload` (FILE_UPLOAD)
- `/api/categories` (CATEGORY_VIEW)
- `/api/products/[slug]` (PRODUCT_VIEW)

## Metadata Örnekleri

Her log için uygun metadata:

```typescript
// Cart Add
metadata: { 
  productId, 
  productName, 
  quantity, 
  price, 
  totalPrice 
}

// Order Create
metadata: {
  orderId,
  orderNumber,
  total,
  itemCount,
  paymentMethod,
  shippingAddressId
}

// Address Add
metadata: {
  addressId,
  title,
  city,
  district,
  isDefault,
  isBillingAddress
}

// Admin Product Update
metadata: {
  productId,
  changes: { ...updatedFields }
}
```

## Veritabanı Güncellemeleri

Eklenen action'lar:
- `CART_VIEW`
- `WISHLIST_VIEW`

Prisma generate gerekli!
