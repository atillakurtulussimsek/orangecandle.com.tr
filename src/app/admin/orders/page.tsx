'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  productSlug: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customer: Customer;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  itemCount: number;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    city: string;
    district: string;
  };
  trackingNumber: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [orderStatus, paymentStatus, currentPage]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (orderStatus) params.append('orderStatus', orderStatus);
      if (paymentStatus) params.append('paymentStatus', paymentStatus);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setPagination(data.pagination);
      } else if (res.status === 401 || res.status === 403) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadOrders();
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      PROCESSING: 'bg-blue-100 text-blue-800 border-blue-300',
      SHIPPED: 'bg-purple-100 text-purple-800 border-purple-300',
      DELIVERED: 'bg-green-100 text-green-800 border-green-300',
      CANCELLED: 'bg-red-100 text-red-800 border-red-300',
      PAID: 'bg-green-100 text-green-800 border-green-300',
      FAILED: 'bg-red-100 text-red-800 border-red-300',
      REFUNDED: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      PENDING: 'Beklemede',
      PROCESSING: 'Hazırlanıyor',
      SHIPPED: 'Kargoda',
      DELIVERED: 'Teslim Edildi',
      CANCELLED: 'İptal Edildi',
      PAID: 'Ödendi',
      FAILED: 'Başarısız',
      REFUNDED: 'İade Edildi',
    };
    return texts[status] || status;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 bg-clip-text text-transparent mb-2">
              Siparişler
            </h1>
            <p className="text-gray-600">
              Toplam {pagination?.totalCount || 0} sipariş bulundu
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative col-span-2">
            <input
              type="text"
              placeholder="Sipariş no, müşteri adı veya email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <select
            value={orderStatus}
            onChange={(e) => {
              setOrderStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-5 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium bg-white"
          >
            <option value="">Tüm Sipariş Durumları</option>
            <option value="PENDING">Beklemede</option>
            <option value="PROCESSING">Hazırlanıyor</option>
            <option value="SHIPPED">Kargoda</option>
            <option value="DELIVERED">Teslim Edildi</option>
            <option value="CANCELLED">İptal Edildi</option>
          </select>

          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-5 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium bg-white"
          >
            <option value="">Tüm Ödeme Durumları</option>
            <option value="PENDING">Ödeme Bekleniyor</option>
            <option value="PAID">Ödendi</option>
            <option value="FAILED">Başarısız</option>
            <option value="REFUNDED">İade Edildi</option>
          </select>
        </div>

        {(searchQuery || orderStatus || paymentStatus) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setOrderStatus('');
              setPaymentStatus('');
              setCurrentPage(1);
            }}
            className="mt-4 text-orange-600 hover:text-orange-700 font-semibold text-sm"
          >
            Filtreleri Temizle
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <p className="text-gray-500 font-semibold text-lg">
              {searchQuery || orderStatus || paymentStatus ? 'Sipariş bulunamadı' : 'Henüz sipariş yok'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-50 to-white">
                  <tr>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-700">
                      Sipariş No
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-700">
                      Müşteri
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-700">
                      Ürünler
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-700">
                      Tutar
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-700">
                      Sipariş Durumu
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-700">
                      Ödeme Durumu
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-700">
                      Tarih
                    </th>
                    <th className="text-right py-5 px-6 text-sm font-bold text-gray-700">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t-2 border-gray-100 hover:bg-orange-50/50 transition"
                    >
                      <td className="py-5 px-6">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-bold text-orange-600 hover:text-orange-700"
                        >
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-5 px-6">
                        <div>
                          <p className="font-semibold text-gray-900">{order.customer.name}</p>
                          <p className="text-sm text-gray-500">{order.customer.email}</p>
                          {order.customer.phone && (
                            <p className="text-sm text-gray-500">{order.customer.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="text-sm">
                          <p className="font-semibold text-gray-900">
                            {order.itemCount} ürün
                          </p>
                          <p className="text-gray-500 truncate max-w-xs">
                            {order.items.slice(0, 2).map((item) => item.name).join(', ')}
                            {order.items.length > 2 && '...'}
                          </p>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className="font-bold text-orange-600 text-lg">
                          {formatPrice(Number(order.total))}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            order.orderStatus
                          )}`}
                        >
                          {getStatusText(order.orderStatus)}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            order.paymentStatus
                          )}`}
                        >
                          {getStatusText(order.paymentStatus)}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-sm text-gray-700">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition text-sm"
                        >
                          Detay
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 p-6 border-t-2 border-gray-100">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-semibold"
                >
                  Önceki
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-xl font-semibold ${
                          currentPage === pageNum
                            ? 'bg-orange-500 text-white'
                            : 'border-2 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
                  }
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-semibold"
                >
                  Sonraki
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
