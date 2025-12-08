import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Ayarları getir
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

    // Tüm ayarları getir
    const settings = await prisma.siteSetting.findMany({
      orderBy: { category: 'asc' },
    });

    // Kategoriye göre grupla
    const grouped = settings.reduce((acc: any, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    return NextResponse.json({ settings: grouped });
  } catch (error: any) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Ayarlar yüklenirken hata oluştu', details: error.message },
      { status: 500 }
    );
  }
}

// Ayarları güncelle
export async function PUT(req: NextRequest) {
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
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'Geçersiz veri formatı' }, { status: 400 });
    }

    // Ayarları toplu güncelle
    const updates = await Promise.all(
      settings.map(async (setting: any) => {
        return prisma.siteSetting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            updatedAt: new Date(),
          },
          create: {
            key: setting.key,
            value: setting.value,
            category: setting.category,
            label: setting.label,
            type: setting.type,
            description: setting.description,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Ayarlar güncellendi',
      updated: updates.length,
    });
  } catch (error: any) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Ayarlar güncellenirken hata oluştu', details: error.message },
      { status: 500 }
    );
  }
}
