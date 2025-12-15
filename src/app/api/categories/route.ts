import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Categories API Error:', error);
    return NextResponse.json({ error: 'Kategoriler yüklenirken hata oluştu' }, { status: 500 });
  }
}

// POST /api/categories - Yeni kategori ekle (Admin)
export async function POST(request: Request) {
  try {
    const data = await request.json();

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        parentId: data.parentId,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Create Category Error:', error);
    return NextResponse.json({ error: 'Kategori oluşturulurken hata oluştu' }, { status: 500 });
  }
}
