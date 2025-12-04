import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const transformedProduct = {
      ...product,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        comparePrice: data.comparePrice || null,
        stock: data.stock,
        sku: data.sku,
        categoryId: data.categoryId,
        images: typeof data.images === 'string' ? data.images : JSON.stringify(data.images),
        tags: data.tags ? (typeof data.tags === 'string' ? data.tags : JSON.stringify(data.tags)) : null,
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
      action: 'ADMIN_PRODUCT_UPDATE',
      category: 'ADMIN',
      description: `Ürün güncellendi: ${product.name} (SKU: ${product.sku})`,
      metadata: {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        changes: data,
      },
      request,
      statusCode: 200,
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Failed to update product:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'SKU or slug already exists' }, { status: 400 });
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Önce ürün bilgisini al
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, sku: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    // Log aktivitesi
    await logActivity({
      userId: decoded.userId,
      action: 'ADMIN_PRODUCT_DELETE',
      category: 'ADMIN',
      description: `Ürün silindi: ${product.name} (SKU: ${product.sku})`,
      metadata: {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
      },
      request,
      statusCode: 200,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete product:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
