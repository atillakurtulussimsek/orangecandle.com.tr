import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createSenderAddress } from '@/lib/geliver';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const {
      name,
      email,
      phone,
      address1,
      cityName,
      cityCode,
      districtName,
      zip,
      shortName,
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !address1 || !cityName || !cityCode || !districtName || !zip) {
      return NextResponse.json(
        {
          error: 'Eksik alan var',
          required: ['name', 'email', 'phone', 'address1', 'cityName', 'cityCode', 'districtName', 'zip'],
        },
        { status: 400 }
      );
    }

    // Create sender address
    const result = await createSenderAddress({
      name,
      email,
      phone,
      address1,
      countryCode: 'TR',
      cityName,
      cityCode,
      districtName,
      zip,
      shortName,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Gönderici adresi oluşturulamadı',
          details: result.details,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sender: result.data,
      message: 'Gönderici adresi oluşturuldu. ID\'yi kaydedin!',
    });
  } catch (error: any) {
    console.error('Create sender error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası', details: error.message },
      { status: 500 }
    );
  }
}
