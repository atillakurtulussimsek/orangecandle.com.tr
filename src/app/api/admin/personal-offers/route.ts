import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Tüm özel kampanyaları listele
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (userId) where.userId = userId;
    if (productId) where.productId = productId;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const offers = await prisma.personalOffer.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    return NextResponse.json(offers);
  } catch (error) {
    console.error('Get personal offers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

// Yeni özel kampanya oluştur
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const {
      userId,
      productId,
      offerType,
      discountPercent,
      discountAmount,
      buyQuantity,
      getQuantity,
      description,
      validFrom,
      validUntil,
      maxUsage,
    } = data;

    console.log('Received offer data:', data);

    // Validasyon
    if (!userId) {
      return NextResponse.json({ error: 'userId gerekli' }, { status: 400 });
    }
    if (!productId) {
      return NextResponse.json({ error: 'productId gerekli' }, { status: 400 });
    }
    if (!offerType) {
      return NextResponse.json({ error: 'offerType gerekli' }, { status: 400 });
    }
    if (!validFrom) {
      return NextResponse.json({ error: 'validFrom gerekli' }, { status: 400 });
    }
    if (!validUntil) {
      return NextResponse.json({ error: 'validUntil gerekli' }, { status: 400 });
    }

    // Offer type'a göre özel validasyon
    if (offerType === 'PERCENTAGE_DISCOUNT' && (discountPercent === undefined || discountPercent === null)) {
      return NextResponse.json({ error: 'discountPercent gerekli (Yüzde İndirim için)' }, { status: 400 });
    }
    if (offerType === 'FIXED_DISCOUNT' && (discountAmount === undefined || discountAmount === null)) {
      return NextResponse.json({ error: 'discountAmount gerekli (Sabit İndirim için)' }, { status: 400 });
    }
    if (offerType === 'BUY_X_GET_Y') {
      if (!buyQuantity) {
        return NextResponse.json({ error: 'buyQuantity gerekli (X Al Y Bedava için)' }, { status: 400 });
      }
      if (!getQuantity) {
        return NextResponse.json({ error: 'getQuantity gerekli (X Al Y Bedava için)' }, { status: 400 });
      }
    }

    // Kullanıcı ve ürünün varlığını kontrol et
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }
    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    const offer = await prisma.personalOffer.create({
      data: {
        userId,
        productId,
        offerType,
        discountPercent: offerType === 'PERCENTAGE_DISCOUNT' ? discountPercent : null,
        discountAmount: offerType === 'FIXED_DISCOUNT' ? discountAmount : null,
        buyQuantity: offerType === 'BUY_X_GET_Y' ? buyQuantity : null,
        getQuantity: offerType === 'BUY_X_GET_Y' ? getQuantity : null,
        description: description || '',
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        maxUsage: maxUsage || null,
        isActive: true,
        usedCount: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
    });

    console.log('Created offer:', offer);
    return NextResponse.json(offer);
  } catch (error) {
    console.error('Create personal offer error:', error);
    return NextResponse.json(
      { error: 'Kampanya oluşturulamadı', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
