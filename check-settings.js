import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSettings() {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: ['free_shipping_threshold', 'default_shipping_cost']
      }
    }
  });

  console.log('\n📦 Current Settings in Database:');
  console.log('================================');
  settings.forEach(s => {
    console.log(`${s.label}: ${s.value} (key: ${s.key})`);
  });
  console.log('================================\n');

  await prisma.$disconnect();
}

checkSettings().catch(console.error);
