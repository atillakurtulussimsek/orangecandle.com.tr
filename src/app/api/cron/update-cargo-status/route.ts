import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getShipmentTracking } from '@/lib/geliver';
import { OrderStatus } from '@prisma/client';

// CRON job endpoint - her 5 dakikada çalışacak
// Vercel Cron veya external cron service ile çağrılabilir
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  console.log('\n🔄 ========================================');
  console.log('⏰ CRON JOB BAŞLADI:', new Date().toISOString());
  console.log('🔄 ========================================\n');

  try {
    // 1. DELIVERED ve CANCELLED dışındaki tüm siparişleri kontrol et (kargo gönderisi olan)
    const ordersToCheck = await prisma.order.findMany({
      where: {
        orderStatus: {
          notIn: ['DELIVERED', 'CANCELLED'], // Teslim edilmiş veya iptal edilmiş siparişleri hariç tut
        },
        geliverShipmentId: {
          not: null, // Kargo gönderisi oluşturulmuş
        },
      },
      select: {
        id: true,
        orderNumber: true,
        orderStatus: true,
        geliverShipmentId: true,
        geliverTransactionId: true,
        cargoTrackingNumber: true,
        cargoProvider: true,
      },
    });

    console.log(`📦 Kontrol edilecek sipariş sayısı: ${ordersToCheck.length}`);
    
    if (ordersToCheck.length === 0) {
      console.log('✅ Kontrol edilecek sipariş bulunamadı.\n');
      return NextResponse.json({
        success: true,
        message: 'Kontrol edilecek sipariş yok',
        checked: 0,
        updated: 0,
        duration: Date.now() - startTime,
      });
    }

    let updatedCount = 0;
    let errorCount = 0;
    const updates: any[] = [];

    // 2. Her sipariş için kargo durumunu kontrol et
    for (const order of ordersToCheck) {
      try {
        console.log(`\n📋 Sipariş: ${order.orderNumber}`);
        console.log(`   Mevcut Durum: ${order.orderStatus}`);
        console.log(`   Shipment ID: ${order.geliverShipmentId}`);

        if (!order.geliverShipmentId) {
          console.log('   ⚠️  Shipment ID yok, atlanıyor...');
          continue;
        }

        // Geliver'dan güncel durumu çek
        const trackingResult = await getShipmentTracking(order.geliverShipmentId);

        console.log('   🔍 GELIVER API RESPONSE:', JSON.stringify(trackingResult, null, 2));

        if (!trackingResult.success) {
          console.log(`   ❌ Tracking bilgisi alınamadı: ${trackingResult.error}`);
          console.log(`   ❌ Detaylar:`, trackingResult.details);
          errorCount++;
          continue;
        }

        console.log('   ✅ Tracking data alındı');
        console.log('   📦 Full data:', JSON.stringify(trackingResult.data, null, 2));

        const trackingStatus = trackingResult.data?.trackingStatus;
        if (!trackingStatus) {
          console.log('   ⚠️  Tracking status bulunamadı');
          console.log('   📦 Data yapısı:', Object.keys(trackingResult.data || {}));
          continue;
        }

        // Geliver API'den statusCode veya trackingStatusCode gelebilir
        const statusCode = trackingStatus.statusCode || trackingStatus.trackingStatusCode;
        const subStatusCode = trackingStatus.subStatusCode || trackingStatus.trackingSubStatusCode;

        console.log(`   📍 Geliver Status Code: ${statusCode}`);
        if (subStatusCode) {
          console.log(`   📍 Sub Status: ${subStatusCode}`);
        }
        console.log('   📦 Full tracking status:', JSON.stringify(trackingStatus, null, 2));

        // 3. Status'e göre sipariş durumunu güncelle
        let newOrderStatus: OrderStatus | null = null;

        console.log(`   🔍 Durum kontrolü başlıyor...`);
        console.log(`   📊 Mevcut sipariş durumu: ${order.orderStatus}`);
        console.log(`   📊 Geliver status code: ${statusCode}`);

        switch (statusCode) {
          case 'PICKED_UP':
          case 'IN_TRANSIT':
          case 'OUT_FOR_DELIVERY':
            // Kargo yola çıkmış - SHIPPED yap
            console.log(`   ✓ Kargo yolda durumu tespit edildi`);
            if (order.orderStatus !== OrderStatus.SHIPPED) {
              newOrderStatus = OrderStatus.SHIPPED;
              console.log(`   → Durum SHIPPED olarak değiştirilecek`);
            } else {
              console.log(`   ℹ️  Sipariş zaten SHIPPED durumunda`);
            }
            break;

          case 'DELIVERED':
            // Teslim edilmiş - DELIVERED yap
            console.log(`   ✓ Teslim durumu tespit edildi`);
            if (order.orderStatus !== OrderStatus.DELIVERED) {
              newOrderStatus = OrderStatus.DELIVERED;
              console.log(`   → Durum DELIVERED olarak değiştirilecek`);
            } else {
              console.log(`   ℹ️  Sipariş zaten DELIVERED durumunda`);
            }
            break;

          case 'RETURNED':
            // İade edilmiş - CANCELLED yap veya özel bir durum
            console.log(`   ✓ İade durumu tespit edildi`);
            if (order.orderStatus !== OrderStatus.CANCELLED) {
              newOrderStatus = OrderStatus.CANCELLED;
              console.log(`   → Durum CANCELLED olarak değiştirilecek`);
            } else {
              console.log(`   ℹ️  Sipariş zaten CANCELLED durumunda`);
            }
            break;

          case 'FAILED':
            // Teslimat başarısız - not ekle ama durumu değiştirme
            console.log('   ⚠️  Teslimat başarısız, sipariş durumu korunuyor');
            break;

          default:
            console.log(`   ℹ️  Bilinmeyen veya değişiklik gerektirmeyen status: ${statusCode}`);
        }

        // 4. Durum değişikliği gerekiyorsa güncelle
        if (newOrderStatus && newOrderStatus !== order.orderStatus) {
          console.log(`\n   🔄 ============================================`);
          console.log(`   🔄 DURUM GÜNCELLENİYOR`);
          console.log(`   🔄 ============================================`);
          console.log(`   📝 Sipariş: ${order.orderNumber}`);
          console.log(`   📝 Eski Durum: ${order.orderStatus}`);
          console.log(`   📝 Yeni Durum: ${newOrderStatus}`);
          console.log(`   📝 Order ID: ${order.id}`);

          const updateResult = await prisma.order.update({
            where: { id: order.id },
            data: {
              orderStatus: newOrderStatus,
              updatedAt: new Date(),
            },
          });

          console.log(`   ✅ VERİTABANI GÜNCELLENDİ!`);
          console.log(`   ✅ Güncellenen sipariş:`, JSON.stringify(updateResult, null, 2));
          console.log(`   🔄 ============================================\n`);

          updatedCount++;
          updates.push({
            orderNumber: order.orderNumber,
            oldStatus: order.orderStatus,
            newStatus: newOrderStatus,
            cargoStatus: statusCode,
            cargoSubStatus: subStatusCode,
          });

          console.log(`   ✅ Sipariş durumu başarıyla güncellendi!`);
        } else if (newOrderStatus === order.orderStatus) {
          console.log(`   ℹ️  Sipariş zaten ${order.orderStatus} durumunda, güncelleme yapılmadı`);
        } else {
          console.log(`   ℹ️  Durum değişikliği gerekmiyor (newOrderStatus: ${newOrderStatus})`);
        }

        // Rate limiting için kısa bekle (Geliver API limitleri)
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`   ❌ Sipariş güncellenirken hata: ${order.orderNumber}`, error.message);
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;

    console.log('\n🔄 ========================================');
    console.log('✅ CRON JOB TAMAMLANDI');
    console.log(`📊 İstatistikler:`);
    console.log(`   - Kontrol edilen: ${ordersToCheck.length}`);
    console.log(`   - Güncellenen: ${updatedCount}`);
    console.log(`   - Hata: ${errorCount}`);
    console.log(`   - Süre: ${duration}ms`);
    console.log('🔄 ========================================\n');

    return NextResponse.json({
      success: true,
      message: 'Kargo durumları güncellendi',
      stats: {
        checked: ordersToCheck.length,
        updated: updatedCount,
        errors: errorCount,
        duration,
      },
      updates,
    });
  } catch (error: any) {
    console.error('❌ CRON JOB HATA:', error);
    return NextResponse.json(
      {
        error: 'Cron job başarısız',
        details: error.message,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
