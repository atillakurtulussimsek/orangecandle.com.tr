import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Bakım ayarlarını al
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: ['maintenance_mode', 'maintenance_end_time', 'maintenance_message'],
        },
      },
    });

    const maintenanceMode = settings.find((s) => s.key === 'maintenance_mode')?.value === 'true';
    const maintenanceEndTime = settings.find((s) => s.key === 'maintenance_end_time')?.value || null;
    const maintenanceMessage = settings.find((s) => s.key === 'maintenance_message')?.value || 
      'Sistemimiz şu an bakımda. Kısa süre içinde geri döneceğiz.';

    // Bakım süresi dolmuşsa otomatik kapat
    if (maintenanceMode && maintenanceEndTime) {
      const endTime = new Date(maintenanceEndTime);
      const now = new Date();

      if (now > endTime) {
        // Bakım modunu kapat
        await prisma.siteSetting.update({
          where: { key: 'maintenance_mode' },
          data: { value: 'false' },
        });

        return NextResponse.json({
          maintenanceMode: false,
          maintenanceEndTime: null,
          maintenanceMessage: null,
        });
      }
    }

    return NextResponse.json({
      maintenanceMode,
      maintenanceEndTime,
      maintenanceMessage,
    });
  } catch (error) {
    console.error('Bakım bilgileri alınamadı:', error);
    return NextResponse.json(
      { error: 'Bakım bilgileri alınamadı' },
      { status: 500 }
    );
  }
}
