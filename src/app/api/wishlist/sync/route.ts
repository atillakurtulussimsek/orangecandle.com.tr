import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

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

// POST /api/wishlist/sync - LocalStorage'daki istek listesini senkronize et
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
    }

    const { productIds } = await request.json();

    if (!Array.isArray(productIds)) {
      return NextResponse.json({ error: 'Geçersiz veri formatı' }, { status: 400 });
    }

    // Mevcut istek listesini al
    const existingItems = await prisma.wishlistItem.findMany({
      where: { userId },
      select: { productId: true },
    });

    const existingProductIds = new Set(existingItems.map((item: any) => item.productId));

    // Yeni ürünleri ekle
    const newProductIds = productIds.filter(id => !existingProductIds.has(id));
    
    if (newProductIds.length > 0) {
      // Ürünlerin var olduğunu kontrol et
      const validProducts = await prisma.product.findMany({
        where: {
          id: { in: newProductIds },
        },
        select: { id: true },
      });

      const validProductIds = validProducts.map(p => p.id);

      await prisma.wishlistItem.createMany({
        data: validProductIds.map(productId => ({
          userId,
          productId,
        })),
        skipDuplicates: true,
      });
    }

    // Güncel listeyi döndür
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedItems = wishlistItems.map((item: any) => ({
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: Number(item.product.price),
      comparePrice: item.product.comparePrice ? Number(item.product.comparePrice) : undefined,
      image: JSON.parse(item.product.images as string)[0] || '/placeholder-product.jpg',
      addedAt: item.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error('Sync Wishlist Error:', error);
    return NextResponse.json({ error: 'Senkronizasyon hatası' }, { status: 500 });
  }
}
