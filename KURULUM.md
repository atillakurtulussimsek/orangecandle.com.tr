# Orange Candle E-Ticaret - Kurulum Rehberi

Modern Next.js 14 ile geliştirilmiş, MySQL veritabanı ve ParamPOS entegrasyonlu e-ticaret platformu.

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükleyin

```powershell
npm install
```

### 2. Çevre Değişkenlerini Ayarlayın

`.env.example` dosyasını `.env` olarak kopyalayın:

```powershell
copy .env.example .env
```

`.env` dosyasını düzenleyin ve bilgilerinizi girin:

```env
# MySQL Veritabanı
DATABASE_URL="mysql://kullanici:sifre@localhost:3306/orangecandle"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=rastgele-gizli-anahtar-buraya-yazin

# ParamPOS Bilgileri
PARAMPOS_CLIENT_CODE=your-code
PARAMPOS_CLIENT_USERNAME=your-username
PARAMPOS_CLIENT_PASSWORD=your-password
PARAMPOS_MODE=TEST
PARAMPOS_GUID=your-guid
```

### 3. MySQL Veritabanı Oluşturun

MySQL'e bağlanın ve veritabanını oluşturun:

```sql
CREATE DATABASE orangecandle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Veritabanı Tablolarını Oluşturun

```powershell
npx prisma migrate dev --name init
```

### 5. Prisma Client Oluşturun

```powershell
npx prisma generate
```

### 6. Geliştirme Sunucusunu Başlatın

```powershell
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açın.

## 📁 Proje Yapısı

```
orangecandle.com.tr/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   │   ├── products/      # Ürün API'ları
│   │   │   ├── categories/    # Kategori API'ları
│   │   │   ├── cart/          # Sepet API'ları
│   │   │   ├── orders/        # Sipariş API'ları
│   │   │   └── payment/       # Ödeme API'ları
│   │   ├── layout.tsx         # Ana layout (Header/Footer)
│   │   ├── page.tsx           # Ana sayfa
│   │   └── globals.css        # Global stiller
│   ├── components/            # React bileşenleri
│   │   ├── Header.tsx         # Site başlığı
│   │   ├── Footer.tsx         # Site altbilgisi
│   │   ├── ProductCard.tsx    # Ürün kartı
│   │   ├── ProductGrid.tsx    # Ürün listesi
│   │   ├── CategoryGrid.tsx   # Kategori grid
│   │   ├── HeroSlider.tsx     # Ana slider
│   │   └── Features.tsx       # Özellikler bölümü
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   └── parampos.ts        # ParamPOS servis
│   └── types/                 # TypeScript tipleri
├── prisma/
│   └── schema.prisma          # Veritabanı şeması
├── mioca/                     # Orijinal tema (HTML/CSS/JS)
└── public/                    # Statik dosyalar
```

## ✨ Hazır Özellikler

### 🎨 Kullanıcı Arayüzü
- ✅ Modern ve responsive tasarım
- ✅ Header ile navigasyon
- ✅ Footer ile bilgilendirme
- ✅ Hero slider (Swiper.js)
- ✅ Ürün kartları
- ✅ Kategori grid
- ✅ Özellikler bölümü
- ✅ Newsletter formu

### 🛒 E-Ticaret Özellikleri
- ✅ Ürün listeleme
- ✅ Kategori bazlı filtreleme
- ✅ Sepet yönetimi
- ✅ Sipariş oluşturma
- ✅ Stok takibi

### 💳 Ödeme
- ✅ ParamPOS entegrasyonu
- ✅ 3D Secure desteği
- ✅ Kredi kartı ödemeleri
- ✅ Havale/EFT seçeneği
- ✅ Kapıda ödeme

### 🗄️ Veritabanı
- ✅ MySQL + Prisma ORM
- ✅ User (Kullanıcılar)
- ✅ Address (Adresler)
- ✅ Category (Kategoriler)
- ✅ Product (Ürünler)
- ✅ Order (Siparişler)
- ✅ OrderItem (Sipariş detayları)
- ✅ CartItem (Sepet)
- ✅ Review (Yorumlar)

## 🔌 API Endpoints

### Ürünler
- `GET /api/products` - Tüm ürünleri listele
- `GET /api/products?category=slug` - Kategoriye göre filtrele
- `GET /api/products?featured=true` - Öne çıkan ürünler
- `GET /api/products/[slug]` - Ürün detayı
- `POST /api/products` - Yeni ürün (Admin)

### Kategoriler
- `GET /api/categories` - Tüm kategoriler
- `POST /api/categories` - Kategori ekle (Admin)

### Sepet
- `GET /api/cart` - Sepeti getir
- `POST /api/cart` - Ürün ekle
- `PUT /api/cart/[id]` - Miktar güncelle
- `DELETE /api/cart/[id]` - Ürün sil

### Siparişler
- `GET /api/orders` - Siparişleri listele
- `POST /api/orders` - Sipariş oluştur

## 🚢 Production Deployment

### Build Alma

```powershell
npm run build
```

### Production Modda Çalıştırma

```powershell
npm start
```

### Plesk'te Kurulum

1. **Node.js Uygulaması Oluşturun**
   - Node.js 18.x seçin
   - Application mode: Production
   - Application root: `/httpdocs`

2. **Dosyaları Yükleyin**
   - Tüm proje dosyalarını FTP ile yükleyin

3. **Bağımlılıkları Kurun**
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npm run build
   ```

4. **PM2 ile Başlatın**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

## 📝 Notlar

- Geliştirme sırasında `npm run dev` kullanın
- Production'da mutlaka `.env` dosyasını güncelleyin
- ParamPOS test modundan production'a geçmeyi unutmayın
- Düzenli olarak veritabanı yedekleme yapın

## 🆘 Sorun Giderme

### Prisma Client Hatası
```powershell
npx prisma generate
```

### Veritabanı Bağlantı Hatası
- `.env` dosyasındaki `DATABASE_URL` kontrol edin
- MySQL servisinin çalıştığından emin olun

### Build Hatası
```powershell
# Cache temizle
Remove-Item -Recurse -Force .next
npm run build
```

## 📞 Destek

Sorularınız için: info@orangecandle.com.tr
