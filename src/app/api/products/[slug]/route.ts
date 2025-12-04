import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/products/[slug]
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    // Transform product for frontend
    const transformedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
      images: JSON.parse(product.images),
      tags: product.tags ? JSON.parse(product.tags) : [],
      featured: product.featured,
      bestseller: product.bestseller,
      newArrival: product.newArrival,
      onSale: product.onSale,
      discount: product.discount,
      stock: product.stock,
      stockTracking: product.stockTracking,
      allowBackorder: product.allowBackorder,
      backorderMessage: product.backorderMessage,
      lowStockThreshold: product.lowStockThreshold,
      sku: product.sku,
      weight: product.weight,
      dimensions: product.dimensions,
      burnTime: product.burnTime,
      scent: product.scent,
      material: product.material,
      category: product.category,
      reviews: product.reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        userName: review.user.name,
        createdAt: review.createdAt,
      })),
      reviewCount: product.reviews.length,
      averageRating: product.reviews.length > 0
        ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
        : 0,
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Product Detail Error:', error);
    return NextResponse.json({ error: 'Ürün yüklenirken hata oluştu' }, { status: 500 });
  }
}

// PUT /api/products/[slug] - Ürün güncelle (Admin)
export async function PUT(request: Request, { params }: { params: { slug: string } }) {
  try {
    const data = await request.json();

    const product = await prisma.product.update({
      where: { slug: params.slug },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        comparePrice: data.comparePrice,
        stock: data.stock,
        categoryId: data.categoryId,
        images: JSON.stringify(data.images || []),
        tags: JSON.stringify(data.tags || []),
        featured: data.featured,
        bestseller: data.bestseller,
        newArrival: data.newArrival,
        onSale: data.onSale,
        discount: data.discount,
        weight: data.weight,
        dimensions: data.dimensions,
        burnTime: data.burnTime,
        scent: data.scent,
        material: data.material,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Update Product Error:', error);
    return NextResponse.json({ error: 'Ürün güncellenirken hata oluştu' }, { status: 500 });
  }
}

// DELETE /api/products/[slug] - Ürün sil (Admin)
export async function DELETE(request: Request, { params }: { params: { slug: string } }) {
  try {
    await prisma.product.delete({
      where: { slug: params.slug },
    });

    return NextResponse.json({ message: 'Ürün silindi' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    return NextResponse.json({ error: 'Ürün silinirken hata oluştu' }, { status: 500 });
  }
}
