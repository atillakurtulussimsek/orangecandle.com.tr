import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/categories/[id] - Tek kategori detayı
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Kategori bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Get Category Error:', error);
    return NextResponse.json(
      { error: 'Kategori yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/categories/[id] - Kategori güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Admin authentication check
    const data = await request.json();

    // Slug kontrolü (kendi kategorisi hariç)
    if (data.slug) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          slug: data.slug,
          NOT: { id: params.id },
        },
      });

      if (existingCategory) {
        return NextResponse.json(
          { error: 'Bu slug zaten kullanılıyor' },
          { status: 400 }
        );
      }
    }

    // Parent kontrolü (kendi parent'ı olamaz)
    if (data.parentId === params.id) {
      return NextResponse.json(
        { error: 'Kategori kendi alt kategorisi olamaz' },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id: params.id },
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

    return NextResponse.json(category);
  } catch (error) {
    console.error('Update Category Error:', error);
    return NextResponse.json(
      { error: 'Kategori güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[id] - Kategori sil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Admin authentication check

    // Kategoriye ait ürün kontrolü
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Kategori bulunamadı' },
        { status: 404 }
      );
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        { error: 'Bu kategoride ürün bulunduğu için silinemez' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Category Error:', error);
    return NextResponse.json(
      { error: 'Kategori silinirken hata oluştu' },
      { status: 500 }
    );
  }
}
