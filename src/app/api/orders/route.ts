import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import paramposService from '@/lib/parampos';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GET /api/orders - Kullanıcının siparişlerini listele
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const orders = await prisma.order.findMany({
      where: { userId: decoded.userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Siparişler yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Yeni sipariş oluştur
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const data = await request.json();

    // Sepetteki ürünleri al
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: decoded.userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Sepetiniz boş' }, { status: 400 });
    }

    // Sipariş numarası oluştur
    const orderNumber = `OC${Date.now()}`;

    // Toplamları hesapla
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    const shipping = data.shipping || 0;
    const tax = subtotal * 0.2; // %20 KDV
    const total = subtotal + shipping + tax;

    // Siparişi oluştur
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: decoded.userId,
        subtotal,
        shipping,
        tax,
        total,
        paymentMethod: data.paymentMethod,
        shippingFullName: data.shippingAddress.fullName,
        shippingPhone: data.shippingAddress.phone,
        shippingAddress: data.shippingAddress.address,
        shippingCity: data.shippingAddress.city,
        shippingDistrict: data.shippingAddress.district,
        shippingZipCode: data.shippingAddress.zipCode,
        billingFullName: data.billingAddress?.fullName,
        billingPhone: data.billingAddress?.phone,
        billingAddress: data.billingAddress?.address,
        billingCity: data.billingAddress?.city,
        billingDistrict: data.billingAddress?.district,
        billingZipCode: data.billingAddress?.zipCode,
        notes: data.notes,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            image: JSON.parse(item.product.images)[0] || '',
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Kredi kartı ile ödeme
    if (data.paymentMethod === 'CREDIT_CARD' && data.cardInfo) {
      const paymentResult = await paramposService.processPayment({
        orderId: orderNumber,
        amount: Number(total),
        cardNumber: data.cardInfo.cardNumber,
        cardExpiry: data.cardInfo.cardExpiry,
        cardCvv: data.cardInfo.cardCvv,
        cardHolderName: data.cardInfo.cardHolderName,
        installment: data.cardInfo.installment || 0,
      });

      if (paymentResult.success) {
        // Ödeme başarılı
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            orderStatus: 'PROCESSING',
            paramposTransactionId: paymentResult.transactionId,
            paramposOrderId: paymentResult.orderId,
            paramposPaymentData: JSON.stringify(paymentResult.result),
          },
        });

        // Stokları güncelle
        for (const item of cartItems) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        // Sepeti temizle
        await prisma.cartItem.deleteMany({
          where: { userId: decoded.userId },
        });

        return NextResponse.json({
          success: true,
          order,
          payment: paymentResult,
        });
      } else {
        // Ödeme başarısız
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'FAILED',
            paramposPaymentData: JSON.stringify(paymentResult),
          },
        });

        return NextResponse.json(
          {
            error: 'Ödeme işlemi başarısız',
            message: paymentResult.message,
          },
          { status: 400 }
        );
      }
    }

    // Havale veya kapıda ödeme
    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    return NextResponse.json({ error: 'Sipariş oluşturulurken hata oluştu' }, { status: 500 });
  }
}
