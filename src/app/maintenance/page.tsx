'use client';

import { useEffect, useState } from 'react';

export default function MaintenancePage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [message, setMessage] = useState('Sistemimiz şu an bakımda. Kısa süre içinde geri döneceğiz.');
  const [endTime, setEndTime] = useState<Date | null>(null);

  useEffect(() => {
    // Bakım bilgilerini al
    const fetchMaintenanceInfo = async () => {
      try {
        const response = await fetch('/api/maintenance');
        if (response.ok) {
          const data = await response.json();
          if (data.maintenanceEndTime) {
            setEndTime(new Date(data.maintenanceEndTime));
          }
          if (data.maintenanceMessage) {
            setMessage(data.maintenanceMessage);
          }
        }
      } catch (error) {
        console.error('Bakım bilgileri alınamadı:', error);
      }
    };

    fetchMaintenanceInfo();
  }, []);

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = endTime.getTime();
      const difference = end - now;

      if (difference <= 0) {
        // Bakım süresi doldu, sayfayı yenile
        window.location.reload();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full shadow-2xl">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
        </div>

        {/* Başlık */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          🕯️ Orange Candle
        </h1>

        <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-6">
          Yakında Yeniden Sizlerle!
        </h2>

        {/* Mesaj */}
        <p className="text-lg text-gray-600 mb-12 max-w-xl mx-auto">
          {message}
        </p>

        {/* Geri Sayım */}
        {endTime && (
          <div className="mb-12">
            <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
              {/* Günler */}
              <div className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform">
                <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-2">
                  {timeLeft.days}
                </div>
                <div className="text-sm md:text-base text-gray-600 font-medium">
                  Gün
                </div>
              </div>

              {/* Saatler */}
              <div className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform">
                <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-2">
                  {timeLeft.hours}
                </div>
                <div className="text-sm md:text-base text-gray-600 font-medium">
                  Saat
                </div>
              </div>

              {/* Dakikalar */}
              <div className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform">
                <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-2">
                  {timeLeft.minutes}
                </div>
                <div className="text-sm md:text-base text-gray-600 font-medium">
                  Dakika
                </div>
              </div>

              {/* Saniyeler */}
              <div className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform">
                <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-2">
                  {timeLeft.seconds}
                </div>
                <div className="text-sm md:text-base text-gray-600 font-medium">
                  Saniye
                </div>
              </div>
            </div>
          </div>
        )}

        {/* İletişim Bilgileri */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Bize Ulaşın
          </h3>
          <div className="space-y-3 text-gray-600">
            <p className="flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              info@orangecandle.com.tr
            </p>
            <p className="flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              +90 (XXX) XXX XX XX
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-gray-500 text-sm">
          <p>© 2025 Orange Candle. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  );
}
