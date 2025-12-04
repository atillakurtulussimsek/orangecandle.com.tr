import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Kullanıcının aktif özel tekliflerini getir
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const now = new Date();
    
    const where: any = {
      userId: decoded.userId,
      isActive: true,
      validFrom: { lte: now },
      validUntil: { gte: now },
    };

    // Eğer productId varsa sadece o ürün için teklifleri getir
    if (productId) {
      where.productId = productId;
    }

    const offers = await prisma.personalOffer.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Kullanım limitine ulaşmış teklifleri filtrele
    const validOffers = offers.filter(offer => {
      if (offer.maxUsage === null) return true;
      return offer.usedCount < offer.maxUsage;
    });

    return NextResponse.json(validOffers);
  } catch (error) {
    console.error('Get my offers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}
