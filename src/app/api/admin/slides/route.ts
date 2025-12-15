import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET - Tüm slide'ları getir
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Check if admin request (with token)
    const authHeader = req.headers.get('authorization');
    const isAdmin = authHeader && authHeader.startsWith('Bearer ');

    const where = isAdmin && includeInactive ? {} : { isActive: true };

    const slides = await prisma.heroSlide.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ slides });
  } catch (error: any) {
    console.error('Get slides error:', error);
    return NextResponse.json(
      { error: 'Slider yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Yeni slide ekle (Admin only)
export async function POST(req: NextRequest) {
  try {
    // Admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin yetkisi gereklidir' }, { status: 403 });
    }

    const body = await req.json();
    const { title, subtitle, description, image, buttonText, buttonLink, bgColor, order, isActive } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Başlık zorunludur' },
        { status: 400 }
      );
    }

    const slide = await prisma.heroSlide.create({
      data: {
        title,
        subtitle: subtitle || null,
        description: description || null,
        image: image || null,
        buttonText: buttonText || null,
        buttonLink: buttonLink || null,
        bgColor: bgColor || 'from-orange-500/90 to-red-500/90',
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ slide }, { status: 201 });
  } catch (error: any) {
    console.error('Create slide error:', error);
    return NextResponse.json(
      { error: 'Slide oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}
