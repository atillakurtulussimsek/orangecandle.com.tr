import HeroSlider from '@/components/HeroSlider';
import Features from '@/components/Features';
import CategoryGrid from '@/components/CategoryGrid';
import ProductGrid from '@/components/ProductGrid';
import prisma from '@/lib/prisma';

async function getHomePageData() {
  try {
    // Slider'ları getir (aktif olanlar)
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    // Kategorileri getir (ürün sayısıyla)
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
      take: 8, // Ana sayfada maksimum 8 kategori göster
    });

    // Öne çıkan ürünleri getir (sadece stokta olanlar veya sipariş alınabilenler)
    const featuredProducts = await prisma.product.findMany({
      where: { 
        featured: true,
        isDeleted: false,
        OR: [
          { stockTracking: false }, // Stok takibi kapalı = her zaman sipariş alınabilir
          { stock: { gt: 0 } }, // Stokta var
          { allowBackorder: true }, // Ön sipariş açık
        ],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 8, // Ana sayfada maksimum 8 ürün göster
    });

    // Kategorileri frontend için formatla
    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image,
      productCount: category._count.products,
    }));

    // Ürünleri frontend için formatla
    const formattedProducts = featuredProducts.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
      images: JSON.parse(product.images as string),
      featured: product.featured,
      bestseller: product.bestseller,
      newArrival: product.newArrival,
      onSale: product.onSale,
      discount: product.discount,
      stock: product.stock,
      stockTracking: product.stockTracking,
      allowBackorder: product.allowBackorder,
      backorderMessage: product.backorderMessage,
      category: product.category,
    }));

    // Stok durumuna göre sıralama
    const sortedProducts = formattedProducts.sort((a, b) => {
      const getPriority = (product: any) => {
        if (!product.stockTracking) return 1; // Her zaman sipariş alınabilir
        if (product.stock > 0) return 2; // Stokta var
        if (product.stock === 0 && product.allowBackorder) return 3; // Ön sipariş
        return 4; // Stokta yok
      };

      return getPriority(a) - getPriority(b);
    });

    return {
      slides,
      categories: formattedCategories,
      products: sortedProducts,
    };
  } catch (error) {
    console.error('Home Page Data Error:', error);
    return {
      slides: [],
      categories: [],
      products: [],
    };
  }
}

export default async function Home() {
  const { slides, categories, products } = await getHomePageData();

  return (
    <>
      {/* Hero Slider */}
      <HeroSlider slides={slides} />

      {/* Features */}
      <Features />

      {/* Featured Products */}
      <ProductGrid
        products={products}
        title="Öne Çıkan Ürünler"
        subtitle="El yapımı, doğal malzemelerden üretilmiş özel ürünlerimiz"
      />

      {/* Categories */}
      <CategoryGrid categories={categories} />

      {/* Newsletter */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5">
              Kampanyalardan Haberdar Olun
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 opacity-95 px-4 leading-relaxed">
              Yeni ürünler, indirimler ve özel tekliflerden ilk siz haberdar olun
            </p>
            <form className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-xl mx-auto px-4">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                className="flex-1 px-6 sm:px-8 py-4 sm:py-5 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/50 shadow-2xl text-sm sm:text-base font-medium"
                required
              />
              <button
                type="submit"
                className="px-8 sm:px-10 py-4 sm:py-5 bg-white text-orange-600 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-xl hover:scale-105 transform text-sm sm:text-base whitespace-nowrap"
              >
                Abone Ol
              </button>
            </form>
            <p className="text-xs sm:text-sm mt-5 sm:mt-6 opacity-90 flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              E-posta adresiniz güvendedir. Spam göndermiyoruz.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
