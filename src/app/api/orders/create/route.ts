import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ParamPOSService } from '@/lib/parampos';
import { logActivity } from '@/lib/activityLogger';
import * as jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      subtotal,
      discount,
      shipping,
      total,
      notes
    } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sepetinizde ürün bulunmuyor' },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Teslimat adresi gerekli' },
        { status: 400 }
      );
    }

    if (!billingAddress) {
      return NextResponse.json(
        { success: false, error: 'Fatura adresi gerekli' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Validate billing address has tax info if it's a billing address
    if (billingAddress.isBillingAddress && (!billingAddress.companyName || 
        !billingAddress.taxNumber || !billingAddress.taxOffice)) {
      return NextResponse.json(
        { success: false, error: 'Fatura adresi eksik bilgiler içeriyor' },
        { status: 400 }
      );
    }

    // Verify products and stock
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return NextResponse.json(
          { success: false, error: `Ürün bulunamadı: ${item.name}` },
          { status: 400 }
        );
      }

      // Check stock if tracking is enabled
      if (product.stockTracking) {
        if (product.stock < item.quantity) {
          if (!product.allowBackorder) {
            return NextResponse.json(
              { success: false, error: `${product.name} ürünü için yeterli stok yok` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order with proper schema fields
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        paymentMethod: paymentMethod === 'credit-card' ? 'CREDIT_CARD' : 'BANK_TRANSFER',
        paymentStatus: 'PENDING',
        orderStatus: paymentMethod === 'bank-transfer' ? 'PENDING' : 'PENDING',
        subtotal,
        shipping,
        tax: 0, // KDV hesaplaması varsa ekle
        total,
        notes: notes || null,
        // Shipping address fields
        shippingFullName: shippingAddress.fullName,
        shippingPhone: shippingAddress.phone,
        shippingAddress: shippingAddress.address,
        shippingCity: shippingAddress.city,
        shippingDistrict: shippingAddress.district,
        shippingZipCode: shippingAddress.zipCode,
        // Billing address fields
        billingFullName: billingAddress.fullName,
        billingPhone: billingAddress.phone,
        billingAddress: billingAddress.address,
        billingCity: billingAddress.city,
        billingDistrict: billingAddress.district,
        billingZipCode: billingAddress.zipCode,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            name: item.name || '',
            image: item.image || ''
          }))
        }
      },
      include: {
        items: true
      }
    });

    // Log order creation
    await logActivity({
      userId: user.id,
      action: 'ORDER_CREATE',
      category: 'ORDER',
      description: `Sipariş oluşturuldu: ${orderNumber}, Tutar: ₺${total}`,
      metadata: {
        orderId: order.id,
        orderNumber,
        total,
        itemCount: items.length,
        paymentMethod
      }
    });

    // If credit card payment, generate Parampos payment URL (without card info)
    if (paymentMethod === 'credit-card') {
      try {
        // Şimdilik test için basit yönlendirme
        // Production'da Parampos entegrasyonu tamamlanacak
        console.log('Creating payment for order:', order.orderNumber);
        console.log('Amount:', total);
        console.log('Customer:', user.name, user.email);

        // Parampos Modal Payment kullan (kullanıcı kart bilgilerini Parampos'ta girer)
        const paramPOS = new ParamPOSService();
        
        // Parampos Modal Payment URL'i oluştur
        const paymentResult = await paramPOS.createModalPayment({
          orderId: order.orderNumber,
          amount: total,
          customerPhone: shippingAddress.phone || '',
          description: `Sipariş: ${order.orderNumber}`,
          successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback`,
          failUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback`,
          installment: 0, // Tek çekim
          maxInstallment: 0, // Taksit yok
        });

        if (paymentResult.success && paymentResult.redirectUrl) {
          // Log payment initiation
          await logActivity({
            userId: user.id,
            action: 'PAYMENT_INITIATED',
            category: 'PAYMENT',
            description: `Parampos ödeme sayfasına yönlendiriliyor: ${orderNumber}`,
            metadata: {
              orderId: order.id,
              orderNumber,
              amount: total
            }
          });

          // Direkt 3D Secure URL'ini döndür
          return NextResponse.json({
            success: true,
            orderId: order.id,
            orderNumber: order.orderNumber,
            redirectUrl: paymentResult.redirectUrl
          });
        } else {
          // Payment initiation failed
          await prisma.order.update({
            where: { id: order.id },
            data: {
              orderStatus: 'CANCELLED',
              paymentStatus: 'FAILED'
            }
          });

          await logActivity({
            userId: user.id,
            action: 'PAYMENT_FAILED',
            category: 'PAYMENT',
            description: `Ödeme sayfası oluşturulamadı: ${orderNumber}`,
            metadata: {
              orderId: order.id,
              orderNumber,
              error: paymentResult.message
            }
          });

          return NextResponse.json(
            { success: false, error: paymentResult.message || 'Ödeme sayfası oluşturulamadı' },
            { status: 400 }
          );
        }
      } catch (paymentError: any) {
        console.error('Payment error:', paymentError);
        
        // Payment error
        await prisma.order.update({
          where: { id: order.id },
          data: {
            orderStatus: 'CANCELLED',
            paymentStatus: 'FAILED'
          }
        });

        await logActivity({
          userId: user.id,
          action: 'PAYMENT_FAILED',
          category: 'PAYMENT',
          description: `Ödeme hatası: ${orderNumber}`,
          metadata: {
            orderId: order.id,
            orderNumber,
            error: paymentError.message
          }
        });

        return NextResponse.json(
          { success: false, error: 'Ödeme işlemi sırasında hata oluştu', details: paymentError.message },
          { status: 500 }
        );
      }
    }

    // Bank transfer - just return success
    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      message: 'Sipariş oluşturuldu. Banka hesap bilgileri e-posta ile gönderilecektir.'
    });

  } catch (error: any) {
    console.error('Order creation error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause
    });
    
    return NextResponse.json(
      { success: false, error: 'Sipariş oluşturulurken hata oluştu', details: error.message },
      { status: 500 }
    );
  }
}
