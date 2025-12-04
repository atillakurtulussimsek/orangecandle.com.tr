import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { downloadLabelPDF, downloadLabelHTML } from '@/lib/geliver';

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
    const labelUrl = searchParams.get('url');
    const format = searchParams.get('format') || 'pdf'; // pdf veya html

    if (!labelUrl) {
      return NextResponse.json({ error: 'url parametresi gereklidir' }, { status: 400 });
    }

    if (format === 'pdf') {
      // Download PDF label
      const result = await downloadLabelPDF(labelUrl);

      if (!result.success) {
        return NextResponse.json(
          {
            error: result.error || 'Etiket indirilemedi',
            details: result.details,
          },
          { status: 500 }
        );
      }

      // Return PDF as response
      return new NextResponse(Buffer.from(result.data as Uint8Array), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="kargo-etiketi-${Date.now()}.pdf"`,
        },
      });
    } else if (format === 'html') {
      // Download HTML label
      const result = await downloadLabelHTML(labelUrl);

      if (!result.success) {
        return NextResponse.json(
          {
            error: result.error || 'HTML etiket indirilemedi',
            details: result.details,
          },
          { status: 500 }
        );
      }

      // Return HTML as response
      return new NextResponse(result.data, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="kargo-etiketi-${Date.now()}.html"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Geçersiz format. pdf veya html olmalıdır' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Download label error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası', details: error.message },
      { status: 500 }
    );
  }
}
