import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const addresses = await prisma.address.findMany({
      where: { userId: decoded.userId },
      orderBy: { isDefault: 'desc' },
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Get addresses error:', error);
    return NextResponse.json(
      { error: 'Adresler yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const body = await request.json();

    const { 
      title, 
      fullName, 
      phone, 
      address, 
      city, 
      district, 
      zipCode, 
      isDefault,
      isBillingAddress,
      companyName,
      taxNumber,
      taxOffice
    } = body;

    // If this is set as default, unset all other default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: decoded.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: decoded.userId,
        title,
        fullName,
        phone,
        address,
        city,
        district,
        zipCode,
        isDefault: isDefault || false,
        isBillingAddress: isBillingAddress || false,
        companyName: companyName || null,
        taxNumber: taxNumber || null,
        taxOffice: taxOffice || null,
      },
    });

    // Log activity
    logActivity({
      userId: decoded.userId,
      action: 'ADDRESS_ADD',
      category: 'ADDRESS',
      description: `Yeni adres eklendi: ${title} - ${city}/${district}`,
      metadata: { 
        addressId: newAddress.id,
        title,
        city,
        district,
        isDefault: isDefault || false,
        isBillingAddress: isBillingAddress || false,
        hasCompanyInfo: !!(companyName && taxNumber)
      },
      request,
      statusCode: 201,
    });

    return NextResponse.json(newAddress, { status: 201 });
  } catch (error) {
    console.error('Create address error:', error);
    return NextResponse.json(
      { error: 'Adres eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
