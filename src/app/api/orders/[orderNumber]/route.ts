import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: string;
  email: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    // Get authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    const { orderNumber } = params;

    // Get order with items
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber,
        userId: user.id, // Only user's own orders
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Sipariş bulunamadı' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      notes: order.notes,
      shippingAddress: {
        fullName: order.shippingFullName,
        phone: order.shippingPhone,
        address: order.shippingAddress,
        city: order.shippingCity,
        district: order.shippingDistrict,
        zipCode: order.shippingZipCode,
      },
      billingAddress: {
        fullName: order.billingFullName,
        phone: order.billingPhone,
        address: order.billingAddress,
        city: order.billingCity,
        district: order.billingDistrict,
        zipCode: order.billingZipCode,
      },
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          images: item.product.images,
        },
      })),
      trackingNumber: order.trackingNumber,
      // Geliver kargo bilgileri
      geliverShipmentId: order.geliverShipmentId,
      cargoProvider: order.cargoProvider,
      cargoTrackingUrl: order.cargoTrackingUrl,
      cargoTrackingNumber: order.cargoTrackingNumber,
      cargoBarcode: order.cargoBarcode,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    return NextResponse.json(formattedOrder);
  } catch (error: any) {
    console.error('Error fetching order:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Geçersiz token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Sipariş bilgileri alınırken hata oluştu' },
      { status: 500 }
    );
  }
}
