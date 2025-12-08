import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * EFT/Havale ödemesini onaylama endpoint'i
 * POST /api/admin/orders/[id]/approve-payment
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { action, rejectionReason } = await req.json();

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'Geçersiz işlem. APPROVE veya REJECT olmalı' },
        { status: 400 }
      );
    }

    if (action === 'REJECT' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Red nedeni belirtilmelidir' },
        { status: 400 }
      );
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
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

    // Check if order payment method is EFT/Havale
    if (order.paymentMethod !== 'BANK_TRANSFER') {
      return NextResponse.json(
        { error: 'Bu sipariş EFT/Havale ile ödeme yapılmamış' },
        { status: 400 }
      );
    }

    // Check if receipt uploaded
    if (!order.paymentReceiptBase64) {
      return NextResponse.json(
        { error: 'Dekont yüklenmeden ödeme onaylanamaz' },
        { status: 400 }
      );
    }

    if (action === 'APPROVE') {
      // Approve payment
      await prisma.order.update({
        where: { id: params.id },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
          paymentApprovedAt: new Date(),
          paymentApprovedBy: decoded.userId,
          paymentRejectedAt: null,
          paymentRejectedBy: null,
          paymentRejectionReason: null,
        },
      });

      // Update stock for products
      for (const item of order.items) {
        if (item.product.stockTracking) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      await logActivity({
        userId: decoded.userId,
        action: 'ADMIN_APPROVE_PAYMENT',
        category: 'PAYMENT',
        description: `Ödeme onaylandı: ${order.orderNumber}`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: order.total.toString(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Ödeme başarıyla onaylandı',
      });
    } else {
      // Reject payment
      await prisma.order.update({
        where: { id: params.id },
        data: {
          paymentStatus: 'FAILED',
          orderStatus: 'CANCELLED',
          paymentRejectedAt: new Date(),
          paymentRejectedBy: decoded.userId,
          paymentRejectionReason: rejectionReason,
          paymentApprovedAt: null,
          paymentApprovedBy: null,
        },
      });

      await logActivity({
        userId: decoded.userId,
        action: 'ADMIN_REJECT_PAYMENT',
        category: 'PAYMENT',
        description: `Ödeme reddedildi: ${order.orderNumber} - ${rejectionReason}`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          rejectionReason,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Ödeme reddedildi',
      });
    }
  } catch (error: any) {
    console.error('Approve payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Ödeme onay hatası' },
      { status: 500 }
    );
  }
}
