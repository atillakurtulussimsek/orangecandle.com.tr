'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ThreeDSecurePage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const htmlContent = searchParams.get('html');
    
    if (htmlContent) {
      // HTML içeriğini decode et
      const decodedHtml = decodeURIComponent(htmlContent);
      
      console.log('3D Secure HTML:', decodedHtml);
      
      // Yeni bir document oluştur ve HTML'i yaz
      document.open();
      document.write(decodedHtml);
      document.close();
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          3D Secure Yükleniyor
        </h1>

        <p className="text-gray-600 mb-6">
          Bankanızın güvenlik sayfasına yönlendiriliyorsunuz...
        </p>

        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Güvenli Bağlantı</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>256-bit Şifreleme</span>
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Lütfen sayfayı kapatmayın
        </p>
      </div>
    </div>
  );
}
