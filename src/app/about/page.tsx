'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
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
            <span className="text-gray-900 font-medium">Hakkımızda</span>
          </div>
        </div>
      </div>

      {/* Hero Section - Modern & Minimal */}
      <div className="container mx-auto px-4 pt-12 sm:pt-16 pb-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg shadow-orange-200 mb-6 transform hover:scale-110 transition-transform duration-300">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Orange Candle Hikayemiz
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            El yapımı mumlarla evinize sıcaklık ve huzur katıyoruz. Her ürün, sevgiyle ve özenle üretilmektedir.
          </p>
        </div>
      </div>

      {/* Our Story */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="relative h-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl shadow-orange-200/50 group">
              <Image
                src="https://images.unsplash.com/photo-1602874801006-be37a82310b9?w=800&h=800&fit=crop"
                alt="Orange Candle Atölyesi"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-orange-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-50 border border-orange-200 text-orange-600 rounded-full text-sm font-bold mb-6 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Hikayemiz
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Tutkuyla Başlayan Bir Yolculuk
            </h2>
            <div className="space-y-5 text-gray-700 leading-relaxed text-lg">
              <p className="relative pl-6 border-l-4 border-orange-300">
                Orange Candle, 2018 yılında el yapımı mum üretme tutkusuyla küçük bir atölyede başladı. 
                Kurucumuzun doğal malzemeler kullanarak, çevre dostu ve sağlıklı mumlar üretme hayali, 
                bugün binlerce müşteriye ulaşan bir markaya dönüştü.
              </p>
              <p>
                Her mumumumuz, özenle seçilmiş doğal soya mumu, organik esanslar ve pamuklu fitillerle 
                el emeği göz nuru üretilmektedir. Amacımız, sadece mum satmak değil, evinize sıcaklık, 
                huzur ve güzel kokular katmaktır.
              </p>
              <p className="bg-gradient-to-r from-orange-50 to-transparent p-5 rounded-2xl border-l-4 border-orange-400">
                💚 Sürdürülebilirlik ve çevre dostu üretim bizim için çok önemlidir. Tüm ürünlerimizde 
                doğal malzemeler kullanıyor, ambalajlarımızı geri dönüştürülebilir materyallerden 
                seçiyoruz.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-50 border border-orange-200 text-orange-600 rounded-full text-sm font-bold mb-4 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Değerlerimiz
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Bizim İçin Önemli Olan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Orange Candle olarak her gün çalışırken rehber aldığımız temel değerlerimiz
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:border-orange-300 hover:bg-white transition-all duration-300 hover:shadow-xl hover:shadow-orange-100 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-orange-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">El İşçiliği</h3>
              <p className="text-gray-600 text-center">
                Her mumumumuz özenle ve sevgiyle el yapımı olarak üretilir
              </p>
            </div>

            <div className="group bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:border-green-300 hover:bg-white transition-all duration-300 hover:shadow-xl hover:shadow-green-100 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-green-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Sürdürülebilirlik</h3>
              <p className="text-gray-600 text-center">
                Çevre dostu üretim ve geri dönüştürülebilir ambalajlar
              </p>
            </div>

            <div className="group bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:border-blue-300 hover:bg-white transition-all duration-300 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-blue-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Kalite</h3>
              <p className="text-gray-600 text-center">
                Sadece en kaliteli doğal malzemeleri kullanıyoruz
              </p>
            </div>

            <div className="group bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:border-purple-300 hover:bg-white transition-all duration-300 hover:shadow-xl hover:shadow-purple-100 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-purple-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Müşteri Odaklı</h3>
              <p className="text-gray-600 text-center">
                Müşteri memnuniyeti bizim için her şeyden önce gelir
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 sm:p-8 text-center border border-orange-200 hover:shadow-xl hover:shadow-orange-200 transition-all duration-300 hover:-translate-y-1">
            <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform inline-block">2018</div>
            <div className="text-gray-700 font-semibold">Kuruluş Yılı</div>
          </div>
          <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 sm:p-8 text-center border border-blue-200 hover:shadow-xl hover:shadow-blue-200 transition-all duration-300 hover:-translate-y-1">
            <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform inline-block">10K+</div>
            <div className="text-gray-700 font-semibold">Mutlu Müşteri</div>
          </div>
          <div className="group bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 sm:p-8 text-center border border-green-200 hover:shadow-xl hover:shadow-green-200 transition-all duration-300 hover:-translate-y-1">
            <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform inline-block">50+</div>
            <div className="text-gray-700 font-semibold">Ürün Çeşidi</div>
          </div>
          <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 sm:p-8 text-center border border-purple-200 hover:shadow-xl hover:shadow-purple-200 transition-all duration-300 hover:-translate-y-1">
            <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform inline-block">%100</div>
            <div className="text-gray-700 font-semibold">El Yapımı</div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-50 border border-orange-200 text-orange-600 rounded-full text-sm font-bold mb-4 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Ekibimiz
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Orange Candle Ailesi
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tutkulu ve yetenekli ekibimizle her gün daha iyi ürünler üretmek için çalışıyoruz
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Ayşe Yılmaz', role: 'Kurucu & CEO', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
              { name: 'Mehmet Demir', role: 'Üretim Sorumlusu', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' },
              { name: 'Zeynep Kaya', role: 'Tasarım Direktörü', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop' },
            ].map((member, index) => (
              <div key={index} className="group bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-200/50 hover:border-orange-300 hover:bg-white hover:shadow-2xl hover:shadow-orange-100 transition-all duration-300 hover:-translate-y-2">
                <div className="relative h-80 overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <h3 className="text-2xl font-bold mb-1">{member.name}</h3>
                    <p className="text-orange-300 font-semibold">{member.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 pb-20">
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 rounded-3xl p-10 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-orange-200">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5">
              El Yapımı Mumlarımızı Keşfedin
            </h2>
            <p className="text-lg sm:text-xl mb-10 opacity-95 leading-relaxed">
              Özenle üretilmiş, doğal malzemelerden yapılmış mum koleksiyonumuzu inceleyin
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/products"
                className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-orange-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-2xl hover:shadow-xl hover:scale-105"
              >
                Ürünleri İncele
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="group inline-flex items-center gap-3 px-10 py-5 border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white hover:text-orange-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                İletişime Geç
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
