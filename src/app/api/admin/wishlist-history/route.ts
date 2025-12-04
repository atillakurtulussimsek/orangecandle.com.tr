import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

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

async function checkAdminAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === 'ADMIN';
}

// GET /api/admin/wishlist-history - Belirli bir kullanıcının wishlist geçmişini getir
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('userId');

    if (!customerId) {
      return NextResponse.json({ error: 'Kullanıcı ID gerekli' }, { status: 400 });
    }

    // Wishlist geçmişini getir
    const history = await prisma.wishlistHistory.findMany({
      where: { userId: customerId },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📋 Wishlist history for user ${customerId}: ${history.length} records`);

    // Her kayıt için ürün bilgisini ekle (ürün hala varsa)
    const enrichedHistory = await Promise.all(
      history.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
            stock: true,
          },
        });

        return {
          ...item,
          productExists: !!product,
          currentProduct: product ? {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: Number(product.price),
            image: JSON.parse(product.images as string)[0] || null,
            stock: product.stock,
          } : null,
        };
      })
    );

    return NextResponse.json(enrichedHistory);
  } catch (error) {
    console.error('Wishlist History Error:', error);
    return NextResponse.json({ error: 'Geçmiş yüklenirken hata oluştu' }, { status: 500 });
  }
}
