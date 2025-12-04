import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { logActivity } from '@/lib/activityLogger';

// PUT /api/cart/[id] - Sepet miktarını güncelle
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { quantity } = await request.json();

    const existingItem = await prisma.cartItem.findUnique({
      where: { id: params.id },
      include: { product: true },
    });

    const cartItem = await prisma.cartItem.update({
      where: { id: params.id },
      data: { quantity },
      include: { product: true },
    });

    // Log activity
    logActivity({
      userId: user.id,
      action: 'CART_UPDATE',
      category: 'CART',
      description: `Sepetteki ürün miktarı güncellendi: ${cartItem.product.name}`,
      metadata: { 
        cartItemId: params.id,
        productId: cartItem.product.id,
        productName: cartItem.product.name,
        oldQuantity: existingItem?.quantity || 0,
        newQuantity: quantity,
        price: Number(cartItem.product.price)
      },
      request,
      statusCode: 200,
    });

    return NextResponse.json(cartItem);
  } catch (error) {
    console.error('Update Cart Error:', error);
    return NextResponse.json({ error: 'Sepet güncellenirken hata oluştu' }, { status: 500 });
  }
}

// DELETE /api/cart/[id] - Sepetten ürün sil
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: params.id },
      include: { product: true },
    });

    await prisma.cartItem.delete({
      where: { id: params.id },
    });

    // Log activity
    if (cartItem) {
      logActivity({
        userId: user.id,
        action: 'CART_REMOVE',
        category: 'CART',
        description: `Ürün sepetten silindi: ${cartItem.product.name}`,
        metadata: { 
          cartItemId: params.id,
          productId: cartItem.product.id,
          productName: cartItem.product.name,
          quantity: cartItem.quantity,
          price: Number(cartItem.product.price)
        },
        request,
        statusCode: 200,
      });
    }

    return NextResponse.json({ message: 'Ürün sepetten silindi' });
  } catch (error) {
    console.error('Delete Cart Item Error:', error);
    return NextResponse.json({ error: 'Ürün silinirken hata oluştu' }, { status: 500 });
  }
}
