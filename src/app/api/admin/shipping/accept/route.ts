import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { acceptShipmentOffer } from '@/lib/geliver';
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
    const { orderId, offerId, providerName } = body;

    if (!orderId || !offerId) {
      return NextResponse.json(
        { error: 'orderId ve offerId gereklidir' },
        { status: 400 }
      );
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }

    // Accept offer with Geliver
    const result = await acceptShipmentOffer(offerId);

    if (!result.success) {
      await logActivity({
        action: 'ADMIN_ACCEPT_CARGO_OFFER_FAILED',
        description: `Kargo teklifi kabul edilemedi: ${order.orderNumber}. Hata: ${result.error}`,
      });

      return NextResponse.json(
        {
          error: result.error || 'Teklif kabul edilemedi',
          details: result.details,
        },
        { status: 500 }
      );
    }

    // Update order with transaction and tracking info
    await prisma.order.update({
      where: { id: orderId },
      data: {
        geliverTransactionId: result.data.transaction.id,
        geliverOfferId: offerId,
        cargoProvider: providerName || 'Unknown',
        cargoTrackingNumber: result.data.trackingNumber || null,
        cargoBarcode: result.data.barcode || null,
        cargoLabelUrl: result.data.labelURL || null,
        cargoResponsiveLabelUrl: result.data.responsiveLabelURL || null,
        cargoTrackingUrl: result.data.trackingUrl || null,
        trackingNumber: result.data.trackingNumber || order.trackingNumber,
        orderStatus: 'PROCESSING', // Sipariş durumunu güncelle
      },
    });

    await logActivity({
      action: 'ADMIN_ACCEPT_CARGO_OFFER',
      description: `Kargo teklifi kabul edildi: ${order.orderNumber}. Kargo: ${providerName || 'Unknown'}. Takip No: ${result.data.trackingNumber || 'Henüz yok'}`,
    });

    return NextResponse.json({
      success: true,
      transaction: result.data.transaction,
      shipment: result.data.shipment,
      barcode: result.data.barcode,
      trackingNumber: result.data.trackingNumber,
      labelURL: result.data.labelURL,
      responsiveLabelURL: result.data.responsiveLabelURL,
      trackingUrl: result.data.trackingUrl,
      message: 'Kargo teklifi kabul edildi ve etiket oluşturuldu',
    });
  } catch (error: any) {
    console.error('Accept offer error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası', details: error.message },
      { status: 500 }
    );
  }
}
