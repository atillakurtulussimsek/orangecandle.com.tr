'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentIframePage() {
  const searchParams = useSearchParams();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = searchParams.get('url');
    if (url) {
      setPaymentUrl(decodeURIComponent(url));
    }
  }, [searchParams]);

  if (!paymentUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Ödeme sayfası hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Güvenli Ödeme</h1>
                <p className="text-sm text-gray-600">Parampos tarafından sağlanmaktadır</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="hidden sm:inline">256-bit SSL Güvenlik</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Güvenlik Bilgilendirmesi:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Kart bilgileriniz hiçbir zaman sitemizde saklanmaz</li>
                <li>Tüm bilgileriniz 256-bit SSL ile şifrelenir</li>
                <li>PCI DSS uyumlu güvenli ödeme altyapısı</li>
                <li>3D Secure ile ek güvenlik katmanı</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Payment iFrame */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <iframe
            src={paymentUrl}
            className="w-full border-0"
            style={{ minHeight: '600px', height: '80vh' }}
            title="Güvenli Ödeme"
            sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation"
            allow="payment"
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="text-center text-sm text-gray-500">
          <p>⚠️ Lütfen bu sayfayı kapatmayın veya tarayıcınızın geri butonunu kullanmayın.</p>
          <p className="mt-2">Ödeme işlemi tamamlandıktan sonra otomatik olarak yönlendirileceksiniz.</p>
        </div>
      </div>
    </div>
  );
}
