import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/products - Müşteriler için ürünleri listele
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const categoryId = searchParams.get('categoryId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const featured = searchParams.get('featured');
    const bestseller = searchParams.get('bestseller');
    const newArrival = searchParams.get('newArrival');
    const onSale = searchParams.get('onSale');
    const inStock = searchParams.get('inStock');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'featured';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '9');

    // Build where clause
    const where: any = {};

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Quick filters
    if (featured === 'true') where.featured = true;
    if (bestseller === 'true') where.bestseller = true;
    if (newArrival === 'true') where.newArrival = true;
    if (onSale === 'true') where.onSale = true;

    // Stock filter - handle different stock tracking modes
    if (inStock === 'true') {
      where.OR = [
        { stockTracking: true, stock: { gt: 0 } }, // Has stock and tracking enabled
        { stockTracking: false }, // Stock tracking disabled (always available)
        { allowBackorder: true }, // Backorder enabled (always available)
      ];
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
      case 'name-asc':
        orderBy = { name: 'asc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'bestseller':
        orderBy = [{ bestseller: 'desc' }, { createdAt: 'desc' }];
        break;
      default: // featured
        orderBy = [{ featured: 'desc' }, { createdAt: 'desc' }];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch products with category
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          ...where,
          isDeleted: false,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Transform products for frontend
    const transformedProducts = products.map((product: any) => ({
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
      category: product.category.name,
      categoryId: product.category.id,
      reviewCount: product._count.reviews,
    }));

    // Stok durumuna göre öncelik sıralaması
    const sortedProducts = transformedProducts.sort((a, b) => {
      // Öncelik hesapla
      const getPriority = (product: any) => {
        // Stok takibi kapalı = en yüksek öncelik (her zaman sipariş alınabilir)
        if (!product.stockTracking) return 1;
        // Stokta var = yüksek öncelik
        if (product.stock > 0) return 2;
        // Ön sipariş = orta öncelik
        if (product.stock === 0 && product.allowBackorder) return 3;
        // Stokta yok = en düşük öncelik
        return 4;
      };

      const priorityA = getPriority(a);
      const priorityB = getPriority(b);

      // Önce önceliğe göre sırala
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Aynı öncelikteyse, orijinal sıralamayı koru (database orderBy)
      return 0;
    });

    return NextResponse.json({
      products: sortedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Products API Error:', error);
    return NextResponse.json({ error: 'Ürünler yüklenirken hata oluştu' }, { status: 500 });
  }
}

// POST /api/products - Yeni ürün ekle (Admin)
export async function POST(request: Request) {
  try {
    const data = await request.json();

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        comparePrice: data.comparePrice,
        stock: data.stock,
        sku: data.sku,
        categoryId: data.categoryId,
        images: JSON.stringify(data.images || []),
        tags: JSON.stringify(data.tags || []),
        featured: data.featured || false,
        bestseller: data.bestseller || false,
        newArrival: data.newArrival || false,
        onSale: data.onSale || false,
        discount: data.discount,
        weight: data.weight,
        dimensions: data.dimensions,
        burnTime: data.burnTime,
        scent: data.scent,
        material: data.material,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Create Product Error:', error);
    return NextResponse.json({ error: 'Ürün oluşturulurken hata oluştu' }, { status: 500 });
  }
}
