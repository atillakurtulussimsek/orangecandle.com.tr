'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderDetails {
  id: string;
  orderNumber: string;
  total: number;
  shippingAddress: any;
  items: Array<{
    id: string;
    product: {
      name: string;
      images: string[];
    };
    quantity: number;
    price: number;
  }>;
  createdAt: string;
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get('orderNumber');

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) {
      router.push('/');
      return;
    }

    fetchOrderDetails();
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?redirect=/order/success?orderNumber=' + orderNumber);
        return;
      }

      const res = await fetch(`/api/orders/${orderNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Sipariş bilgileri alınamadı');
      }

      const data = await res.json();
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600">Sipariş bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sipariş Bulunamadı</h1>
          <p className="text-gray-600 mb-6">Bu siparişe erişim yetkiniz yok veya sipariş mevcut değil.</p>
          <Link href="/" className="btn btn-primary">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Success Icon & Message */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Siparişiniz Alındı!</h1>
          <p className="text-gray-600 mb-4">
            Ödemeniz başarıyla tamamlandı. Siparişiniz en kısa sürede kargoya verilecektir.
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 inline-block">
            <p className="text-sm text-gray-600 mb-1">Sipariş Numarası</p>
            <p className="text-2xl font-bold text-orange-600">{order.orderNumber}</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sipariş Detayları</h2>

          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                <img
                  src={item.product.images[0] || '/placeholder-product.png'}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                  <p className="text-sm text-gray-600">Adet: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₺{item.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">
                    ₺{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-lg font-bold">
              <span>Toplam</span>
              <span className="text-orange-600">₺{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Teslimat Adresi</h2>
            <div className="text-gray-700">
              <p className="font-semibold">{order.shippingAddress.title}</p>
              <p className="text-sm mt-2">{order.shippingAddress.address}</p>
              <p className="text-sm">
                {order.shippingAddress.district}, {order.shippingAddress.city}
              </p>
              <p className="text-sm">{order.shippingAddress.phone}</p>
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">📦 Kargo Bilgilendirmesi</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Siparişiniz 1-2 iş günü içinde kargoya verilecektir</li>
            <li>• Kargo takip numaranız e-posta adresinize gönderilecektir</li>
            <li>• Siparişlerinizi "Hesabım" sayfasından takip edebilirsiniz</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href="/account/orders"
            className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition text-center"
          >
            Siparişlerim
          </Link>
          <Link
            href="/"
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition text-center"
          >
            Alışverişe Devam Et
          </Link>
        </div>

        {/* Email Confirmation */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Sipariş onay e-postası{' '}
          <span className="font-semibold">kayıtlı e-posta adresinize</span> gönderilmiştir.
        </p>
      </div>
    </div>
  );
}
