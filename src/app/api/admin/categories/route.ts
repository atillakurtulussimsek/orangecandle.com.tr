import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/admin/categories - Yeni kategori oluştur
export async function POST(request: Request) {
  try {
    // TODO: Admin authentication check
    const data = await request.json();

    // Slug kontrolü
    const existingCategory = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Bu slug zaten kullanılıyor' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        image: data.image || null,
        parentId: data.parentId || null,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Create Category Error:', error);
    return NextResponse.json(
      { error: 'Kategori oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}
