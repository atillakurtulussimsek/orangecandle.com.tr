import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserActivityLogs, getUserActivityStats } from '@/lib/activityLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    // Sadece admin erişebilir
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const stats = searchParams.get('stats') === 'true';
    const days = parseInt(searchParams.get('days') || '30');

    if (!userId) {
      return NextResponse.json({ error: 'userId parametresi gerekli' }, { status: 400 });
    }

    if (stats) {
      // İstatistik döndür
      const statistics = await getUserActivityStats(userId, days);
      return NextResponse.json(statistics);
    }

    // Logları döndür
    const result = await getUserActivityLogs(userId, {
      limit,
      offset,
      category: category as any,
      action: action as any,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Get activity logs error:', error);
    return NextResponse.json(
      { error: 'Loglar yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
