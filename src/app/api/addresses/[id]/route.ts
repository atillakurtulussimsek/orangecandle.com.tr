import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const body = await request.json();

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { id: params.id, userId: decoded.userId },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Adres bulunamadı' }, { status: 404 });
    }

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
        where: { userId: decoded.userId, isDefault: true, id: { not: params.id } },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: params.id },
      data: {
        title,
        fullName,
        phone,
        address,
        city,
        district,
        zipCode,
        isDefault,
        isBillingAddress: isBillingAddress || false,
        companyName: companyName || null,
        taxNumber: taxNumber || null,
        taxOffice: taxOffice || null,
      },
    });

    // Log activity
    logActivity({
      userId: decoded.userId,
      action: isDefault && !existingAddress.isDefault ? 'ADDRESS_SET_DEFAULT' : 'ADDRESS_UPDATE',
      category: 'ADDRESS',
      description: isDefault && !existingAddress.isDefault 
        ? `Varsayılan adres değiştirildi: ${title}` 
        : `Adres güncellendi: ${title} - ${city}/${district}`,
      metadata: { 
        addressId: params.id,
        title,
        city,
        district,
        isDefault,
        wasDefault: existingAddress.isDefault,
        isBillingAddress: isBillingAddress || false,
        changes: Object.keys(body)
      },
      request,
      statusCode: 200,
    });

    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error('Update address error:', error);
    return NextResponse.json(
      { error: 'Adres güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { id: params.id, userId: decoded.userId },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Adres bulunamadı' }, { status: 404 });
    }

    await prisma.address.delete({
      where: { id: params.id },
    });

    // Log activity
    logActivity({
      userId: decoded.userId,
      action: 'ADDRESS_DELETE',
      category: 'ADDRESS',
      description: `Adres silindi: ${existingAddress.title} - ${existingAddress.city}/${existingAddress.district}`,
      metadata: { 
        addressId: params.id,
        title: existingAddress.title,
        city: existingAddress.city,
        district: existingAddress.district,
        wasDefault: existingAddress.isDefault
      },
      request,
      statusCode: 200,
    });

    return NextResponse.json({ message: 'Adres silindi' });
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json(
      { error: 'Adres silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
