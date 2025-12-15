import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET - Tek slide getir
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slide = await prisma.heroSlide.findUnique({
      where: { id: params.id },
    });

    if (!slide) {
      return NextResponse.json({ error: 'Slide bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ slide });
  } catch (error: any) {
    console.error('Get slide error:', error);
    return NextResponse.json(
      { error: 'Slide yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - Slide güncelle (Admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if slide exists
    const existingSlide = await prisma.heroSlide.findUnique({
      where: { id: params.id },
    });

    if (!existingSlide) {
      return NextResponse.json({ error: 'Slide bulunamadı' }, { status: 404 });
    }

    const slide = await prisma.heroSlide.update({
      where: { id: params.id },
      data: {
        title: title || existingSlide.title,
        subtitle: subtitle !== undefined ? subtitle : existingSlide.subtitle,
        description: description !== undefined ? description : existingSlide.description,
        image: image !== undefined ? image : existingSlide.image,
        buttonText: buttonText !== undefined ? buttonText : existingSlide.buttonText,
        buttonLink: buttonLink !== undefined ? buttonLink : existingSlide.buttonLink,
        bgColor: bgColor !== undefined ? bgColor : existingSlide.bgColor,
        order: order !== undefined ? order : existingSlide.order,
        isActive: isActive !== undefined ? isActive : existingSlide.isActive,
      },
    });

    return NextResponse.json({ slide });
  } catch (error: any) {
    console.error('Update slide error:', error);
    return NextResponse.json(
      { error: 'Slide güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - Slide sil (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if slide exists
    const existingSlide = await prisma.heroSlide.findUnique({
      where: { id: params.id },
    });

    if (!existingSlide) {
      return NextResponse.json({ error: 'Slide bulunamadı' }, { status: 404 });
    }

    await prisma.heroSlide.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Slide silindi' });
  } catch (error: any) {
    console.error('Delete slide error:', error);
    return NextResponse.json(
      { error: 'Slide silinirken hata oluştu' },
      { status: 500 }
    );
  }
}
