# 🚀 Plesk Deployment Checklist

## Önce Yapılacaklar (Lokal)

- [ ] `npm run build` çalıştırıp hata olmadığını kontrol et
- [ ] `.env.production` dosyasını hazırla
- [ ] `server.js` dosyasını oluştur
- [ ] `package.json` scripts'i güncelle
- [ ] Tüm dosyaları commit et

## Plesk Panel Ayarları

### 1. Node.js Kurulumu
- [ ] Websites & Domains → Node.js
- [ ] Enable Node.js
- [ ] Node.js version: 18.x veya üzeri
- [ ] Application mode: Production
- [ ] Application root: `/httpdocs`
- [ ] Application startup file: `server.js`

### 2. Environment Variables
- [ ] NODE_ENV=production
- [ ] PORT=3000
- [ ] Tüm .env.production değerlerini Plesk'e ekle

### 3. Dosya Yükleme
```bash
# FTP/SFTP ile yükle:
- .next/ (build sonrası)
- public/
- src/
- prisma/
- node_modules/ (veya sunucuda npm install)
- package.json
- next.config.js
- next.config.mjs
- tsconfig.json
- tailwind.config.ts
- postcss.config.js
- .env.production
- server.js
```

### 4. Sunucuda Komutlar
```bash
cd /var/www/vhosts/orangecandle.com.tr/httpdocs

# Dependencies
npm install --production

# Prisma
npm run db:generate

# Build
npm run build

# Test (optional)
npm start
```

### 5. SSL Sertifikası
- [ ] SSL/TLS Certificates → Let's Encrypt
- [ ] Domain seçildi
- [ ] Sertifika alındı
- [ ] Otomatik yenileme aktif

### 6. Nginx/Apache Proxy
- [ ] Apache & nginx Settings kontrol edildi
- [ ] Reverse proxy yapılandırıldı (port 3000)

### 7. Güvenlik
- [ ] NEXTAUTH_SECRET değiştirildi (güçlü key)
- [ ] JWT_SECRET değiştirildi (güçlü key)
- [ ] ParamPOS production credentials eklendi
- [ ] EMAIL_SERVER gerçek SMTP bilgileri eklendi
- [ ] NEXT_PUBLIC_BASE_URL production domain olarak ayarlandı
- [ ] NEXTAUTH_URL production domain olarak ayarlandı

### 8. Database
- [ ] MySQL bağlantısı test edildi
- [ ] DATABASE_URL doğru
- [ ] Prisma migrate çalıştırıldı (gerekirse)

### 9. Geliver Webhook
- [ ] Geliver panel → Webhook URL: https://orangecandle.com.tr/api/webhooks/geliver
- [ ] Test webhook gönderildi
- [ ] Webhook signature doğrulaması aktif (production)

### 10. Test
- [ ] Ana sayfa açılıyor
- [ ] Ürün sayfaları çalışıyor
- [ ] Login/Register çalışıyor
- [ ] Sepet işlemleri çalışıyor
- [ ] Ödeme sayfası açılıyor (ParamPOS production test)
- [ ] Admin panel erişimi çalışıyor
- [ ] Kargo işlemleri çalışıyor

## Sürekli Çalıştırma

Plesk Node.js otomatik başlatır ve restart eder. Manuel kontrol:

```bash
# Status
pm2 status

# Logs
pm2 logs

# Restart
pm2 restart all
```

## Sorun Giderme

### Uygulama başlamıyor
```bash
# Logs kontrol et
tail -f /var/log/plesk-nodejs/*/error.log

# Node.js modüllerini yeniden yükle
rm -rf node_modules
npm install --production
npm run db:generate
npm run build
```

### Port conflict
```bash
# Port 3000 kullanımda mı?
lsof -i :3000
# Farklı port kullan (package.json ve Plesk ayarlarında)
```

### Database bağlantı hatası
```bash
# MySQL bağlantısını test et
mysql -h 94.156.11.185 -u orangecandle_radmin -p orangecandle_shop
```

### Prisma hatası
```bash
# Prisma client'ı yeniden oluştur
npx prisma generate
npx prisma db push
```

## Monitoring

- [ ] Plesk Application Logs kontrol ediliyor
- [ ] Error logs takip ediliyor
- [ ] Performance monitoring kuruldu (optional)
- [ ] Uptime monitoring kuruldu (optional)

## Backup

- [ ] Plesk otomatik backup aktif
- [ ] Database backup schedule ayarlandı
- [ ] Dosya backup schedule ayarlandı

## Production Notes

### Cache Temizleme (Deploy sonrası)
```bash
cd /var/www/vhosts/orangecandle.com.tr/httpdocs
rm -rf .next/cache
npm run build
pm2 restart all
```

### Yeni değişiklik deploy etme
```bash
# 1. Lokal'de test et
npm run build

# 2. Git push (optional)
git push origin main

# 3. Sunucuda pull (veya FTP upload)
cd /var/www/vhosts/orangecandle.com.tr/httpdocs
git pull origin main

# 4. Build ve restart
npm install --production
npm run build
pm2 restart all
```

### Environment değişkeni değiştirme
1. Plesk Node.js Settings → Environment Variables
2. Değiştir
3. Application'ı restart et

---

**🎯 Deploy tamamlandığında test et:**
- https://orangecandle.com.tr
- https://orangecandle.com.tr/admin
- https://orangecandle.com.tr/account

**📧 Support:** Sorun olursa Plesk logs ve error mesajlarını paylaş
