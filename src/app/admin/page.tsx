'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  lowStockProducts: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Load recent orders
      const ordersRes = await fetch('/api/admin/orders?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        // API şimdi { orders: [...], pagination: {...} } formatında dönüyor
        setRecentOrders(ordersData.orders || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      PAID: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
    };
    return texts[status] || status;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 bg-clip-text text-transparent mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600">Orange Candle yönetim paneline hoş geldiniz</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm text-gray-500">Son Güncelleme</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date().toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl shadow-xl shadow-green-200 p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-green-100 text-sm font-medium bg-white/20 px-3 py-1 rounded-full">+12.5%</span>
          </div>
          <p className="text-green-100 text-sm mb-1">Toplam Gelir</p>
          <h3 className="text-3xl font-bold">{stats.totalRevenue.toFixed(2)} ₺</h3>
        </div>

        {/* Total Orders */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-xl shadow-blue-200 p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-blue-100 text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              {stats.pendingOrders} bekliyor
            </span>
          </div>
          <p className="text-blue-100 text-sm mb-1">Toplam Sipariş</p>
          <h3 className="text-3xl font-bold">{stats.totalOrders}</h3>
        </div>

        {/* Total Products */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl shadow-xl shadow-purple-200 p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-purple-100 text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              {stats.lowStockProducts} düşük stok
            </span>
          </div>
          <p className="text-purple-100 text-sm mb-1">Toplam Ürün</p>
          <h3 className="text-3xl font-bold">{stats.totalProducts}</h3>
        </div>

        {/* Total Customers */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl shadow-xl shadow-orange-200 p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="text-orange-100 text-sm font-medium bg-white/20 px-3 py-1 rounded-full">+8 bu ay</span>
          </div>
          <p className="text-orange-100 text-sm mb-1">Toplam Müşteri</p>
          <h3 className="text-3xl font-bold">{stats.totalCustomers}</h3>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Son Siparişler</h2>
          <Link
            href="/admin/orders"
            className="text-orange-500 hover:text-orange-600 font-semibold text-sm flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition"
          >
            Tümünü Gör
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Henüz sipariş yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 text-sm font-bold text-gray-600">Sipariş No</th>
                  <th className="text-left py-4 px-4 text-sm font-bold text-gray-600">Müşteri</th>
                  <th className="text-left py-4 px-4 text-sm font-bold text-gray-600">Tutar</th>
                  <th className="text-left py-4 px-4 text-sm font-bold text-gray-600">Durum</th>
                  <th className="text-left py-4 px-4 text-sm font-bold text-gray-600">Tarih</th>
                  <th className="text-right py-4 px-4 text-sm font-bold text-gray-600">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-orange-50/50 transition">
                    <td className="py-4 px-4">
                      <span className="font-bold text-gray-900">#{order.orderNumber}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-gray-900">{order.customer.name}</p>
                        <p className="text-sm text-gray-500">{order.customer.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-orange-600">{Number(order.total).toFixed(2)} ₺</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.orderStatus)}`}>
                          {getStatusText(order.orderStatus)}
                        </span>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.paymentStatus)}`}>
                          {getStatusText(order.paymentStatus)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 font-medium">
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-orange-500 hover:text-orange-600 font-bold text-sm bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition inline-block"
                      >
                        Detay →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/admin/products/new"
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-gray-200 p-6 hover:shadow-2xl hover:border-orange-400 transition-all group transform hover:scale-105"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-4 group-hover:from-orange-500 group-hover:to-orange-600 transition-all shadow-lg">
            <svg className="w-7 h-7 text-orange-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2 text-lg">Yeni Ürün</h3>
          <p className="text-sm text-gray-600">Ürün kataloğuna ekle</p>
        </Link>

        <Link
          href="/admin/categories/new"
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-gray-200 p-6 hover:shadow-2xl hover:border-blue-400 transition-all group transform hover:scale-105"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-4 group-hover:from-blue-500 group-hover:to-blue-600 transition-all shadow-lg">
            <svg className="w-7 h-7 text-blue-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2 text-lg">Yeni Kategori</h3>
          <p className="text-sm text-gray-600">Kategori oluştur</p>
        </Link>

        <Link
          href="/admin/orders"
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-gray-200 p-6 hover:shadow-2xl hover:border-purple-400 transition-all group transform hover:scale-105"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-4 group-hover:from-purple-500 group-hover:to-purple-600 transition-all shadow-lg">
            <svg className="w-7 h-7 text-purple-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2 text-lg">Siparişler</h3>
          <p className="text-sm text-gray-600">Siparişleri yönet</p>
        </Link>

        <Link
          href="/admin/settings"
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-gray-200 p-6 hover:shadow-2xl hover:border-green-400 transition-all group transform hover:scale-105"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-4 group-hover:from-green-500 group-hover:to-green-600 transition-all shadow-lg">
            <svg className="w-7 h-7 text-green-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2 text-lg">Ayarlar</h3>
          <p className="text-sm text-gray-600">Site ayarlarını düzenle</p>
        </Link>
      </div>
    </div>
  );
}
