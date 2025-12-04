import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { logActivity } from '@/lib/activityLogger';

// JWT token'dan userId çıkar
function getUserIdFromToken(request: Request): string | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// GET /api/wishlist - Kullanıcının istek listesini getir
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
            images: true,
            stock: true,
            stockTracking: true,
            allowBackorder: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Her ürün için aktif özel teklif kontrolü
    const formattedItems = await Promise.all(
      wishlistItems.map(async (item: any) => {
        const activeOffer = await prisma.personalOffer.findFirst({
          where: {
            userId,
            productId: item.product.id,
            isActive: true,
            validFrom: {
              lte: new Date(),
            },
            validUntil: {
              gte: new Date(),
            },
          },
          select: {
            id: true,
            offerType: true,
            discountPercent: true,
            discountAmount: true,
            buyQuantity: true,
            getQuantity: true,
          },
        });

        return {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: Number(item.product.price),
          comparePrice: item.product.comparePrice ? Number(item.product.comparePrice) : undefined,
          image: JSON.parse(item.product.images as string)[0] || '/placeholder-product.jpg',
          addedAt: item.createdAt.toISOString(),
          stock: item.product.stock,
          stockTracking: item.product.stockTracking,
          allowBackorder: item.product.allowBackorder,
          hasActiveOffer: !!activeOffer,
          activeOffer: activeOffer ? {
            id: activeOffer.id,
            offerType: activeOffer.offerType,
            discountPercent: activeOffer.discountPercent,
            discountAmount: activeOffer.discountAmount,
            buyQuantity: activeOffer.buyQuantity,
            getQuantity: activeOffer.getQuantity,
          } : undefined,
        };
      })
    );

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error('Get Wishlist Error:', error);
    return NextResponse.json({ error: 'İstek listesi yüklenirken hata oluştu' }, { status: 500 });
  }
}

// POST /api/wishlist - İstek listesine ürün ekle
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Ürün ID gerekli' }, { status: 400 });
    }

    // Ürün var mı kontrol et
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    // Zaten listede mi kontrol et
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: 'Ürün zaten listenizde' }, { status: 200 });
    }

    // Listeye ekle
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId,
        productId,
      },
    });

    // Geçmişe kaydet
    try {
      await prisma.wishlistHistory.create({
        data: {
          userId,
          productId,
          productName: product.name,
          productSlug: product.slug,
          productImage: JSON.parse(product.images as string)[0] || null,
          action: 'ADDED',
          reason: null,
          removedBy: null,
          notes: 'Kullanıcı tarafından eklendi',
        },
      });
      console.log('✅ Wishlist history created: ADDED', productId);
    } catch (historyError) {
      console.error('❌ Wishlist history error:', historyError);
      // Geçmiş kaydedilemese bile devam et
    }

    // Log activity
    logActivity({
      userId,
      action: 'WISHLIST_ADD',
      category: 'WISHLIST',
      description: `İstek listesine ürün eklendi: ${product.name}`,
      metadata: { 
        productId, 
        productName: product.name,
        productSlug: product.slug,
        price: Number(product.price)
      },
      request: request as NextRequest,
      statusCode: 201,
    });

    return NextResponse.json({ success: true, item: wishlistItem }, { status: 201 });
  } catch (error) {
    console.error('Add to Wishlist Error:', error);
    return NextResponse.json({ error: 'Ürün eklenirken hata oluştu' }, { status: 500 });
  }
}

// DELETE /api/wishlist - İstek listesinden ürün çıkar
export async function DELETE(request: Request) {
  try {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const forceRemove = searchParams.get('force') === 'true'; // Onay sonrası kaldırma

    if (!productId) {
      return NextResponse.json({ error: 'Ürün ID gerekli' }, { status: 400 });
    }

    // Bu ürüne ait aktif özel teklif var mı kontrol et
    const activeOffer = await prisma.personalOffer.findFirst({
      where: {
        userId,
        productId,
        isActive: true,
        validFrom: {
          lte: new Date(),
        },
        validUntil: {
          gte: new Date(),
        },
        OR: [
          { maxUsage: null },
          {
            usedCount: {
              lt: prisma.personalOffer.fields.maxUsage,
            },
          },
        ],
      },
    });

    // Eğer aktif teklif varsa ve force değilse, uyarı dön
    if (activeOffer && !forceRemove) {
      return NextResponse.json({
        hasActiveOffer: true,
        offer: {
          id: activeOffer.id,
          offerType: activeOffer.offerType,
          discountPercent: activeOffer.discountPercent,
          discountAmount: activeOffer.discountAmount,
          buyQuantity: activeOffer.buyQuantity,
          getQuantity: activeOffer.getQuantity,
          description: activeOffer.description,
        },
        message: 'Bu ürün için aktif bir özel kampanya var. Ürünü favorilerden çıkarırsanız kampanya iptal olacaktır.',
      }, { status: 409 }); // 409 Conflict
    }

    // Ürün bilgisini al (geçmiş için)
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        name: true,
        slug: true,
        images: true,
      },
    });

    // İstek listesinden çıkar - deleteMany kullan (kayıt yoksa hata vermez)
    const deleted = await prisma.wishlistItem.deleteMany({
      where: {
        userId,
        productId,
      },
    });

    // Eğer kayıt bulunamadıysa, zaten listede yok demektir
    if (deleted.count === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'Ürün zaten favorilerinizde değil',
        offerCancelled: false,
      });
    }

    // Eğer aktif teklif varsa, onu deaktif et
    if (activeOffer) {
      await prisma.personalOffer.update({
        where: { id: activeOffer.id },
        data: { 
          isActive: false,
          updatedAt: new Date(),
        },
      });
    }

    // Geçmişe kaydet
    try {
      await prisma.wishlistHistory.create({
        data: {
          userId,
          productId,
          productName: product?.name || 'Bilinmeyen Ürün',
          productSlug: product?.slug || null,
          productImage: product?.images ? JSON.parse(product.images as string)[0] : null,
          action: 'REMOVED',
          reason: activeOffer ? 'CAMPAIGN_CANCELLED' : 'USER_REMOVED',
          removedBy: userId,
          notes: activeOffer 
            ? 'Kullanıcı kampanyalı ürünü onaylayarak çıkardı'
            : 'Kullanıcı tarafından çıkarıldı',
        },
      });
      console.log('✅ Wishlist history created: REMOVED', productId, activeOffer ? '(with campaign)' : '');
    } catch (historyError) {
      console.error('❌ Wishlist history error:', historyError);
      // Geçmiş kaydedilemese bile devam et
    }

    // Log activity
    logActivity({
      userId,
      action: 'WISHLIST_REMOVE',
      category: 'WISHLIST',
      description: `İstek listesinden ürün çıkarıldı: ${product?.name || 'Bilinmeyen Ürün'}`,
      metadata: { 
        productId, 
        productName: product?.name || 'Bilinmeyen Ürün',
        hadActiveOffer: !!activeOffer,
        offerCancelled: !!activeOffer,
        reason: activeOffer ? 'CAMPAIGN_CANCELLED' : 'USER_REMOVED'
      },
      request: request as NextRequest,
      statusCode: 200,
    });

    return NextResponse.json({ 
      success: true,
      offerCancelled: !!activeOffer,
    });
  } catch (error) {
    console.error('Remove from Wishlist Error:', error);
    return NextResponse.json({ error: 'Ürün çıkarılırken hata oluştu' }, { status: 500 });
  }
}
