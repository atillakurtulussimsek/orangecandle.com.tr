# Orange Candle E-Ticaret Projesi

Modern, güvenli ve ölçeklenebilir bir e-ticaret platformu.

## 🚀 Teknolojiler

- **Next.js 14** - React framework (App Router)
- **TypeScript** - Tip güvenliği
- **MySQL** - İlişkisel veritabanı
- **Prisma ORM** - Modern veritabanı yönetimi
- **ParamPOS** - Türk ödeme gateway entegrasyonu
- **NextAuth.js** - Kimlik doğrulama
- **Tailwind CSS** - Utility-first CSS framework

## 📋 Gereksinimler

- Node.js 18.x veya üzeri
- MySQL 8.0 veya üzeri
- npm veya yarn

## 🛠️ Kurulum

### 1. Projeyi İndirin

```bash
cd orangecandle.com.tr
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın

`.env.example` dosyasını `.env` olarak kopyalayın:

```bash
copy .env.example .env
```

`.env` dosyasını düzenleyin:

```env
DATABASE_URL="mysql://kullanici:sifre@localhost:3306/orangecandle"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=gizli-anahtar-buraya

# ParamPOS bilgilerinizi ekleyin
PARAMPOS_CLIENT_CODE=xxxx
PARAMPOS_CLIENT_USERNAME=xxxx
PARAMPOS_CLIENT_PASSWORD=xxxx
PARAMPOS_MODE=TEST
PARAMPOS_GUID=xxxx
```

### 4. MySQL Veritabanı Oluşturun

```sql
CREATE DATABASE orangecandle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Veritabanı Tablolarını Oluşturun

```bash
npx prisma migrate dev --name init
```

### 6. Prisma Client'ı Oluşturun

```bash
npx prisma generate
```

### 7. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açın.

## 📦 Production Build

```bash
npm run build
npm start
```

## 🏗️ Proje Yapısı

```
orangecandle.com.tr/
├── prisma/
│   └── schema.prisma          # Veritabanı şeması
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── products/      # Ürün API'ları
│   │   │   ├── categories/    # Kategori API'ları
│   │   │   ├── cart/          # Sepet API'ları
│   │   │   ├── orders/        # Sipariş API'ları
│   │   │   └── payment/       # Ödeme API'ları
│   │   ├── layout.tsx         # Ana layout
│   │   └── page.tsx           # Ana sayfa
│   ├── components/            # React bileşenleri
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   └── parampos.ts        # ParamPOS servis
│   └── types/                 # TypeScript tipleri
├── mioca/                     # Tema dosyaları (HTML/CSS/JS)
└── public/                    # Statik dosyalar
```

## 🔌 API Endpoints

### Ürünler
- `GET /api/products` - Ürün listesi
- `GET /api/products/[slug]` - Ürün detayı
- `POST /api/products` - Ürün oluştur (Admin)
- `PUT /api/products/[slug]` - Ürün güncelle (Admin)
- `DELETE /api/products/[slug]` - Ürün sil (Admin)

### Kategoriler
- `GET /api/categories` - Kategori listesi
- `POST /api/categories` - Kategori oluştur (Admin)

### Sepet
- `GET /api/cart` - Sepeti getir
- `POST /api/cart` - Sepete ürün ekle
- `PUT /api/cart/[id]` - Sepet miktarını güncelle
- `DELETE /api/cart/[id]` - Sepetten ürün sil
- `DELETE /api/cart` - Sepeti temizle

### Siparişler
- `GET /api/orders` - Sipariş listesi
- `POST /api/orders` - Sipariş oluştur
- `POST /api/payment/callback` - ParamPOS callback

## 🗄️ Veritabanı Şeması

- **users** - Kullanıcılar
- **addresses** - Kullanıcı adresleri
- **categories** - Ürün kategorileri
- **products** - Ürünler
- **orders** - Siparişler
- **order_items** - Sipariş kalemleri
- **cart_items** - Sepet kalemleri
- **reviews** - Ürün yorumları

## 💳 ParamPOS Entegrasyonu

ParamPOS ile 3D Secure ve direkt ödeme desteği:

- Kredi kartı ile ödeme
- 3D Secure güvenli ödeme
- İşlem sorgulama
- İptal ve iade işlemleri

## 🚀 Plesk'te Deployment

### 1. Node.js Uygulaması Oluşturun

Plesk panelinde Node.js uygulaması oluşturun:
- Node.js versiyonu: 18.x veya üzeri
- Application mode: Production
- Application root: `/httpdocs`
- Application URL: domain.com

### 2. Dosyaları Yükleyin

FTP veya Git ile projeyi yükleyin.

### 3. Bağımlılıkları Yükleyin

SSH ile bağlanın:

```bash
cd /httpdocs
npm install
npx prisma generate
npx prisma migrate deploy
```

### 4. Build Alın

```bash
npm run build
```

### 5. PM2 ile Başlatın

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Nginx Ayarları

Plesk otomatik yapılandıracaktır, ancak gerekirse:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## 🔒 Güvenlik

- Tüm hassas veriler environment variables ile saklanır
- Şifreler bcrypt ile hashlenir
- SQL injection koruması (Prisma ORM)
- XSS koruması
- CSRF koruması

## 📝 Lisans

Bu proje özel kullanım içindir.

## 🤝 Destek

Sorularınız için: support@orangecandle.com.tr
