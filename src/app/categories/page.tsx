'use client';

import Link from 'next/link';
import Image from 'next/image';

const categories = [
  {
    id: '1',
    name: 'Kokulu Mumlar',
    slug: 'kokulu-mumlar',
    description: 'Doğal esanslarla hazırlanmış özel kokulu mumlar',
    image: 'https://images.unsplash.com/photo-1602874801006-be37a82310b9?w=800&h=600&fit=crop',
    productCount: 24,
    featured: true,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: '2',
    name: 'Dekoratif Mumlar',
    slug: 'dekoratif-mumlar',
    description: 'Evinizi güzelleştirecek özel tasarım mumlar',
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&h=600&fit=crop',
    productCount: 18,
    featured: true,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: '3',
    name: 'Hediyelik Setler',
    slug: 'hediyelik-setler',
    description: 'Özel günleriniz için hazırlanmış mum setleri',
    image: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800&h=600&fit=crop',
    productCount: 12,
    featured: true,
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: '4',
    name: 'Mum Aksesuarları',
    slug: 'aksesuar',
    description: 'Mumlarınız için özel aksesuar ve fitiller',
    image: 'https://images.unsplash.com/photo-1615485500034-c10253d1e262?w=800&h=600&fit=crop',
    productCount: 8,
    featured: false,
    gradient: 'from-green-500 to-teal-500',
  },
  {
    id: '5',
    name: 'Sezonluk Koleksiyon',
    slug: 'sezonluk-koleksiyon',
    description: 'Mevsime özel tasarlanmış mum koleksiyonları',
    image: 'https://images.unsplash.com/photo-1602874801006-be37a82310b9?w=800&h=600&fit=crop',
    productCount: 15,
    featured: false,
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    id: '6',
    name: 'Özel Tasarım',
    slug: 'ozel-tasarim',
    description: 'Sizin için özel olarak tasarlanmış mumlar',
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&h=600&fit=crop',
    productCount: 6,
    featured: false,
    gradient: 'from-pink-500 to-rose-500',
  },
];

export default function CategoriesPage() {
  const featuredCategories = categories.filter(cat => cat.featured);
  const otherCategories = categories.filter(cat => !cat.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Breadcrumb */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-orange-500 transition">
              Ana Sayfa
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium">Kategoriler</span>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="container mx-auto px-4 pt-12 sm:pt-16 pb-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg shadow-orange-200 mb-6 transform hover:scale-110 transition-transform duration-300">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Mum Kategorileri
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Farklı kategorilerdeki özel koleksiyonlarımızı keşfedin
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Featured Categories */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Öne Çıkan Kategoriler
              </h2>
              <p className="text-gray-600">En popüler mum koleksiyonlarımız</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCategories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${category.gradient} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                  
                  {/* Product Count Badge */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-sm font-semibold text-gray-900">
                      {category.productCount} Ürün
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {category.description}
                  </p>
                  
                  <div className="flex items-center text-orange-500 font-medium group-hover:gap-3 transition-all">
                    <span>Ürünleri İncele</span>
                    <svg 
                      className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Hover Border Effect */}
                <div className="absolute inset-0 border-2 border-orange-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Link>
            ))}
          </div>
        </div>

        {/* Other Categories */}
        {otherCategories.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Diğer Kategoriler
                </h2>
                <p className="text-gray-600">Keşfedilmeyi bekleyen özel koleksiyonlar</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Gradient Overlay on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-20 transition-opacity`} />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-500 transition">
                        {category.name}
                      </h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                        {category.productCount} Ürün
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-56 h-56 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />
          
          <div className="relative z-10">
            <div className="inline-block mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Aradığınızı Bulamadınız mı?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Tüm ürünlerimizi keşfedin veya özel isteğiniz için bizimle iletişime geçin
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-orange-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Tüm Ürünler
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                İletişime Geç
              </Link>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Kaliteli Ürünler</h3>
            <p className="text-gray-600 text-sm">
              Tüm ürünlerimiz doğal malzemelerden el yapımı olarak üretilmektedir
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hızlı Teslimat</h3>
            <p className="text-gray-600 text-sm">
              500 TL üzeri siparişlerinizde ücretsiz kargo imkanı
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Müşteri Memnuniyeti</h3>
            <p className="text-gray-600 text-sm">
              Binlerce mutlu müşterimiz ve yüksek memnuniyet oranımız
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
