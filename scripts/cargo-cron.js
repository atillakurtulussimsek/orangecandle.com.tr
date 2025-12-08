/**
 * Kargo Durumu Otomatik Güncelleme - Local Development Helper
 * 
 * Bu script local development için 5 dakikada bir cron job'u tetikler.
 * Production'da Vercel Cron, AWS Lambda veya benzeri servisler kullanılmalı.
 * 
 * Kullanım:
 * 1. Terminal'de: node scripts/cargo-cron.js
 * 2. Arka planda çalışır ve her 5 dakikada bir API'yi çağırır
 */

const CRON_INTERVAL = 5 * 60 * 1000; // 5 dakika
const API_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

let runCount = 0;

async function runCronJob() {
  runCount++;
  console.log(`\n🚀 Cron Job Çalıştırılıyor (${runCount}. çalışma) - ${new Date().toLocaleString('tr-TR')}`);
  
  try {
    const response = await fetch(`${API_URL}/api/cron/update-cargo-status`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Cron job başarılı:', data);
    } else {
      console.error('❌ Cron job hata:', data);
    }
  } catch (error) {
    console.error('❌ API çağrısı başarısız:', error.message);
  }
  
  console.log(`⏰ Sonraki çalışma: ${new Date(Date.now() + CRON_INTERVAL).toLocaleString('tr-TR')}\n`);
}

// İlk çalışma
console.log('🎯 Kargo Durumu Otomatik Güncelleme Başlatıldı');
console.log(`📍 API URL: ${API_URL}/api/cron/update-cargo-status`);
console.log(`⏱️  Çalışma Aralığı: ${CRON_INTERVAL / 1000 / 60} dakika\n`);

runCronJob(); // Hemen çalıştır
setInterval(runCronJob, CRON_INTERVAL); // 5 dakikada bir tekrarla

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Cron job durduruluyor...');
  console.log(`📊 Toplam ${runCount} kez çalıştırıldı.`);
  process.exit(0);
});
