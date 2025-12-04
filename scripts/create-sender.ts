import { createSenderAddress } from '@/lib/geliver';

/**
 * Geliver'da gönderici adresi oluşturma scripti
 * 
 * Kullanım:
 * 1. Aşağıdaki bilgileri kendi mağaza bilgilerinizle güncelleyin
 * 2. node --loader ts-node/esm scripts/create-sender.ts
 * 3. Dönen sender ID'yi not alın
 * 4. Bu ID'yi src/app/api/admin/shipping/create/route.ts dosyasına yazın
 */

async function main() {
  try {
    console.log('🚀 Gönderici adresi oluşturuluyor...\n');

    const result = await createSenderAddress({
      name: 'Orange Candle',
      email: 'destek@orangecandle.com.tr',
      phone: '+905551234567', // Gerçek telefon numaranızı girin
      address1: 'Örnek Mahallesi, Örnek Sokak No:1',
      countryCode: 'TR',
      cityName: 'İstanbul',
      cityCode: '34',
      districtName: 'Kadıköy',
      zip: '34710',
      shortName: 'Ana Depo',
    });

    if (result.success && result.data) {
      console.log('✅ Gönderici adresi başarıyla oluşturuldu!\n');
      console.log('📋 Sender ID:', result.data.id);
      console.log('\n⚠️  ÖNEMLİ: Bu ID\'yi kopyalayın ve aşağıdaki dosyaya yapıştırın:');
      console.log('   src/app/api/admin/shipping/create/route.ts');
      console.log('   (senderAddressId: "YOUR_SENDER_ADDRESS_ID" satırını bulun)\n');
      console.log('📦 Gönderici Bilgileri:');
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.error('❌ Hata:', result.error);
      console.error('Detaylar:', result.details);
      
      if (result.error?.includes('phone')) {
        console.log('\n💡 İpucu: Telefon numarası formatı kontrol edin. Örnek: +905551234567');
      }
      if (result.error?.includes('zip')) {
        console.log('\n💡 İpucu: Posta kodu (zip) gönderici adresi için zorunludur.');
      }
    }
  } catch (error: any) {
    console.error('❌ Beklenmeyen hata:', error.message);
    console.error(error);
  }
}

main();
