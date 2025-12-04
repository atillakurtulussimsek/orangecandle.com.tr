'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useWishlist } from '@/contexts/WishlistContext';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  zipCode: string;
  isDefault: boolean;
  isBillingAddress?: boolean;
  companyName?: string;
  taxNumber?: string;
  taxOffice?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      images: string;
    };
  }[];
}

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearOnLogout } = useWishlist();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    title: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    zipCode: '',
    isDefault: false,
    isBillingAddress: false,
    companyName: '',
    taxNumber: '',
    taxOffice: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadUserData(token);
    
    // URL parametresinden sekme al
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [router, searchParams]);

  const loadUserData = async (token: string) => {
    try {
      // Load orders
      const ordersRes = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      // Load addresses
      const addressesRes = await fetch('/api/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (addressesRes.ok) {
        const addressesData = await addressesRes.json();
        setAddresses(addressesData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Kullanıcı bilgilerini temizle
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // İstek listesini temizle (sadece localStorage, veritabanında kalır)
    clearOnLogout();
    
    router.push('/');
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
    };
    return texts[status] || status;
  };

  const openAddressModal = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        title: address.title,
        fullName: address.fullName,
        phone: address.phone,
        address: address.address,
        city: address.city,
        district: address.district,
        zipCode: address.zipCode,
        isDefault: address.isDefault,
        isBillingAddress: address.isBillingAddress || false,
        companyName: address.companyName || '',
        taxNumber: address.taxNumber || '',
        taxOffice: address.taxOffice || '',
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        title: '',
        fullName: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        zipCode: '',
        isDefault: false,
        isBillingAddress: false,
        companyName: '',
        taxNumber: '',
        taxOffice: '',
      });
    }
    setShowAddressModal(true);
  };

  const closeAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
    setAddressForm({
      title: '',
      fullName: '',
      phone: '',
      address: '',
      city: '',
      district: '',
      zipCode: '',
      isDefault: false,
      isBillingAddress: false,
      companyName: '',
      taxNumber: '',
      taxOffice: '',
    });
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    try {
      const url = editingAddress 
        ? `/api/addresses/${editingAddress.id}` 
        : '/api/addresses';
      
      const method = editingAddress ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...addressForm,
          userId: user.id,
        }),
      });

      if (res.ok) {
        // Adresleri yeniden yükle
        const addressesRes = await fetch('/api/addresses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (addressesRes.ok) {
          const addressesData = await addressesRes.json();
          setAddresses(addressesData);
        }
        closeAddressModal();
        alert(editingAddress ? 'Adres güncellendi!' : 'Adres eklendi!');
      } else {
        const error = await res.json();
        alert(error.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Bu adresi silmek istediğinizden emin misiniz?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setAddresses(addresses.filter(addr => addr.id !== addressId));
        alert('Adres silindi!');
      } else {
        alert('Adres silinemedi');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Bir hata oluştu');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Breadcrumb */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-gray-600 hover:text-orange-500 transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Ana Sayfa
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-orange-500 font-semibold">Hesabım</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-6 sticky top-24">
              {/* User Info */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-lg text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
                {(user as any).role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Yönetici Paneli
                  </Link>
                )}
              </div>

              {/* Menu */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-orange-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Genel Bakış
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition ${
                    activeTab === 'orders'
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-orange-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Siparişlerim
                </button>

                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition ${
                    activeTab === 'addresses'
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-orange-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Adreslerim
                </button>

                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-orange-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profil Bilgileri
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Çıkış Yap
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Hoş Geldiniz, {user.name}!</h2>
                  <p className="text-gray-600">Hesap bilgilerinizi ve siparişlerinizi buradan yönetebilirsiniz.</p>
                  {(user as any).role === 'ADMIN' && (
                    <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-purple-900">Sistem Yöneticisi Yetkileriniz Var</p>
                          <p className="text-sm text-purple-700">Site yönetimi için yönetim paneline erişebilirsiniz</p>
                        </div>
                        <Link
                          href="/admin"
                          className="px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition"
                        >
                          Yönetim Paneli
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 mb-1">Toplam Sipariş</p>
                        <h3 className="text-3xl font-bold">{orders.length}</h3>
                      </div>
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl shadow-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 mb-1">Tamamlanan</p>
                        <h3 className="text-3xl font-bold">
                          {orders.filter(o => o.orderStatus === 'DELIVERED').length}
                        </h3>
                      </div>
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl shadow-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 mb-1">Adres Sayısı</p>
                        <h3 className="text-3xl font-bold">{addresses.length}</h3>
                      </div>
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                {orders.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">Son Siparişler</h3>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-2"
                      >
                        Tümünü Gör
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order) => (
                        <div 
                          key={order.id} 
                          className="border-2 border-gray-200 rounded-2xl p-5 hover:border-orange-300 transition cursor-pointer" 
                          onClick={() => {
                            setSelectedOrder(order);
                            setActiveTab('order-detail');
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-bold text-gray-900">Sipariş #{order.orderNumber}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-orange-500 text-lg">{Number(order.total).toFixed(2)} ₺</p>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.orderStatus)}`}>
                                {getStatusText(order.orderStatus)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Orders */}
            {activeTab === 'orders' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Siparişlerim</h2>
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz siparişiniz yok</h3>
                    <p className="text-gray-600 mb-6">Alışverişe başlamak için ürünlerimize göz atın</p>
                    <Link
                      href="/products"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Alışverişe Başla
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order.id} className="border-2 border-gray-200 rounded-2xl p-6 hover:border-orange-300 transition">
                        {/* Order Header */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                          <div>
                            <h4 className="font-bold text-lg text-gray-900">Sipariş #{order.orderNumber}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-orange-500 text-xl mb-2">{Number(order.total).toFixed(2)} ₺</p>
                            <div className="flex gap-2">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.orderStatus)}`}>
                                {getStatusText(order.orderStatus)}
                              </span>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.paymentStatus)}`}>
                                {getStatusText(order.paymentStatus)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-3 mb-4">
                          {order.items.map((item) => {
                            const images = JSON.parse(item.product.images);
                            return (
                              <div key={item.id} className="flex items-center gap-4">
                                <img
                                  src={images[0]}
                                  alt={item.product.name}
                                  className="w-16 h-16 object-cover rounded-xl"
                                />
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{item.product.name}</p>
                                  <p className="text-sm text-gray-600">Adet: {item.quantity}</p>
                                </div>
                                <p className="font-semibold text-gray-900">{Number(item.price).toFixed(2)} ₺</p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Detay Butonu */}
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setActiveTab('order-detail');
                          }}
                          className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                        >
                          Sipariş Detaylarını Gör
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Order Detail */}
            {activeTab === 'order-detail' && selectedOrder && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
                <button
                  onClick={() => setActiveTab('orders')}
                  className="mb-6 text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Siparişlerime Dön
                </button>

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Sipariş #{selectedOrder.orderNumber}</h2>
                    <p className="text-gray-600">
                      Sipariş Tarihi: {new Date(selectedOrder.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-2 mb-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedOrder.paymentStatus)}`}>
                        {getStatusText(selectedOrder.paymentStatus)}
                      </span>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedOrder.orderStatus)}`}>
                        {getStatusText(selectedOrder.orderStatus)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Ürün Listesi */}
                  <div className="border-2 border-gray-200 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Sipariş Ürünleri</h3>
                    <div className="space-y-4">
                      {selectedOrder.items.map((item) => {
                        const images = JSON.parse(item.product.images);
                        return (
                          <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                            <img
                              src={images[0]}
                              alt={item.product.name}
                              className="w-24 h-24 object-cover rounded-xl"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-lg">{item.product.name}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                {item.quantity} adet × {Number(item.price).toFixed(2)} ₺
                              </p>
                              <p className="font-bold text-gray-900 mt-2">
                                {(Number(item.price) * item.quantity).toFixed(2)} ₺
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sipariş Özeti */}
                  <div className="border-2 border-gray-200 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Sipariş Özeti</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-lg font-semibold text-gray-900">Toplam Tutar</span>
                        <span className="text-2xl font-bold text-orange-600">{Number(selectedOrder.total).toFixed(2)} ₺</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Addresses */}
            {activeTab === 'addresses' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-900">Adreslerim</h2>
                  <button 
                    onClick={() => openAddressModal()}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Yeni Adres Ekle
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz adresiniz yok</h3>
                    <p className="text-gray-600">Hızlı teslimat için adres ekleyin</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`border-2 rounded-2xl p-6 hover:border-orange-300 transition ${
                          address.isDefault ? 'border-orange-500 bg-orange-50/50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-bold text-lg text-gray-900">{address.title}</h4>
                          {address.isDefault && (
                            <span className="px-3 py-1 bg-orange-500 text-white text-xs rounded-full font-semibold">
                              Varsayılan
                            </span>
                          )}
                        </div>
                        <div className="space-y-2 text-gray-700">
                          <p className="font-semibold">{address.fullName}</p>
                          <p className="text-sm">{address.phone}</p>
                          <p className="text-sm">{address.address}</p>
                          <p className="text-sm">{address.district}, {address.city} {address.zipCode}</p>
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                          <button 
                            onClick={() => openAddressModal(address)}
                            className="flex-1 px-4 py-2 border-2 border-orange-500 text-orange-500 rounded-xl font-semibold hover:bg-orange-50 transition"
                          >
                            Düzenle
                          </button>
                          <button 
                            onClick={() => handleDeleteAddress(address.id)}
                            className="flex-1 px-4 py-2 border-2 border-red-500 text-red-500 rounded-xl font-semibold hover:bg-red-50 transition"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile */}
            {activeTab === 'profile' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Profil Bilgileri</h2>
                <form className="space-y-6">
                  <div className="group">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ad Soyad</label>
                    <input
                      type="text"
                      defaultValue={user.name}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-bold text-gray-700 mb-2">E-posta</label>
                    <input
                      type="email"
                      defaultValue={user.email}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Telefon</label>
                    <input
                      type="tel"
                      defaultValue={user.phone}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Şifre Değiştir</h3>
                    
                    <div className="space-y-4">
                      <div className="group">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Mevcut Şifre</label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Yeni Şifre</label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Yeni Şifre (Tekrar)</label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition"
                  >
                    Değişiklikleri Kaydet
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingAddress ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
                </h3>
                <button
                  onClick={closeAddressModal}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveAddress} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Adres Başlığı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ev, İş, Ofis"
                  value={addressForm.title}
                  onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Ad Soyad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Alıcı adı soyadı"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0555 123 45 67"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Adres <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Mahalle, sokak, bina no, daire no"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    İl <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: İstanbul"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    İlçe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Kadıköy"
                    value={addressForm.district}
                    onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Posta Kodu
                  </label>
                  <input
                    type="text"
                    placeholder="34000"
                    value={addressForm.zipCode}
                    onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-5 h-5 text-orange-500 border-2 border-orange-300 rounded focus:ring-2 focus:ring-orange-500"
                />
                <label htmlFor="isDefault" className="text-sm font-semibold text-gray-900 cursor-pointer">
                  Varsayılan adres olarak kaydet
                </label>
              </div>

              {/* Fatura Adresi Checkbox */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <input
                  type="checkbox"
                  id="isBillingAddress"
                  checked={addressForm.isBillingAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, isBillingAddress: e.target.checked })}
                  className="w-5 h-5 text-blue-500 border-2 border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isBillingAddress" className="text-sm font-semibold text-gray-900 cursor-pointer">
                  Fatura adresi olarak kullan
                </label>
              </div>

              {/* Conditional Billing Fields */}
              {addressForm.isBillingAddress && (
                <div className="space-y-4 p-6 bg-blue-50/50 rounded-xl border-2 border-blue-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Fatura Bilgileri</h4>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Ünvan (Şirket Adı)
                    </label>
                    <input
                      type="text"
                      placeholder="Şahıs ise boş bırakın, şirket ise unvanı girin"
                      value={addressForm.companyName}
                      onChange={(e) => setAddressForm({ ...addressForm, companyName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      * Şahıs ise boş bırakabilirsiniz. Şirket ise firma ünvanını girin.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Vergi Kimlik No / TC Kimlik No <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={addressForm.isBillingAddress}
                      placeholder="Şirket için VKN, şahıs için TC Kimlik No"
                      value={addressForm.taxNumber}
                      onChange={(e) => setAddressForm({ ...addressForm, taxNumber: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      * Şirket ise Vergi Kimlik Numarası, şahıs ise TC Kimlik Numarası girin.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Vergi Dairesi
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Kadıköy Vergi Dairesi"
                      value={addressForm.taxOffice}
                      onChange={(e) => setAddressForm({ ...addressForm, taxOffice: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeAddressModal}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                >
                  {editingAddress ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
