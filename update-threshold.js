import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSettings() {
  // Update free shipping threshold to 250
  await prisma.siteSetting.update({
    where: { key: 'free_shipping_threshold' },
    data: { value: '250' }
  });

  console.log('✅ Ücretsiz Kargo Eşiği 250 TL olarak güncellendi!');

  // Verify
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'free_shipping_threshold' }
  });

  console.log(`📦 Yeni değer: ${setting?.value} TL`);

  await prisma.$disconnect();
}

updateSettings().catch(console.error);
