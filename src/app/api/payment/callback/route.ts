import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ParamPOSService } from '@/lib/parampos';
import { logActivity } from '@/lib/activityLogger';

/**
 * 3D Secure callback endpoint
 * ParamPOS 3D doğrulama sonrası buraya yönlendirir
 */
export async function POST(request: Request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // ParamPOS hem form-data hem de JSON gönderebilir
    let data: any = {};
    
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await request.json();
    } else if (contentType?.includes('multipart/form-data') || contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      data = Object.fromEntries(formData);
    } else {
      // Query string'den de deneyebiliriz
      const url = new URL(request.url);
      data = Object.fromEntries(url.searchParams);
    }

    console.log('3D Secure Callback Data:', data);

    // ParamPOS field mapping - TP_Modal_Payment için farklı format
    const orderId = data.TURKPOS_RETVAL_Siparis_ID || 
                    data.Siparis_ID || 
                    data.ORDER_ID || 
                    data.orderId;
    const result = data.TURKPOS_RETVAL_Sonuc || 
                   data.Sonuc || 
                   data.SONUC;
    const resultMessage = data.TURKPOS_RETVAL_Sonuc_Str || 
                          data.Sonuc_Str || 
                          data.SONUC_STR;
    const transactionId = data.TURKPOS_RETVAL_Islem_ID || 
                          data.Islem_ID || 
                          data.ISLEM_ID || 
                          data.UCD_MD;
    const islemGuid = data.TURKPOS_RETVAL_Islem_GUID || 
                      data.Islem_GUID;
    const dekontId = data.TURKPOS_RETVAL_Dekont_ID;

    console.log('Parsed values:', { orderId, result, resultMessage, transactionId });

    if (!orderId) {
      console.error('Sipariş ID bulunamadı:', data);
      return NextResponse.redirect(
        `${baseUrl}/order/error?message=Siparis+ID+bulunamadi`
      );
    }

    // Sipariş kontrolü
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: orderId },
          { id: orderId }
        ]
      },
      include: {
        items: {
          include: {
            product: true,
          }
        }
      }
    });

    if (!order) {
      console.error('Sipariş bulunamadı:', orderId);
      return NextResponse.redirect(
        `${baseUrl}/order/error?message=Siparis+bulunamadi`
      );
    }

    // Ödeme başarılı mı kontrol et (result === '1' veya result === 1)
    if (result !== '1' && result !== 1) {
      console.log('Ödeme başarısız:', resultMessage);

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          orderStatus: 'CANCELLED',
        },
      });

      await logActivity({
        userId: order.userId,
        action: 'PAYMENT_FAILED',
        category: 'PAYMENT',
        description: `Ödeme başarısız: ${order.orderNumber} - ${resultMessage}`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          error: resultMessage
        }
      });

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/order/error?message=${encodeURIComponent(resultMessage || 'Ödeme başarısız')}`
      );
    }

    // Ödeme başarılı - Modal Payment için complete3DSecurePayment gerekmez
    // Direkt sipariş durumunu güncelle
    console.log('Ödeme başarılı! Sipariş güncelleniyor...');

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        orderStatus: 'PROCESSING',
      },
    });

    // Activity log
    await logActivity({
      userId: order.userId,
      action: 'PAYMENT_SUCCESS',
      category: 'PAYMENT',
      description: `Ödeme başarılı: ${order.orderNumber}`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: order.total,
        transactionId: transactionId,
        dekontId: dekontId
      }
    });

    // Stok güncellemesi
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

    // Başarı sayfasına yönlendir
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${baseUrl}/order/success?orderNumber=${order.orderNumber}`
    );
  } catch (error: any) {
    console.error('3D Secure callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/checkout?payment=failed&message=Callback+hatasi:+${encodeURIComponent(error.message)}`
    );
  }
}

/**
 * GET request için de callback desteği (bazı ödeme sistemleri GET kullanır)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    
    // Query parametrelerini object'e dönüştür
    const data: any = {};
    searchParams.forEach((value, key) => {
      data[key] = value;
    });

    console.log('3D Secure GET Callback:', data);

    // POST handler'ını çağır (benzer logic)
    const orderId = data.Siparis_ID || data.ORDER_ID || data.orderId;
    const result = data.Sonuc || data.SONUC;
    const resultMessage = data.Sonuc_Str || data.SONUC_STR;

    if (!orderId) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/checkout?payment=failed&message=Siparis+ID+bulunamadi`
      );
    }

    if (result !== '1') {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/checkout?payment=failed&orderId=${orderId}&message=${encodeURIComponent(resultMessage || '3D Secure dogrulama basarisiz')}`
      );
    }

    // Başarılı ödeme - sipariş sayfasına yönlendir
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/order/success?orderId=${orderId}`
    );
  } catch (error: any) {
    console.error('3D Secure GET callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/checkout?payment=failed&message=Callback+hatasi`
    );
  }
}

