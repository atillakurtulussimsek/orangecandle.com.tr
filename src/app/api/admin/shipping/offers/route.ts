import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getShipmentOffers } from '@/lib/geliver';

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

    const { searchParams } = new URL(req.url);
    const shipmentId = searchParams.get('shipmentId');

    if (!shipmentId) {
      return NextResponse.json({ error: 'shipmentId parametresi gereklidir' }, { status: 400 });
    }

    // Get offers from Geliver
    const result = await getShipmentOffers(shipmentId);

    console.log('Geliver offers result:', {
      success: result.success,
      hasData: !!result.data,
      offers: result.data?.offers,
      cheapest: result.data?.cheapest,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Teklifler alınamadı',
          details: result.details,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shipment: result.data.shipment,
      offers: result.data.offers,
      cheapest: result.data.cheapest,
    });
  } catch (error: any) {
    console.error('Get offers error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası', details: error.message },
      { status: 500 }
    );
  }
}
