'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function OrderErrorPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Ödeme işlemi sırasında bir hata oluştu';
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">Ödeme Başarısız</h1>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{message}</p>
          </div>

          {orderId && (
            <p className="text-sm text-gray-600 mb-6">
              Sipariş Numarası: <span className="font-semibold">{orderId}</span>
            </p>
          )}

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm">💡 Ne yapabilirsiniz?</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Kart bilgilerinizi kontrol edip tekrar deneyebilirsiniz</li>
              <li>• Farklı bir ödeme yöntemi seçebilirsiniz</li>
              <li>• Kartınızda yeterli bakiye olduğundan emin olun</li>
              <li>• Sorun devam ederse bankanızla iletişime geçin</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/checkout"
              className="block w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
            >
              Tekrar Dene
            </Link>
            <Link
              href="/cart"
              className="block w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Sepete Dön
            </Link>
            <Link
              href="/"
              className="block w-full text-gray-600 py-2 hover:text-gray-900 transition text-sm"
            >
              Ana Sayfaya Dön
            </Link>
          </div>

          {/* Support */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-600">
              Yardıma mı ihtiyacınız var?{' '}
              <Link href="/contact" className="text-orange-600 hover:underline font-semibold">
                Bize Ulaşın
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
