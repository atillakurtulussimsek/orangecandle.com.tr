import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { logActivity } from '@/lib/activityLogger';

// GET /api/cart - Sepeti getir
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    // Parse product images
    const items = cartItems.map((item) => ({
      ...item,
      product: {
        ...item.product,
        images: JSON.parse(item.product.images),
        tags: item.product.tags ? JSON.parse(item.product.tags) : [],
      },
    }));

    // Log activity
    logActivity({
      userId: user.id,
      action: 'CART_VIEW',
      category: 'CART',
      description: `Sepet görüntülendi (${items.length} ürün)`,
      metadata: { itemCount: items.length, totalItems: items.reduce((sum, item) => sum + item.quantity, 0) },
      request,
      statusCode: 200,
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Cart API Error:', error);
    return NextResponse.json({ error: 'Sepet yüklenirken hata oluştu' }, { status: 500 });
  }
}

// POST /api/cart - Sepete ürün ekle
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    const { productId, quantity } = await request.json();

    // Ürün kontrolü
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ error: 'Yetersiz stok' }, { status: 400 });
    }

    // Sepette varsa güncelle, yoksa ekle
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: productId,
        },
      },
    });

    let cartItem;
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true },
      });
      
      // Log update
      logActivity({
        userId: user.id,
        action: 'CART_UPDATE',
        category: 'CART',
        description: `Sepetteki ürün miktarı güncellendi: ${product.name}`,
        metadata: { 
          productId, 
          productName: product.name, 
          oldQuantity: existingItem.quantity, 
          newQuantity: existingItem.quantity + quantity,
          addedQuantity: quantity,
          price: product.price 
        },
        request: request as NextRequest,
        statusCode: 201,
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId: productId,
          quantity: quantity,
        },
        include: { product: true },
      });
      
      // Log addition
      logActivity({
        userId: user.id,
        action: 'CART_ADD',
        category: 'CART',
        description: `Sepete ürün eklendi: ${product.name}`,
        metadata: { 
          productId, 
          productName: product.name, \n          quantity,
          price: Number(product.price),
          totalPrice: Number(product.price) * quantity
        },
        request: request as NextRequest,
        statusCode: 201,
      });
    }

    return NextResponse.json(cartItem, { status: 201 });
  } catch (error) {
    console.error('Add to Cart Error:', error);
    return NextResponse.json({ error: 'Sepete eklenirken hata oluştu' }, { status: 500 });
  }
}

// DELETE /api/cart - Sepeti temizle
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    const deletedCount = await prisma.cartItem.count({
      where: { userId: user.id },
    });

    await prisma.cartItem.deleteMany({
      where: { userId: user.id },
    });

    // Log activity
    logActivity({
      userId: user.id,
      action: 'CART_CLEAR',
      category: 'CART',
      description: `Sepet temizlendi (${deletedCount} ürün silindi)`,
      metadata: { deletedItemCount: deletedCount },
      request: request as NextRequest,
      statusCode: 200,
    });

    return NextResponse.json({ message: 'Sepet temizlendi' });
  } catch (error) {
    console.error('Clear Cart Error:', error);
    return NextResponse.json({ error: 'Sepet temizlenirken hata oluştu' }, { status: 500 });
  }
}
