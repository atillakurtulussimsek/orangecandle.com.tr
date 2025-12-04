import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getWebhookStats } from '@/lib/webhookLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: NextRequest) {
  try {
    // Admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için admin yetkisi gereklidir' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source') || undefined;
    const days = parseInt(searchParams.get('days') || '7');

    const stats = await getWebhookStats(source, days);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching webhook stats:', error);
    return NextResponse.json(
      { error: 'İstatistikler alınırken hata oluştu', details: error.message },
      { status: 500 }
    );
  }
}
