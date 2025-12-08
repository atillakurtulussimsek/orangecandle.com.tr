import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GET - Sipariş detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true, email: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                stock: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }

    // Format response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      
      customer: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
      },
      
      // Fiyat bilgileri
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      total: order.total,
      
      // Durum bilgileri
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      
      // Teslimat bilgileri
      shippingAddress: {
        fullName: order.shippingFullName,
        phone: order.shippingPhone,
        address: order.shippingAddress,
        city: order.shippingCity,
        district: order.shippingDistrict,
        zipCode: order.shippingZipCode,
      },
      
      // Fatura bilgileri
      billingAddress: order.billingFullName ? {
        fullName: order.billingFullName,
        phone: order.billingPhone,
        address: order.billingAddress,
        city: order.billingCity,
        district: order.billingDistrict,
        zipCode: order.billingZipCode,
      } : null,
      
      // Kargo
      trackingNumber: order.trackingNumber,
      
      // Geliver Kargo bilgileri
      geliverShipmentId: order.geliverShipmentId,
      geliverTransactionId: order.geliverTransactionId,
      geliverOfferId: order.geliverOfferId,
      cargoProvider: order.cargoProvider,
      cargoTrackingUrl: order.cargoTrackingUrl,
      cargoTrackingNumber: order.cargoTrackingNumber,
      cargoBarcode: order.cargoBarcode,
      cargoLabelUrl: order.cargoLabelUrl,
      cargoResponsiveLabelUrl: order.cargoResponsiveLabelUrl,
      
      // Not
      notes: order.notes,
      
      // ParamPOS bilgileri
      paramposTransactionId: order.paramposTransactionId,
      paramposOrderId: order.paramposOrderId,
      
      // Payment Receipt bilgileri
      paymentReceiptBase64: order.paymentReceiptBase64,
      paymentReceiptFileName: order.paymentReceiptFileName,
      paymentReceiptMimeType: order.paymentReceiptMimeType,
      paymentReceiptUploadedAt: order.paymentReceiptUploadedAt,
      paymentApprovedAt: order.paymentApprovedAt,
      paymentRejectedAt: order.paymentRejectedAt,
      paymentRejectionReason: order.paymentRejectionReason,
      
      // Ürünler
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          images: item.product.images,
          currentStock: item.product.stock,
          currentPrice: item.product.price,
        } : null,
      })),
    };

    // Log activity
    await logActivity({
      userId: decoded.userId,
      action: 'ADMIN_ORDER_VIEW',
      category: 'ADMIN',
      description: `Admin sipariş detayı görüntüledi: ${order.orderNumber}`,
      metadata: JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber }),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(formattedOrder);
  } catch (error: any) {
    console.error('Error fetching admin order detail:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Sipariş detayı yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - Sipariş güncelleme (durum değişikliği, kargo takip vb.)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true, name: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    const body = await request.json();
    const { orderStatus, paymentStatus, trackingNumber, notes } = body;

    // Get current order
    const currentOrder = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }

    // Update order
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (orderStatus !== undefined) updateData.orderStatus = orderStatus;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (notes !== undefined) updateData.notes = notes;

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
    });

    // Log activity
    const changes: string[] = [];
    if (orderStatus && orderStatus !== currentOrder.orderStatus) {
      changes.push(`Sipariş durumu: ${currentOrder.orderStatus} → ${orderStatus}`);
    }
    if (paymentStatus && paymentStatus !== currentOrder.paymentStatus) {
      changes.push(`Ödeme durumu: ${currentOrder.paymentStatus} → ${paymentStatus}`);
    }
    if (trackingNumber && trackingNumber !== currentOrder.trackingNumber) {
      changes.push(`Kargo takip no eklendi: ${trackingNumber}`);
    }

    await logActivity({
      userId: decoded.userId,
      action: 'ADMIN_ORDER_UPDATE_STATUS',
      category: 'ADMIN',
      description: `Admin sipariş güncelledi: ${currentOrder.orderNumber}. Değişiklikler: ${changes.join(', ')}`,
      metadata: JSON.stringify({
        orderId: params.id,
        orderNumber: currentOrder.orderNumber,
        changes: changes,
        adminName: admin.name,
      }),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Sipariş güncellendi',
    });
  } catch (error: any) {
    console.error('Error updating order:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Sipariş güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}
