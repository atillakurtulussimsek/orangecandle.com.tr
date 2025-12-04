import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add counts manually
    const productsWithCounts = await Promise.all(
      products.map(async (product) => {
        const [reviewCount, orderItemCount] = await Promise.all([
          prisma.review.count({ where: { productId: product.id } }),
          prisma.orderItem.count({ where: { productId: product.id } }),
        ]);

        return {
          ...product,
          price: Number(product.price),
          comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
          _count: {
            reviews: reviewCount,
            orderItems: orderItemCount,
          },
        };
      })
    );

    return NextResponse.json(productsWithCounts);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    // Create product
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        comparePrice: data.comparePrice || null,
        stock: data.stock,
        sku: data.sku,
        categoryId: data.categoryId,
        images: JSON.stringify(data.images),
        tags: data.tags ? JSON.stringify(data.tags) : null,
        featured: data.featured || false,
        bestseller: data.bestseller || false,
        newArrival: data.newArrival || false,
        onSale: data.onSale || false,
        discount: data.discount || 0,
        weight: data.weight || null,
        dimensions: data.dimensions || null,
        burnTime: data.burnTime || null,
        scent: data.scent || null,
        material: data.material || null,
        stockTracking: data.stockTracking ?? true,
        allowBackorder: data.allowBackorder ?? false,
        backorderMessage: data.backorderMessage || null,
        lowStockThreshold: data.lowStockThreshold || 10,
      },
      include: {
        category: true,
      },
    });

    // Log aktivitesi
    await logActivity({
      userId: decoded.userId,
      action: 'ADMIN_PRODUCT_CREATE',
      category: 'ADMIN',
      description: `Yeni ürün oluşturuldu: ${product.name} (SKU: ${product.sku})`,
      metadata: {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        price: product.price,
        categoryId: product.categoryId,
      },
      request,
      statusCode: 201,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create product:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'SKU or slug already exists' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
