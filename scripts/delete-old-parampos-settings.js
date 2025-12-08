const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteOldSettings() {
  try {
    const result = await prisma.siteSetting.deleteMany({
      where: {
        key: {
          in: ['parampos_merchant_id', 'parampos_merchant_key', 'parampos_production_mode']
        }
      }
    });
    
    console.log(`✅ ${result.count} gereksiz ParamPOS ayarı silindi`);
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteOldSettings();
