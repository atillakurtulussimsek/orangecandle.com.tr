'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

interface Slide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string;
  buttonText: string | null;
  buttonLink: string | null;
  bgColor: string | null;
  order: number;
  isActive: boolean;
}

interface HeroSliderProps {
  slides: Slide[];
}

export default function HeroSlider({ slides }: HeroSliderProps) {
  // Eğer veritabanında slider yoksa, bölümü gizle
  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        pagination={{ 
          clickable: true,
          dynamicBullets: true,
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        effect="fade"
        loop={true}
        className="hero-slider h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px]"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative h-full w-full">
              {/* Background Image or Gradient */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                style={slide.image ? {
                  backgroundImage: `url(${slide.image})`,
                } : {}}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgColor || 'from-orange-500/90 to-red-500/90'}`} />
              </div>

              {/* Content */}
              <div className="relative h-full container mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                <div className="max-w-xl lg:max-w-2xl text-white">
                  <p className="text-orange-300 text-sm sm:text-base md:text-lg lg:text-xl font-medium mb-2 sm:mb-3 md:mb-4 animate-fade-in-up">
                    {slide.subtitle}
                  </p>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 sm:mb-4 md:mb-6 leading-tight animate-fade-in-up animation-delay-200">
                    {slide.title}
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 md:mb-10 text-gray-100 animate-fade-in-up animation-delay-400">
                    {slide.description}
                  </p>
                  <Link
                    href={slide.buttonLink || '#'}
                    className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-full font-semibold hover:bg-orange-500 hover:text-white transition-all duration-300 shadow-2xl hover:shadow-orange-500/50 hover:scale-105 transform animate-fade-in-up animation-delay-600"
                  >
                    {slide.buttonText}
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <button className="swiper-button-prev-custom absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all duration-300 group">
        <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gray-800 group-hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button className="swiper-button-next-custom absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all duration-300 group">
        <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gray-800 group-hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
        }
        .hero-slider .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
          background: white;
          opacity: 0.5;
        }
        .hero-slider .swiper-pagination-bullet-active {
          opacity: 1;
          background: #f97316;
        }
        @media (max-width: 640px) {
          .hero-slider .swiper-pagination-bullet {
            width: 8px;
            height: 8px;
          }
        }
      `}</style>
    </div>
  );
}
