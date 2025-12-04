'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string;
}

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  productSlug: string;
  currentStock: number;
  images: string[];
}

interface Address {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  zipCode: string;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  shippingAddress: Address;
  billingAddress: Address | null;
  trackingNumber: string | null;
  notes: string | null;
  items: OrderItem[];
  // Geliver kargo bilgileri
  cargoProvider: string | null;
  cargoTrackingUrl: string | null;
  cargoTrackingNumber: string | null;
  cargoBarcode: string | null;
}

export default function OrderDetailPage({ params }: { params: { orderNumber: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [params.orderNumber]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?redirect=/account/orders');
        return;
      }

      const response = await fetch(`/api/orders/${params.orderNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push('/login?redirect=/account/orders');
        return;
      }

      if (response.status === 404) {
        setError('Sipariş bulunamadı');
        return;
      }

      if (!response.ok) {
        throw new Error('Sipariş detayları yüklenemedi');
      }

      const data = await response.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { text: string; color: string } } = {
      PENDING: { text: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
      PROCESSING: { text: 'Hazırlanıyor', color: 'bg-blue-100 text-blue-800' },
      SHIPPED: { text: 'Kargoya Verildi', color: 'bg-purple-100 text-purple-800' },
      DELIVERED: { text: 'Teslim Edildi', color: 'bg-green-100 text-green-800' },
      CANCELLED: { text: 'İptal Edildi', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { text: string; color: string } } = {
      PENDING: { text: 'Ödeme Bekleniyor', color: 'bg-yellow-100 text-yellow-800' },
      PAID: { text: 'Ödendi', color: 'bg-green-100 text-green-800' },
      FAILED: { text: 'Ödeme Başarısız', color: 'bg-red-100 text-red-800' },
      REFUNDED: { text: 'İade Edildi', color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPaymentMethodText = (method: string) => {
    const methods: { [key: string]: string } = {
      CREDIT_CARD: 'Kredi Kartı',
      BANK_TRANSFER: 'Havale / EFT',
      CASH_ON_DELIVERY: 'Kapıda Ödeme',
    };
    return methods[method] || method;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
            {error || 'Sipariş bulunamadı'}
          </div>
          <Link
            href="/account/orders"
            className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Siparişlerime Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Başlık */}
        <div className="mb-6">
          <Link
            href="/account/orders"
            className="text-orange-600 hover:text-orange-700 mb-4 inline-flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Siparişlerime Dön
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Sipariş #{order.orderNumber}
              </h1>
              <p className="text-gray-600">
                Sipariş Tarihi: {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getPaymentStatusBadge(order.paymentStatus)}
              {getStatusBadge(order.orderStatus)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Kolon - Ürünler */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ürün Listesi */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Sipariş Ürünleri</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <img
                      src={item.image || '/placeholder-product.jpg'}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="font-medium text-gray-900 hover:text-orange-600 transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.quantity} adet × {formatPrice(Number(item.price))}
                      </p>
                      <p className="font-semibold text-gray-900 mt-2">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teslimat Adresi */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Teslimat Adresi</h2>
              <div className="text-gray-700 space-y-1">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.district} / {order.shippingAddress.city}
                </p>
                <p>{order.shippingAddress.zipCode}</p>
              </div>
            </div>

            {/* Fatura Adresi */}
            {order.billingAddress && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">Fatura Adresi</h2>
                <div className="text-gray-700 space-y-1">
                  <p className="font-medium">{order.billingAddress.fullName}</p>
                  <p>{order.billingAddress.phone}</p>
                  <p>{order.billingAddress.address}</p>
                  <p>
                    {order.billingAddress.district} / {order.billingAddress.city}
                  </p>
                  <p>{order.billingAddress.zipCode}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sağ Kolon - Özet */}
          <div className="space-y-6">
            {/* Sipariş Özeti */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Sipariş Özeti</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Ara Toplam</span>
                  <span>{formatPrice(Number(order.subtotal))}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Kargo</span>
                  <span>
                    {Number(order.shipping) === 0
                      ? 'Ücretsiz'
                      : formatPrice(Number(order.shipping))}
                  </span>
                </div>
                {Number(order.tax) > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>KDV</span>
                    <span>{formatPrice(Number(order.tax))}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Toplam</span>
                    <span className="text-orange-600">
                      {formatPrice(Number(order.total))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ödeme Bilgileri */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Ödeme Bilgileri</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Ödeme Yöntemi</p>
                  <p className="font-medium text-gray-900">
                    {getPaymentMethodText(order.paymentMethod)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ödeme Durumu</p>
                  <div className="mt-1">
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                </div>
              </div>
            </div>

            {/* Kargo Takip */}
            {(order.trackingNumber || order.cargoTrackingNumber) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  📦 Kargo Takip
                </h2>
                <div className="space-y-4">
                  {order.cargoProvider && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Kargo Firması</p>
                      <p className="font-medium text-gray-900">{order.cargoProvider}</p>
                    </div>
                  )}
                  
                  {(order.cargoTrackingNumber || order.trackingNumber) && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Takip Numarası</p>
                      <p className="font-mono font-medium text-gray-900">
                        {order.cargoTrackingNumber || order.trackingNumber}
                      </p>
                    </div>
                  )}

                  {order.cargoBarcode && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Barkod</p>
                      <p className="font-mono text-sm text-gray-900">{order.cargoBarcode}</p>
                    </div>
                  )}

                  {order.cargoTrackingUrl ? (
                    <a
                      href={order.cargoTrackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 transition-colors text-center font-medium"
                    >
                      🔍 Kargoyu Takip Et
                    </a>
                  ) : (
                    <button 
                      disabled
                      className="w-full bg-gray-300 text-gray-600 px-4 py-3 rounded-lg cursor-not-allowed text-center font-medium"
                    >
                      Kargo bilgisi bekleniyor...
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Not */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">Sipariş Notu</h2>
                <p className="text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
