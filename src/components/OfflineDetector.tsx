'use client';

import { useEffect, useState } from 'react';

export default function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // İlk yüklemede online durumunu kontrol et
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      // 3 saniye sonra "tekrar online" bildirimini gizle
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification) return null;

  return (
    <>
      {/* Offline Notification */}
      {!isOnline && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pointer-events-none">
          <div className="mt-4 mx-4 sm:mx-auto max-w-md w-full pointer-events-auto animate-slide-down">
            <div className="bg-red-500 text-white rounded-lg shadow-2xl p-4 flex items-center gap-3 border-2 border-red-600">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">İnternet Bağlantısı Kesildi</h3>
                <p className="text-sm text-red-100">
                  Lütfen internet bağlantınızı kontrol edin. Bazı özellikler çalışmayabilir.
                </p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Online Notification */}
      {isOnline && showNotification && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pointer-events-none">
          <div className="mt-4 mx-4 sm:mx-auto max-w-md w-full pointer-events-auto animate-slide-down">
            <div className="bg-green-500 text-white rounded-lg shadow-2xl p-4 flex items-center gap-3 border-2 border-green-600">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Bağlantı Yeniden Kuruldu</h3>
                <p className="text-sm text-green-100">
                  İnternet bağlantınız geri geldi. Normal şekilde kullanmaya devam edebilirsiniz.
                </p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Offline Bar (bottom) */}
      {!isOnline && (
        <div className="fixed bottom-0 left-0 right-0 z-[9998] pointer-events-none">
          <div className="bg-gradient-to-r from-red-600 to-red-500 text-white py-2 px-4 shadow-lg border-t-2 border-red-700 pointer-events-auto">
            <div className="container mx-auto flex items-center justify-center gap-3 text-sm sm:text-base">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-medium">Çevrimdışı Mod</span>
              <span className="hidden sm:inline text-red-100">•</span>
              <span className="hidden sm:inline text-red-100">İnternet bağlantınız yok</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
