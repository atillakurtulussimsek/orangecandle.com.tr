import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Dekont yükleme endpoint'i
 * POST /api/admin/orders/[id]/payment-receipt
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

    const { fileBase64, fileName, mimeType } = await req.json();

    if (!fileBase64 || !fileName || !mimeType) {
      return NextResponse.json(
        { error: 'Dosya bilgileri eksik (fileBase64, fileName, mimeType gerekli)' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for base64)
    const fileSizeInBytes = (fileBase64.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileSizeInBytes > maxSize) {
      return NextResponse.json(
        { error: 'Dosya boyutu 5MB\'dan büyük olamaz' },
        { status: 400 }
      );
    }

    // Validate mime type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Desteklenmeyen dosya tipi. Sadece JPEG, PNG ve PDF kabul edilir' },
        { status: 400 }
      );
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
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

    // Update order with receipt
    await prisma.order.update({
      where: { id: params.id },
      data: {
        paymentReceiptBase64: fileBase64,
        paymentReceiptFileName: fileName,
        paymentReceiptMimeType: mimeType,
        paymentReceiptUploadedAt: new Date(),
        paymentReceiptUploadedBy: decoded.userId,
      },
    });

    await logActivity({
      userId: decoded.userId,
      action: 'ADMIN_UPLOAD_PAYMENT_RECEIPT',
      category: 'PAYMENT',
      description: `Dekont yüklendi: ${order.orderNumber} - ${fileName}`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        fileName,
        mimeType,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Dekont başarıyla yüklendi',
    });
  } catch (error: any) {
    console.error('Upload receipt error:', error);
    return NextResponse.json(
      { error: error.message || 'Dekont yükleme hatası' },
      { status: 500 }
    );
  }
}

/**
 * Dekont indirme endpoint'i
 * GET /api/admin/orders/[id]/payment-receipt
 */
export async function GET(
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

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: {
        paymentReceiptBase64: true,
        paymentReceiptFileName: true,
        paymentReceiptMimeType: true,
      },
    });

    if (!order || !order.paymentReceiptBase64) {
      return NextResponse.json({ error: 'Dekont bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      file: {
        base64: order.paymentReceiptBase64,
        fileName: order.paymentReceiptFileName,
        mimeType: order.paymentReceiptMimeType,
      },
    });
  } catch (error: any) {
    console.error('Get receipt error:', error);
    return NextResponse.json(
      { error: error.message || 'Dekont indirme hatası' },
      { status: 500 }
    );
  }
}
