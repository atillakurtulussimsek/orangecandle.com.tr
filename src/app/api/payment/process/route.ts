import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import paramPOS from '@/lib/parampos';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const body = await request.json();
    const {
      orderId,
      amount,
      cardNumber,
      cardName,
      expiryMonth,
      expiryYear,
      cvv,
      installment = 1,
      use3DSecure = false,
    } = body;

    // Validasyon
    if (!orderId || !amount || !cardNumber || !cardName || !expiryMonth || !expiryYear || !cvv) {
      return NextResponse.json({ error: 'Eksik ödeme bilgileri' }, { status: 400 });
    }

    // Kart numarası ve CVV validasyonu
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length !== 16) {
      return NextResponse.json({ error: 'Geçersiz kart numarası' }, { status: 400 });
    }

    if (cvv.length < 3 || cvv.length > 4) {
      return NextResponse.json({ error: 'Geçersiz CVV' }, { status: 400 });
    }

    // Sipariş kontrolü
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        user: true,
        items: {
          include: {
            product: true,
          }
        }
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }

    if (order.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Bu siparişe erişim yetkiniz yok' }, { status: 403 });
    }

    // Sipariş zaten ödendiyse
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Bu sipariş zaten ödenmiş' }, { status: 400 });
    }

    // IP adresini al
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';

    // Sipariş açıklaması oluştur
    const description = `Sipariş #${order.orderNumber} - ${order.items.length} ürün`;

    // Callback URL'leri
    const successUrl = `${process.env.NEXTAUTH_URL}/api/payment/callback?orderId=${orderId}`;
    const failUrl = `${process.env.NEXTAUTH_URL}/checkout?payment=failed&orderId=${orderId}`;

    const cardExpiry = `${expiryMonth}${expiryYear}`;

    // 3D Secure kullanılacaksa
    if (use3DSecure) {
      const paymentResult = await paramPOS.init3DSecurePayment({
        orderId: order.orderNumber,
        amount: Number(amount),
        cardNumber: cleanCardNumber,
        cardExpiry,
        cardCvv: cvv,
        cardHolderName: cardName,
        installment: Number(installment),
        successUrl,
        failUrl,
        ipAddress,
        description,
      });

      if (!paymentResult.success) {
        return NextResponse.json(
          { 
            error: 'Ödeme başlatılamadı', 
            message: paymentResult.message 
          },
          { status: 400 }
        );
      }

      // 3D Secure için pending payment kaydı oluştur
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: Number(amount),
          method: 'CREDIT_CARD_3D',
          status: 'PENDING',
          transactionId: paymentResult.transactionId || '',
        },
      });

      // 3D Secure URL'e yönlendir
      return NextResponse.json({
        success: true,
        redirectUrl: paymentResult.redirectUrl,
        requires3DSecure: true,
      });
    }

    // Normal ödeme (Non-3D)
    const paymentResult = await paramPOS.processPayment({
      orderId: order.orderNumber,
      amount: Number(amount),
      cardNumber: cleanCardNumber,
      cardExpiry,
      cardCvv: cvv,
      cardHolderName: cardName,
      installment: Number(installment),
      ipAddress,
      description,
    });

    if (paymentResult.success) {
      // Ödeme başarılı - Order ve Payment güncellemesi
      await prisma.$transaction([
        // Payment kaydı oluştur
        prisma.payment.create({
          data: {
            orderId: order.id,
            amount: Number(amount),
            status: 'PAID',
            method: 'CREDIT_CARD',
            transactionId: paymentResult.transactionId || '',
            paymentData: paymentResult.result,
          },
        }),
        // Order durumunu güncelle
        prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            orderStatus: 'PROCESSING',
          },
        }),
      ]);

      // Eğer özel teklif kullanıldıysa usedCount'u artır
      if (order.personalOfferId) {
        await prisma.personalOffer.update({
          where: { id: order.personalOfferId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Stok güncellemesi
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Ödeme başarıyla tamamlandı',
        transactionId: paymentResult.transactionId,
        orderId: order.id,
      });
    } else {
      // Ödeme başarısız
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: Number(amount),
          status: 'FAILED',
          method: 'CREDIT_CARD',
          transactionId: paymentResult.transactionId || '',
          paymentData: paymentResult.result,
          failureReason: paymentResult.message,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: paymentResult.message || 'Ödeme işlemi başarısız. Lütfen kart bilgilerinizi kontrol edin.',
          errorCode: paymentResult.errorCode,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Payment process error:', error);
    return NextResponse.json(
      { error: 'Ödeme işlemi sırasında bir hata oluştu', details: error.message },
      { status: 500 }
    );
  }
}
