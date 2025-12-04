import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    // Get stats
    const [
      totalOrders,
      totalProducts,
      totalCustomers,
      pendingOrders,
      orders,
      lowStockProducts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.order.count({ where: { orderStatus: 'PENDING' } }),
      prisma.order.findMany({ where: { paymentStatus: 'PAID' } }),
      prisma.product.count({ where: { stock: { lte: 10 } } }),
    ]);

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      totalProducts,
      totalCustomers,
      pendingOrders,
      lowStockProducts,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'İstatistikler yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
