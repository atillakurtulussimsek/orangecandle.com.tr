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
    const { orderId, senderAddressId, test = true } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId gereklidir' },
        { status: 400 }
      );
    }

    // Sender address ID kontrolü - environment variable'dan al veya parametre olarak gelsin
    let finalSenderAddressId = senderAddressId || process.env.GELIVER_SENDER_ADDRESS_ID;

    if (!finalSenderAddressId) {
      return NextResponse.json(
        {
          error: 'Gönderici adresi bulunamadı',
          hint: 'Lütfen önce /api/admin/shipping/sender endpoint\'ine POST isteği göndererek gönderici adresi oluşturun veya GELIVER_SENDER_ADDRESS_ID environment variable\'ını ayarlayın.',
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

    // Calculate package dimensions (örnek değerler, gerçek ürün boyutlarını kullanabilirsiniz)
    const totalWeight = order.items.reduce((sum, item) => {
      const weight = item.product?.weight ? parseFloat(item.product.weight) : 0.5;
      return sum + weight * item.quantity;
    }, 0);

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
      length: '30.0', // cm
      width: '20.0', // cm
      height: '15.0', // cm
      weight: totalWeight.toFixed(1), // kg
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
