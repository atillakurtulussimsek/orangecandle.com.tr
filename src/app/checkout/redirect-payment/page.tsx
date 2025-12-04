'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function RedirectPaymentPage() {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const formDataStr = searchParams.get('formData');
    const redirectUrl = searchParams.get('redirectUrl');

    console.log('Redirect URL:', redirectUrl);
    console.log('Form Data:', formDataStr);

    if (!formDataStr || !redirectUrl) {
      setError('Ödeme bilgileri eksik. Lütfen tekrar deneyin.');
      setTimeout(() => {
        window.location.href = '/checkout';
      }, 3000);
      return;
    }

    try {
      const formData = JSON.parse(decodeURIComponent(formDataStr));
      console.log('Parsed form data:', formData);
      
      // Form'u oluştur
      if (formRef.current) {
        // Tüm alanları temizle
        formRef.current.innerHTML = '';
        
        // Hidden inputları ekle
        Object.keys(formData).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = formData[key] || '';
          formRef.current?.appendChild(input);
        });

        // Form action'ı ayarla
        formRef.current.action = redirectUrl;

        console.log('Form hazır, submit ediliyor...');

        // Kısa bir gecikmeyle submit et
        setTimeout(() => {
          if (formRef.current) {
            formRef.current.submit();
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('Form data parse error:', error);
      setError('Ödeme sayfası oluşturulurken hata oluştu: ' + error.message);
      setTimeout(() => {
        window.location.href = '/checkout';
      }, 3000);
    }
  }, [searchParams]);

  const redirectUrl = searchParams.get('redirectUrl');

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Hata Oluştu</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">Ödeme sayfasına yönlendiriliyorsunuz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Güvenli Ödeme Sayfasına Yönlendiriliyorsunuz
        </h1>

        <div className="space-y-3 text-sm text-gray-600 mb-6">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>256-bit SSL Şifreleme</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>3D Secure Güvencesi</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>PCI DSS Uyumlu</span>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Lütfen bu sayfayı kapatmayın veya tarayıcınızın geri butonunu kullanmayın.
        </p>

        {/* Otomatik submit edilecek form */}
        <form
          ref={formRef}
          method="POST"
          action={redirectUrl || ''}
        >
          {/* Hidden inputlar JavaScript ile eklenecek */}
        </form>
      </div>
    </div>
  );
}
