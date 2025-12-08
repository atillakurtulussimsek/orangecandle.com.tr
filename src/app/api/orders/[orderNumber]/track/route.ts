import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { getShipmentTracking } from '@/lib/geliver';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    // Customer authentication
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

    // Find order
    const order = await prisma.orders.findFirst({
      where: {
        orderNumber: params.orderNumber,
        userId: decoded.userId, // Müşteri kendi siparişini görebilir
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }

    // Check if order has Geliver shipment
    if (!order.geliverShipmentId) {
      return NextResponse.json(
        {
          error: 'Bu sipariş için henüz kargo gönderisi oluşturulmamış',
        },
        { status: 400 }
      );
    }

    // Get tracking info from Geliver
    const result = await getShipmentTracking(order.geliverShipmentId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Takip bilgisi alınamadı',
          details: result.details,
        },
        { status: 500 }
      );
    }

    // Update order with latest tracking info if available
    if (result.data?.shipment && result.data.trackingStatus) {
      const trackingData = result.data.trackingStatus;
      
      // Map Geliver status to our order status
      let newOrderStatus = order.orderStatus;
      if (trackingData.trackingStatusCode === 'DELIVERED') {
        newOrderStatus = 'DELIVERED';
      } else if (trackingData.trackingStatusCode === 'IN_TRANSIT') {
        newOrderStatus = 'SHIPPED';
      }

      // Update order if status changed
      if (newOrderStatus !== order.orderStatus) {
        await prisma.orders.update({
          where: { id: order.id },
          data: {
            orderStatus: newOrderStatus,
            updatedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      tracking: {
        shipmentId: order.geliverShipmentId,
        transactionId: order.geliverTransactionId,
        trackingNumber: order.cargoTrackingNumber || order.trackingNumber,
        barcode: order.cargoBarcode,
        provider: order.cargoProvider,
        trackingUrl: order.cargoTrackingUrl,
        status: result.data?.trackingStatus,
        lastUpdate: result.data?.shipment?.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Track order error:', error);
    return NextResponse.json(
      {
        error: 'Takip bilgisi alınırken bir hata oluştu',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
