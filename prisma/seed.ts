import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Veritabanı seed işlemi başlıyor...');

  // Önce mevcut verileri temizle (dikkatli kullanın!)
  // await prisma.review.deleteMany();
  // await prisma.orderItem.deleteMany();
  // await prisma.order.deleteMany();
  // await prisma.cartItem.deleteMany();
  // await prisma.product.deleteMany();
  // await prisma.category.deleteMany();
  // await prisma.address.deleteMany();
  // await prisma.user.deleteMany();

  // Test Kullanıcısı Oluştur
  const hashedPassword = await bcrypt.hash('test1234', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@orangecandle.com.tr' },
    update: {},
    create: {
      email: 'test@orangecandle.com.tr',
      password: hashedPassword,
      name: 'Test Kullanıcı',
      phone: '05551234567',
    },
  });

  console.log('✅ Test kullanıcısı oluşturuldu:', testUser.email);

  // Admin Kullanıcısı Oluştur
  const adminPassword = await bcrypt.hash('admin1234', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@orangecandle.com.tr' },
    update: {},
    create: {
      email: 'admin@orangecandle.com.tr',
      password: adminPassword,
      name: 'Admin Kullanıcı',
      phone: '05551234568',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin kullanıcısı oluşturuldu:', adminUser.email);

  // Kategoriler Oluştur
  const categories = [
    {
      name: 'Kokulu Mumlar',
      slug: 'kokulu-mumlar',
      description: 'Doğal esanslarla hazırlanmış özel kokulu mumlar',
    },
    {
      name: 'Dekoratif Mumlar',
      slug: 'dekoratif-mumlar',
      description: 'Evinizi güzelleştirecek özel tasarım mumlar',
    },
    {
      name: 'Hediyelik Setler',
      slug: 'hediyelik-setler',
      description: 'Özel günleriniz için hazırlanmış mum setleri',
    },
    {
      name: 'Mum Aksesuarları',
      slug: 'mum-aksesuarlari',
      description: 'Mumlarınız için özel aksesuar ve fitiller',
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log('✅ Kategoriler oluşturuldu');

  // Örnek Ürünler Oluştur
  const category1 = await prisma.category.findUnique({ where: { slug: 'kokulu-mumlar' } });
  const category2 = await prisma.category.findUnique({ where: { slug: 'dekoratif-mumlar' } });

  if (category1) {
    await prisma.product.upsert({
      where: { slug: 'lavanta-kokulu-mum' },
      update: {},
      create: {
        name: 'Lavanta Kokulu El Yapımı Mum',
        slug: 'lavanta-kokulu-mum',
        sku: 'OC-LAV-001',
        description: 'El yapımı lavanta kokulu mum. Doğal soya mumu ve lavanta esansı ile üretilmiştir.',
        price: 149.90,
        comparePrice: 199.90,
        stock: 50,
        categoryId: category1.id,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1602874801006-be37a82310b9?w=500&h=500&fit=crop',
          'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&h=500&fit=crop',
        ]),
        featured: true,
        bestseller: true,
        newArrival: false,
        onSale: true,
        scent: 'Lavanta',
        material: 'Soya Mumu',
        burnTime: '40-45 saat',
      },
    });

    await prisma.product.upsert({
      where: { slug: 'vanilya-aromalı-mum' },
      update: {},
      create: {
        name: 'Vanilya Aromalı Seramik Mum',
        slug: 'vanilya-aromalı-mum',
        sku: 'OC-VAN-002',
        description: 'Özel seramik kapta vanilya aromalı el yapımı mum.',
        price: 179.90,
        stock: 30,
        categoryId: category1.id,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&h=500&fit=crop',
        ]),
        featured: true,
        bestseller: false,
        newArrival: true,
        onSale: false,
        scent: 'Vanilya',
        material: 'Soya Mumu',
        burnTime: '35-40 saat',
      },
    });
  }

  if (category2) {
    await prisma.product.upsert({
      where: { slug: 'minimalist-beton-mum' },
      update: {},
      create: {
        name: 'Minimalist Beton Mum Seti',
        slug: 'minimalist-beton-mum',
        sku: 'OC-BET-003',
        description: 'Modern tasarım beton kapta mum seti',
        price: 299.90,
        stock: 20,
        categoryId: category2.id,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=500&h=500&fit=crop',
        ]),
        featured: true,
        bestseller: false,
        newArrival: true,
        onSale: false,
        material: 'Soya Mumu',
        burnTime: '50-55 saat',
      },
    });
  }

  console.log('✅ Ürünler oluşturuldu');

  console.log('\n🎉 Seed işlemi tamamlandı!');
  console.log('\n📝 Test Hesabı:');
  console.log('Email: test@orangecandle.com.tr');
  console.log('Şifre: test1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
