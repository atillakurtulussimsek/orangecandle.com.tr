# Orange Candle E-Ticaret - Veritabanı Kurulumu

## 1. Environment Dosyası Oluşturma

`.env.example` dosyasını `.env` olarak kopyalayın:

```bash
cp .env.example .env
```

## 2. Veritabanı Ayarları

`.env` dosyasındaki DATABASE_URL'i kendi veritabanı bilgilerinizle güncelleyin:

```env
DATABASE_URL="mysql://kullanici_adi:sifre@localhost:3306/orangecandle"
```

### MySQL Veritabanı Oluşturma

MySQL'e bağlanın ve veritabanını oluşturun:

```sql
CREATE DATABASE orangecandle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 3. Prisma Kurulumu

### Prisma Client'ı Oluşturun:

```bash
npx prisma generate
```

### Veritabanı Tablolarını Oluşturun:

```bash
npx prisma db push
```

### (Opsiyonel) Migration Oluşturma:

```bash
npx prisma migrate dev --name init
```

## 4. Veritabanını Görüntüleme (Prisma Studio)

Veritabanınızı görsel olarak incelemek için:

```bash
npx prisma studio
```

Bu komut http://localhost:5555 adresinde Prisma Studio'yu açacaktır.

## 5. Seed Data (Test Verileri)

Test verileri eklemek için prisma/seed.ts dosyası oluşturulabilir.

## 6. Uygulamayı Başlatma

```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

## Veritabanı Şeması

### Tablolar:
- **User**: Kullanıcı bilgileri
- **Address**: Kullanıcı adresleri
- **Category**: Ürün kategorileri
- **Product**: Ürünler
- **Order**: Siparişler
- **OrderItem**: Sipariş kalemleri
- **CartItem**: Sepet kalemleri
- **Review**: Ürün değerlendirmeleri

## Önemli Notlar

1. **JWT_SECRET**: Güvenlik için production'da mutlaka değiştirin
2. **NEXTAUTH_SECRET**: Güvenli bir değer kullanın
3. **Database Backup**: Düzenli yedek alın
4. **Indexes**: Performans için gerekli indexleri ekleyin

## Sorun Giderme

### "Can't reach database server" hatası:
- MySQL servisinin çalıştığından emin olun
- Veritabanı bağlantı bilgilerini kontrol edin
- Port numarasının doğru olduğunu kontrol edin

### "Table doesn't exist" hatası:
- `npx prisma db push` komutunu çalıştırın
- Migration'ları kontrol edin

### "Authentication failed" hatası:
- MySQL kullanıcı adı ve şifresini kontrol edin
- Kullanıcının gerekli izinlere sahip olduğundan emin olun

## İletişim

Sorun yaşarsanız:
- GitHub Issues
- E-posta: info@orangecandle.com.tr
