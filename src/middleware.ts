import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from './lib/prisma';

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Localhost'tan gelen istekleri bypass et
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return NextResponse.next();
  }

  // Bakım sayfası ve API endpoint'lerini bypass et
  if (
    pathname.startsWith('/maintenance') ||
    pathname.startsWith('/api/maintenance') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg')
  ) {
    return NextResponse.next();
  }

  try {
    // Bakım modu kontrolü
    const maintenanceSetting = await prisma.siteSetting.findUnique({
      where: { key: 'maintenance_mode' },
    });

    const isMaintenanceMode = maintenanceSetting?.value === 'true';

    if (isMaintenanceMode) {
      // Bakım bitiş zamanını kontrol et
      const endTimeSetting = await prisma.siteSetting.findUnique({
        where: { key: 'maintenance_end_time' },
      });

      if (endTimeSetting?.value) {
        const endTime = new Date(endTimeSetting.value);
        const now = new Date();

        if (now > endTime) {
          // Bakım süresi doldu, modu kapat
          await prisma.siteSetting.update({
            where: { key: 'maintenance_mode' },
            data: { value: 'false' },
          });

          return NextResponse.next();
        }
      }

      // Bakım sayfasına yönlendir
      const maintenanceUrl = request.nextUrl.clone();
      maintenanceUrl.pathname = '/maintenance';
      return NextResponse.redirect(maintenanceUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware hatası:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
