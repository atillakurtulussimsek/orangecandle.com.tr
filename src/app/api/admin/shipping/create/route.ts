import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { createShipment } from '@/lib/geliver';
import { logActivity } from '@/lib/activityLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
  try {
    // Admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için admin yetkisi gereklidir' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, senderAddressId, desi } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId gereklidir' },
        { status: 400 }
      );
    }

    if (!desi || desi <= 0) {
      return NextResponse.json(
        { error: 'Geçerli bir desi değeri giriniz' },
        { status: 400 }
      );
    }

    // Geliver ayarlarını veritabanından al
    const { getGeliverConfig } = await import('@/lib/settings');
    const geliverConfig = await getGeliverConfig();
    const test = geliverConfig.testMode; // Veritabanından test modu ayarını al

    // Sender address ID kontrolü - önce parametre, sonra veritabanı, en son environment variable
    let finalSenderAddressId = senderAddressId;
    
    if (!finalSenderAddressId) {
      // Veritabanından al
      finalSenderAddressId = geliverConfig.senderAddressId;
    }
    
    if (!finalSenderAddressId) {
      // Environment variable'dan al (fallback)
      finalSenderAddressId = process.env.GELIVER_SENDER_ADDRESS_ID;
    }

    if (!finalSenderAddressId) {
      return NextResponse.json(
        {
          error: 'Gönderici adresi bulunamadı',
          hint: 'Lütfen admin panelinden Geliver ayarlarını yapılandırın veya /api/admin/shipping/sender endpoint\'ine POST isteği göndererek gönderici adresi oluşturun.',
        },
        { status: 400 }
      );
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }

    // Check if shipment already created
    if (order.geliverShipmentId) {
      return NextResponse.json(
        {
          error: 'Bu sipariş için kargo gönderisi zaten oluşturulmuş',
          shipmentId: order.geliverShipmentId,
        },
        { status: 400 }
      );
    }

    // Calculate package dimensions based on desi
    // Desi formülü: (uzunluk × genişlik × yükseklik) / 3000 = desi
    // Standart oran kullanarak boyutları hesaplıyoruz (30:20:15 oranı)
    const desiVolume = desi * 3000; // cm³
    const ratio = Math.cbrt(desiVolume / 9000); // (30*20*15 = 9000)
    const length = (30 * ratio).toFixed(1);
    const width = (20 * ratio).toFixed(1);
    const height = (15 * ratio).toFixed(1);

    // Weight calculation from order items
    const totalWeight = order.items.reduce((sum, item) => {
      const weight = item.product?.weight ? parseFloat(item.product.weight) : 0.5;
      return sum + weight * item.quantity;
    }, 0);

    // Desi ve gerçek ağırlıktan büyük olanı kullan
    const effectiveWeight = Math.max(desi, totalWeight);

    // Format phone number (add +90 prefix for international format)
    const formatPhone = (phone: string) => {
      const cleaned = phone.replace(/[^\d]/g, '');
      // If already has +90 or 90 prefix
      if (cleaned.startsWith('90')) return '+' + cleaned;
      // If has 0 prefix, replace with +90
      if (cleaned.startsWith('0')) return '+90' + cleaned.substring(1);
      // If no prefix, add +90
      return '+90' + cleaned;
    };

    // Create shipment with Geliver
    const shipmentResult = await createShipment({
      senderAddressID: finalSenderAddressId,
      recipientAddress: {
        name: order.shippingFullName,
        email: order.user.email,
        phone: formatPhone(order.shippingPhone),
        address1: order.shippingAddress,
        countryCode: 'TR',
        cityName: order.shippingCity,
        cityCode: order.shippingCity === 'İstanbul' ? '34' : '06', // Şehir kodu mapping gerekebilir
        districtName: order.shippingDistrict,
        zip: order.shippingZipCode,
      },
      length: length, // cm - desiden hesaplanan
      width: width, // cm - desiden hesaplanan
      height: height, // cm - desiden hesaplanan
      weight: effectiveWeight.toFixed(1), // kg - desi veya gerçek ağırlıktan büyük olanı
      orderNumber: order.orderNumber,
      totalAmount: order.total.toString(),
      sourceIdentifier: process.env.NEXT_PUBLIC_SITE_URL || 'https://orangecandle.com.tr',
      test,
    });

    if (!shipmentResult.success) {
      await logActivity({
        action: 'ADMIN_CREATE_CARGO_FAILED',
        description: `Kargo gönderisi oluşturma başarısız: ${order.orderNumber}. Hata: ${shipmentResult.error}`,
      });

      return NextResponse.json(
        {
          error: shipmentResult.error || 'Kargo gönderisi oluşturulamadı',
          details: shipmentResult.details,
        },
        { status: 500 }
      );
    }

    const shipment = shipmentResult.data;

    // Update order with shipment info
    await prisma.order.update({
      where: { id: orderId },
      data: {
        geliverShipmentId: (shipment as any).id,
        cargoCreatedAt: new Date(),
      },
    });

    await logActivity({
      action: 'ADMIN_CREATE_CARGO',
      description: `Kargo gönderisi oluşturuldu: ${order.orderNumber}. Shipment ID: ${(shipment as any).id}`,
    });

    return NextResponse.json({
      success: true,
      shipment,
      message: 'Kargo gönderisi oluşturuldu. Teklifleri bekleyin.',
    });
  } catch (error: any) {
    console.error('Create shipment error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası', details: error.message },
      { status: 500 }
    );
  }
}
