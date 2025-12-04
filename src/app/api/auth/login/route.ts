import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-posta ve şifre gereklidir' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'E-posta veya şifre hatalı' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Başarısız giriş denemesi logla
      await logActivity({
        userId: user.id,
        action: 'LOGIN',
        category: 'AUTH',
        description: 'Başarısız giriş denemesi - Yanlış şifre',
        request,
        statusCode: 401,
        errorMessage: 'Şifre hatalı',
      });

      return NextResponse.json(
        { error: 'E-posta veya şifre hatalı' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Başarılı giriş logla
    await logActivity({
      userId: user.id,
      action: user.role === 'ADMIN' ? 'ADMIN_LOGIN' : 'LOGIN',
      category: user.role === 'ADMIN' ? 'ADMIN' : 'AUTH',
      description: user.role === 'ADMIN' 
        ? `Sistem yöneticisi giriş yaptı - ${user.name} (${user.email})`
        : `Kullanıcı başarıyla giriş yaptı - ${user.name} (${user.email})`,
      metadata: {
        email: user.email,
        role: user.role,
      },
      request,
      statusCode: 200,
    });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        user: userWithoutPassword,
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Giriş yapılırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
