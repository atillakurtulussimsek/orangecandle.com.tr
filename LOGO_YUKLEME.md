# Logo Yükleme Rehberi

## Logo Dosyalarını Nasıl Yüklerim?

Sitenizde logonuzu kullanmak için aşağıdaki adımları izleyin:

### 1. Logo Dosyalarını Hazırlayın

İki adet logo dosyası hazırlamanız önerilir:

- **logo.png** - Beyaz/açık arka planlarda kullanılacak (Header için)
- **logo-white.png** - Koyu arka planlarda kullanılacak (Footer için - Opsiyonel)

### 2. Logo Özellikler

**Önerilen Boyutlar:**
- Yükseklik: 40-60 piksel
- Genişlik: Oransal (logo şeklinize göre)
- Format: PNG (şeffaf arka plan tercih edilir)
- Maksimum dosya boyutu: 500KB

**Logo Tipleri:**
- **Renkli Logo** → `logo.png` (Header için)
- **Beyaz Logo** → `logo-white.png` (Footer için)

### 3. Logo Dosyalarını Yükleme

Logo dosyalarınızı aşağıdaki klasöre kopyalayın:

```
orangecandle.com.tr/
  └── public/
      ├── logo.png          ← Buraya renkli logonuzu koyun
      └── logo-white.png    ← Buraya beyaz logonuzu koyun (opsiyonel)
```

**Windows için:**
1. Proje klasörünü açın: `orangecandle.com.tr`
2. `public` klasörüne girin
3. Logo dosyalarınızı bu klasöre kopyalayın
4. Dosya adlarının TAM OLARAK `logo.png` ve `logo-white.png` olduğundan emin olun

### 4. Logo Kontrol

Logo dosyalarını yükledikten sonra:

```bash
# Sunucuyu yeniden başlatın
npm run dev
```

Ardından tarayıcınızda:
- Header'da logonuzu görebilirsiniz
- Footer'da (koyu arka planda) beyaz logonuzu görebilirsiniz

### 5. Fallback (Yedek) Sistem

Eğer logo dosyaları bulunamazsa:
- Otomatik olarak **turuncu gradient icon** ve **"Orange Candle"** yazısı gösterilir
- Bu sayede site her zaman çalışmaya devam eder

## Sık Sorulan Sorular

**S: Sadece tek bir logo dosyam var, ne yapmalıyım?**
C: Tek logo dosyanızı `logo.png` olarak kaydedin. Footer'da da aynı logo kullanılacaktır.

**S: Logom çok büyük görünüyor, ne yapmalıyım?**
C: Logo dosyanızı bir görsel düzenleme programıyla (Photoshop, GIMP, vb.) yeniden boyutlandırın. Yükseklik 40-60 piksel olmalı.

**S: Logo yerine eski icon görünüyor?**
C: 
1. Dosya adlarının doğru olduğundan emin olun (`logo.png`)
2. Dosyaların `public` klasöründe olduğunu kontrol edin
3. Tarayıcınızın önbelleğini temizleyin (Ctrl+F5)
4. Sunucuyu yeniden başlatın

**S: Farklı bir dosya adı kullanabilir miyim?**
C: Evet, ancak bunun için kod değişikliği gerekir:

Header.tsx ve Footer.tsx dosyalarında `src="/logo.png"` ve `src="/logo-white.png"` kısımlarını kendi dosya adınızla değiştirin.

## Örnek Logo Yapısı

```
public/
  ├── logo.png              → 200x50px, renkli, şeffaf arka plan
  ├── logo-white.png        → 200x50px, beyaz, şeffaf arka plan
  ├── favicon.ico           → 32x32px, site ikonu
  └── uploads/
      └── products/
```

## Destek

Sorun yaşıyorsanız:
1. Dosya yollarını kontrol edin
2. Dosya adlarının küçük harf olduğundan emin olun
3. Tarayıcı önbelleğini temizleyin
4. Sunucuyu yeniden başlatın

---

**Not:** Logo değişikliği için kod derlemesi gerekmez. Dosyaları public klasörüne koyup sayfayı yenilemeniz yeterlidir.
