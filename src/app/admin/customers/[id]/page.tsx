'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface WishlistItem {
  id: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice: number | null;
    images: string[];
    stock: number;
    stockTracking: boolean;
  };
}

interface WishlistHistory {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productSlug: string | null;
  productImage: string | null;
  action: 'ADDED' | 'REMOVED';
  reason: string | null;
  removedBy: string | null;
  notes: string | null;
  createdAt: string;
  productExists: boolean;
  currentProduct: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
    stock: number;
  } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  items: Array<{
    quantity: number;
    price: number;
    product: {
      name: string;
      images: string[];
    };
  }>;
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
}

interface CustomerDetails {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  orders: Order[];
  addresses: Address[];
  wishlist: WishlistItem[];
  stats: {
    totalSpent: number;
    orderCount: number;
    lastOrderDate: string | null;
    addressCount: number;
    wishlistCount: number;
  };
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'wishlist' | 'wishlist-history' | 'offers' | 'activity'>('overview');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [wishlistHistory, setWishlistHistory] = useState<WishlistHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activityStats, setActivityStats] = useState<any>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityFilter, setActivityFilter] = useState({ category: '', action: '' });
  
  // Offer form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [offerType, setOfferType] = useState<'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT' | 'BUY_X_GET_Y'>('PERCENTAGE_DISCOUNT');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [buyQuantity, setBuyQuantity] = useState('');
  const [getQuantity, setGetQuantity] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [maxUsage, setMaxUsage] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  useEffect(() => {
    fetchCustomerDetails();
    if (activeTab === 'offers') {
      fetchOffers();
    }
    if (activeTab === 'wishlist-history') {
      fetchWishlistHistory();
    }
    if (activeTab === 'activity') {
      fetchActivityLogs();
      fetchActivityStats();
    }
  }, [params.id, activeTab, activityFilter]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/customers/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
      } else {
        alert('Müşteri bilgileri yüklenemedi');
        router.push('/admin/customers');
      }
    } catch (error) {
      console.error('Fetch customer error:', error);
      alert('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    try {
      setLoadingOffers(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/personal-offers?userId=${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setOffers(data);
      }
    } catch (error) {
      console.error('Fetch offers error:', error);
    } finally {
      setLoadingOffers(false);
    }
  };

  const fetchWishlistHistory = async () => {
    try {
      setLoadingHistory(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/wishlist-history?userId=${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setWishlistHistory(data);
      }
    } catch (error) {
      console.error('Fetch wishlist history error:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      setLoadingActivity(true);
      const token = localStorage.getItem('token');
      const urlParams = new URLSearchParams({
        userId: params.id,
        limit: '100',
      });
      
      if (activityFilter.category) {
        urlParams.append('category', activityFilter.category);
      }
      if (activityFilter.action) {
        urlParams.append('action', activityFilter.action);
      }

      const res = await fetch(`/api/admin/activity-logs?${urlParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data.logs);
      }
    } catch (error) {
      console.error('Fetch activity logs error:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const fetchActivityStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/activity-logs?userId=${params.id}&stats=true&days=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setActivityStats(data);
      }
    } catch (error) {
      console.error('Fetch activity stats error:', error);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedProductId) {
      alert('Lütfen bir ürün seçin');
      return;
    }

    if (!validFrom || !validUntil) {
      alert('Lütfen başlangıç ve bitiş tarihlerini girin');
      return;
    }

    if (offerType === 'PERCENTAGE_DISCOUNT' && (!discountPercent || parseFloat(discountPercent) <= 0)) {
      alert('Lütfen geçerli bir indirim yüzdesi girin (0\'dan büyük)');
      return;
    }

    if (offerType === 'FIXED_DISCOUNT' && (!discountAmount || parseFloat(discountAmount) <= 0)) {
      alert('Lütfen geçerli bir indirim tutarı girin (0\'dan büyük)');
      return;
    }

    if (offerType === 'BUY_X_GET_Y') {
      if (!buyQuantity || parseInt(buyQuantity) <= 0) {
        alert('Lütfen geçerli bir alış adedi girin (0\'dan büyük)');
        return;
      }
      if (!getQuantity || parseInt(getQuantity) <= 0) {
        alert('Lütfen geçerli bir bedava adedi girin (0\'dan büyük)');
        return;
      }
    }

    try {
      setSubmittingOffer(true);
      
      const offerData: any = {
        userId: params.id,
        productId: selectedProductId,
        offerType,
        description: offerDescription || '',
        validFrom: new Date(validFrom).toISOString(),
        validUntil: new Date(validUntil).toISOString(),
        isActive: true
      };

      if (maxUsage && parseInt(maxUsage) > 0) {
        offerData.maxUsage = parseInt(maxUsage);
      }

      if (offerType === 'PERCENTAGE_DISCOUNT') {
        offerData.discountPercent = parseFloat(discountPercent);
      } else if (offerType === 'FIXED_DISCOUNT') {
        offerData.discountAmount = parseFloat(discountAmount);
      } else if (offerType === 'BUY_X_GET_Y') {
        offerData.buyQuantity = parseInt(buyQuantity);
        offerData.getQuantity = parseInt(getQuantity);
      }

      console.log('Sending offer data:', offerData);

      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/personal-offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(offerData),
      });

      if (res.ok) {
        alert('Kampanya başarıyla oluşturuldu!');
        setShowOfferModal(false);
        resetOfferForm();
        fetchOffers();
      } else {
        const error = await res.json();
        console.error('API Error:', error);
        alert(`Hata: ${error.error || 'Kampanya oluşturulamadı'}`);
      }
    } catch (error) {
      console.error('Failed to create offer:', error);
      alert('Kampanya oluşturulurken bir hata oluştu');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const resetOfferForm = () => {
    setSelectedProductId('');
    setOfferType('PERCENTAGE_DISCOUNT');
    setDiscountPercent('');
    setDiscountAmount('');
    setBuyQuantity('');
    setGetQuantity('');
    setOfferDescription('');
    setValidFrom('');
    setValidUntil('');
    setMaxUsage('');
  };

  const getStatusBadge = (status: string, type: 'payment' | 'order') => {
    const badges = {
      payment: {
        PAID: 'bg-green-100 text-green-700',
        PENDING: 'bg-yellow-100 text-yellow-700',
        FAILED: 'bg-red-100 text-red-700',
        REFUNDED: 'bg-gray-100 text-gray-700',
      },
      order: {
        DELIVERED: 'bg-green-100 text-green-700',
        SHIPPED: 'bg-blue-100 text-blue-700',
        PROCESSING: 'bg-yellow-100 text-yellow-700',
        PENDING: 'bg-gray-100 text-gray-700',
        CANCELLED: 'bg-red-100 text-red-700',
      },
    };

    const labels = {
      payment: {
        PAID: 'Ödendi',
        PENDING: 'Bekliyor',
        FAILED: 'Başarısız',
        REFUNDED: 'İade Edildi',
      },
      order: {
        DELIVERED: 'Teslim Edildi',
        SHIPPED: 'Kargoda',
        PROCESSING: 'Hazırlanıyor',
        PENDING: 'Bekliyor',
        CANCELLED: 'İptal',
      },
    };

    const colorClass = badges[type][status as keyof typeof badges[typeof type]] || 'bg-gray-100 text-gray-700';
    const label = labels[type][status as keyof typeof labels[typeof type]] || status;

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${colorClass}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Offer Creation Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Yeni Kampanya Oluştur</h2>
                <button
                  onClick={() => {
                    setShowOfferModal(false);
                    resetOfferForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateOffer} className="p-6 space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ürün Seç <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">-- Ürün Seçin --</option>
                  {customer?.wishlist.map((item) => (
                    <option key={item.product.id} value={item.product.id}>
                      {item.product.name} (₺{Number(item.product.price).toFixed(2)})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {customer?.wishlist.length === 0
                    ? 'Müşterinin istek listesinde ürün yok'
                    : `Müşterinin istek listesinden ${customer?.wishlist.length} ürün`}
                </p>
              </div>

              {/* Offer Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kampanya Tipi <span className="text-red-500">*</span>
                </label>
                <select
                  value={offerType}
                  onChange={(e) => setOfferType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="PERCENTAGE_DISCOUNT">Yüzde İndirim (%)</option>
                  <option value="FIXED_DISCOUNT">Sabit İndirim (₺)</option>
                  <option value="BUY_X_GET_Y">X Al Y Bedava</option>
                </select>
              </div>

              {/* Conditional Fields Based on Offer Type */}
              {offerType === 'PERCENTAGE_DISCOUNT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İndirim Yüzdesi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      required
                      min="1"
                      max="100"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Örn: 15"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">%</span>
                  </div>
                </div>
              )}

              {offerType === 'FIXED_DISCOUNT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İndirim Tutarı <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      required
                      min="0.01"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Örn: 50"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">₺</span>
                  </div>
                </div>
              )}

              {offerType === 'BUY_X_GET_Y' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alış Adedi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={buyQuantity}
                      onChange={(e) => setBuyQuantity(e.target.value)}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Örn: 2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedava Adedi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={getQuantity}
                      onChange={(e) => setGetQuantity(e.target.value)}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Örn: 1"
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Kampanya hakkında açıklama (opsiyonel)"
                />
              </div>

              {/* Valid Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlangıç Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitiş Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Max Usage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maksimum Kullanım Sayısı
                </label>
                <input
                  type="number"
                  value={maxUsage}
                  onChange={(e) => setMaxUsage(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Boş bırakılırsa sınırsız"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Kampanyanın kaç kez kullanılabileceğini belirler (opsiyonel)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowOfferModal(false);
                    resetOfferForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={submittingOffer}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {submittingOffer ? 'Oluşturuluyor...' : 'Kampanya Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/customers"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Müşterilere Dön
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600">{customer.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {customer.role === 'ADMIN' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                Sistem Yöneticisi
              </span>
            )}
            <span className="text-sm text-gray-500">
              Üye: {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Toplam Harcama</div>
          <div className="text-2xl font-bold text-gray-900">₺{Number(customer.stats.totalSpent).toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Sipariş Sayısı</div>
          <div className="text-2xl font-bold text-gray-900">{customer.stats.orderCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Kayıtlı Adres</div>
          <div className="text-2xl font-bold text-gray-900">{customer.stats.addressCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">İstek Listesi</div>
          <div className="text-2xl font-bold text-gray-900">{customer.stats.wishlistCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Son Sipariş</div>
          <div className="text-sm font-semibold text-gray-900">
            {customer.stats.lastOrderDate
              ? new Date(customer.stats.lastOrderDate).toLocaleDateString('tr-TR')
              : 'Hiç sipariş yok'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Genel Bakış', count: null },
              { id: 'orders', label: 'Siparişler', count: customer.orders.length },
              { id: 'addresses', label: 'Adresler', count: customer.addresses.length },
              { id: 'wishlist', label: 'İstek Listesi', count: customer.wishlist.length },
              { id: 'wishlist-history', label: 'İstek Listesi Geçmişi', count: null },
              { id: 'offers', label: 'Özel Kampanyalar', count: offers.length },
              { id: 'activity', label: 'Aktivite Logları', count: activityLogs.length || null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-600">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">İletişim Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="text-base font-medium text-gray-900">{customer.email}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Telefon</div>
                    <div className="text-base font-medium text-gray-900">{customer.phone || '-'}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Aktivite Özeti</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kayıt Tarihi</span>
                    <span className="font-medium">{new Date(customer.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Son Güncelleme</span>
                    <span className="font-medium">{new Date(customer.updatedAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ortalama Sipariş Tutarı</span>
                    <span className="font-medium">
                      ₺{customer.stats.orderCount > 0
                        ? (customer.stats.totalSpent / customer.stats.orderCount).toFixed(2)
                        : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {customer.orders.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Sipariş yok</h3>
                  <p className="mt-1 text-sm text-gray-500">Bu müşteri henüz sipariş vermemiş</p>
                </div>
              ) : (
                customer.orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:border-orange-300 transition">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-sm font-medium text-orange-600 hover:text-orange-700"
                        >
                          #{order.orderNumber}
                        </Link>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">₺{Number(order.total).toFixed(2)}</div>
                        <div className="flex gap-2 mt-1">
                          {getStatusBadge(order.paymentStatus, 'payment')}
                          {getStatusBadge(order.orderStatus, 'order')}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {order.items.slice(0, 3).map((item, idx) => {
                        const images = typeof item.product.images === 'string' ? JSON.parse(item.product.images) : item.product.images;
                        return (
                          <div key={idx} className="relative w-12 h-12">
                            <Image
                              src={images[0] || '/placeholder.jpg'}
                              alt={item.product.name}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        );
                      })}
                      {order.items.length > 3 && (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-600">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.addresses.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Kayıtlı adres yok</h3>
                  <p className="mt-1 text-sm text-gray-500">Bu müşterinin kayıtlı adresi bulunmuyor</p>
                </div>
              ) : (
                customer.addresses.map((address) => (
                  <div key={address.id} className="border rounded-lg p-4 relative">
                    {address.isDefault && (
                      <span className="absolute top-2 right-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                        Varsayılan
                      </span>
                    )}
                    <h4 className="font-semibold text-gray-900 mb-2">{address.title}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{address.fullName}</p>
                      <p>{address.phone}</p>
                      <p>{address.address}</p>
                      <p>{address.district} / {address.city} {address.zipCode}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div className="space-y-3">
              {customer.wishlist.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">İstek listesi boş</h3>
                  <p className="mt-1 text-sm text-gray-500">Bu müşterinin istek listesinde ürün yok</p>
                </div>
              ) : (
                customer.wishlist.map((item) => {
                  const images = typeof item.product.images === 'string' ? JSON.parse(item.product.images) : item.product.images;
                  return (
                    <div key={item.id} className="border rounded-lg p-4 hover:border-orange-300 transition flex items-center gap-4">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={images[0] || '/placeholder.jpg'}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded"
                        />
                      {item.product.stockTracking && item.product.stock === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                          <span className="text-white text-xs font-semibold">Stokta Yok</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-lg font-bold text-orange-600">₺{Number(item.product.price).toFixed(2)}</div>
                        {item.product.comparePrice && (
                          <div className="text-sm text-gray-400 line-through">
                            ₺{Number(item.product.comparePrice).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Eklenme: {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Link
                        href={`/products/${item.product.slug}`}
                        target="_blank"
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition"
                      >
                        Ürüne Git
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          )}

          {/* Offers Tab */}
          {activeTab === 'offers' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Müşteriye Özel Kampanyalar</h3>
                <button
                  onClick={() => setShowOfferModal(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  + Yeni Kampanya Oluştur
                </button>
              </div>

              {loadingOffers ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : offers.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Kampanya yok</h3>
                  <p className="mt-1 text-sm text-gray-500">Bu müşteri için henüz özel kampanya oluşturulmamış</p>
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                  >
                    İlk Kampanyayı Oluştur
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {offers.map((offer) => {
                    const isExpired = new Date(offer.validUntil) < new Date();
                    const isValid = new Date(offer.validFrom) <= new Date() && new Date(offer.validUntil) >= new Date();
                    
                    return (
                      <div key={offer.id} className={`border rounded-lg p-4 ${isExpired ? 'bg-gray-50' : 'bg-white'}`}>
                        <div className="flex items-start gap-4">
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <Image
                              src={typeof offer.product.images === 'string' ? JSON.parse(offer.product.images)[0] : offer.product.images[0] || '/placeholder.jpg'}
                              alt={offer.product.name}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900 text-sm">{offer.product.name}</h4>
                                <p className="text-xs text-gray-500 mt-1">{offer.description}</p>
                              </div>
                              <div className="flex gap-2">
                                {offer.isActive && isValid && (
                                  <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">
                                    Aktif
                                  </span>
                                )}
                                {!offer.isActive && (
                                  <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded">
                                    Pasif
                                  </span>
                                )}
                                {isExpired && (
                                  <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">
                                    Süresi Dolmuş
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div>
                                <span className="text-gray-500">Kampanya Tipi:</span>
                                <div className="font-semibold text-gray-900">
                                  {offer.offerType === 'PERCENTAGE_DISCOUNT' && `%${offer.discountPercent} İndirim`}
                                  {offer.offerType === 'FIXED_DISCOUNT' && `₺${Number(offer.discountAmount).toFixed(2)} İndirim`}
                                  {offer.offerType === 'BUY_X_GET_Y' && `${offer.buyQuantity} Al ${offer.getQuantity} Bedava`}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Geçerlilik:</span>
                                <div className="font-semibold text-gray-900">
                                  {new Date(offer.validFrom).toLocaleDateString('tr-TR')} - {new Date(offer.validUntil).toLocaleDateString('tr-TR')}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Kullanım:</span>
                                <div className="font-semibold text-gray-900">
                                  {offer.usedCount} / {offer.maxUsage || '∞'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Wishlist History Tab */}
          {activeTab === 'wishlist-history' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">İstek Listesi Geçmişi</h3>

              {loadingHistory ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : wishlistHistory.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Geçmiş yok</h3>
                  <p className="mt-1 text-sm text-gray-500">Bu müşterinin istek listesi geçmişi bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {wishlistHistory.map((item) => {
                    const isAdded = item.action === 'ADDED';
                    const reasonText = {
                      'USER_REMOVED': 'Kullanıcı çıkardı',
                      'PURCHASED': 'Satın alındı',
                      'CAMPAIGN_CANCELLED': 'Kampanya iptal edildi',
                      'PRODUCT_UNAVAILABLE': 'Ürün yayından kaldırıldı',
                      'ADMIN_REMOVED': 'Sistem yöneticisi sildi',
                      'SYSTEM_CLEANUP': 'Sistem temizliği',
                    }[item.reason || ''] || item.reason;

                    return (
                      <div key={item.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition">
                        <div className="flex items-start gap-4">
                          <div className="relative w-16 h-16 flex-shrink-0">
                            {item.currentProduct?.image || item.productImage ? (
                              <Image
                                src={item.currentProduct?.image || item.productImage || '/placeholder.jpg'}
                                alt={item.productName}
                                fill
                                className="object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            {!item.productExists && (
                              <div className="absolute inset-0 bg-black bg-opacity-60 rounded flex items-center justify-center">
                                <span className="text-white text-[10px] font-semibold text-center px-1">Ürün Yok</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0 mr-4">
                                <h4 className="font-medium text-gray-900 text-sm truncate">
                                  {item.currentProduct?.name || item.productName}
                                </h4>
                                {item.currentProduct && item.productExists && (
                                  <p className="text-sm font-semibold text-orange-600 mt-1">
                                    ₺{item.currentProduct.price.toFixed(2)}
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                {isAdded ? (
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Eklendi
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Çıkarıldı
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-gray-500">Tarih:</span>
                                <div className="font-medium text-gray-900">
                                  {new Date(item.createdAt).toLocaleString('tr-TR', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                              {!isAdded && item.reason && (
                                <div>
                                  <span className="text-gray-500">Sebep:</span>
                                  <div className="font-medium text-gray-900">{reasonText}</div>
                                </div>
                              )}
                            </div>

                            {item.notes && (
                              <div className="mt-2 text-xs text-gray-600 italic bg-gray-50 rounded p-2">
                                {item.notes}
                              </div>
                            )}

                            {item.productExists && item.productSlug && (
                              <div className="mt-2">
                                <Link
                                  href={`/products/${item.productSlug}`}
                                  target="_blank"
                                  className="inline-flex items-center text-xs text-orange-600 hover:text-orange-700 font-medium"
                                >
                                  Ürünü Görüntüle
                                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Activity Logs Tab */}
          {activeTab === 'activity' && (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Aktivite Logları</h2>
                  <button
                    onClick={() => {
                      fetchActivityLogs();
                      fetchActivityStats();
                    }}
                    disabled={loadingActivity}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg 
                      className={`w-4 h-4 ${loadingActivity ? 'animate-spin' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loadingActivity ? 'Yükleniyor...' : 'Yenile'}
                  </button>
                </div>
                
                {/* Stats Cards */}
                {activityStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="text-sm text-blue-700 font-medium mb-1">Toplam Aktivite</div>
                      <div className="text-2xl font-bold text-blue-900">{activityStats.totalActivities}</div>
                      <div className="text-xs text-blue-600 mt-1">Son 30 gün</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <div className="text-sm text-green-700 font-medium mb-1">En Çok Kullanılan Cihaz</div>
                      <div className="text-lg font-bold text-green-900 capitalize">
                        {Object.entries(activityStats.deviceStats).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <div className="text-sm text-purple-700 font-medium mb-1">En Çok Kullanılan Tarayıcı</div>
                      <div className="text-lg font-bold text-purple-900">
                        {Object.entries(activityStats.browserStats).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                      <div className="text-sm text-orange-700 font-medium mb-1">En Aktif İşlem</div>
                      <div className="text-sm font-bold text-orange-900">
                        {activityStats.topActions[0]?.action || 'N/A'}
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        {activityStats.topActions[0]?.count || 0} kez
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="flex gap-4 mb-4">
                  <select
                    value={activityFilter.category}
                    onChange={(e) => setActivityFilter({ ...activityFilter, category: e.target.value })}
                    className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Tüm Kategoriler</option>
                    <option value="AUTH">Kimlik Doğrulama</option>
                    <option value="PRODUCT">Ürün</option>
                    <option value="CART">Sepet</option>
                    <option value="WISHLIST">İstek Listesi</option>
                    <option value="ORDER">Sipariş</option>
                    <option value="PAYMENT">Ödeme</option>
                    <option value="ADDRESS">Adres</option>
                    <option value="PROFILE">Profil</option>
                    <option value="REVIEW">Yorum</option>
                    <option value="SYSTEM">Sistem</option>
                    <option value="ERROR">Hata</option>
                  </select>

                  <select
                    value={activityFilter.action}
                    onChange={(e) => setActivityFilter({ ...activityFilter, action: e.target.value })}
                    className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Tüm İşlemler</option>
                    <optgroup label="Kimlik Doğrulama">
                      <option value="LOGIN">Giriş</option>
                      <option value="LOGOUT">Çıkış</option>
                      <option value="REGISTER">Kayıt</option>
                    </optgroup>
                    <optgroup label="Ürün">
                      <option value="PRODUCT_VIEW">Ürün Görüntüleme</option>
                      <option value="PRODUCT_SEARCH">Ürün Arama</option>
                    </optgroup>
                    <optgroup label="Sepet">
                      <option value="CART_ADD">Sepete Ekleme</option>
                      <option value="CART_REMOVE">Sepetten Çıkarma</option>
                    </optgroup>
                    <optgroup label="Sipariş">
                      <option value="ORDER_CREATE">Sipariş Oluşturma</option>
                      <option value="CHECKOUT_COMPLETE">Ödeme Tamamlama</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Activity Logs List */}
              {loadingActivity ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="mt-2 text-gray-600">Aktivite logları yükleniyor...</p>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Henüz aktivite kaydı yok
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log) => {
                    const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
                      AUTH: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                      PRODUCT: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
                      CART: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
                      WISHLIST: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
                      ORDER: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                      PAYMENT: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
                      ADDRESS: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
                      PROFILE: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
                      REVIEW: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
                      SYSTEM: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
                      ERROR: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
                    };

                    const colors = categoryColors[log.category] || categoryColors.SYSTEM;

                    return (
                      <div key={log.id} className={`border-2 ${colors.border} ${colors.bg} rounded-xl p-4 hover:shadow-md transition`}>
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`w-10 h-10 ${colors.bg} border-2 ${colors.border} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <span className={`text-lg ${colors.text}`}>
                              {log.category === 'AUTH' && '🔐'}
                              {log.category === 'PRODUCT' && '📦'}
                              {log.category === 'CART' && '🛒'}
                              {log.category === 'WISHLIST' && '❤️'}
                              {log.category === 'ORDER' && '📋'}
                              {log.category === 'PAYMENT' && '💳'}
                              {log.category === 'ADDRESS' && '📍'}
                              {log.category === 'PROFILE' && '👤'}
                              {log.category === 'REVIEW' && '⭐'}
                              {log.category === 'SYSTEM' && '⚙️'}
                              {log.category === 'ERROR' && '❌'}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-1 ${colors.bg} ${colors.text} border ${colors.border} rounded text-xs font-semibold uppercase`}>
                                    {log.category}
                                  </span>
                                  <span className="text-xs font-medium text-gray-600">{log.action.replace(/_/g, ' ')}</span>
                                </div>
                                <p className="text-sm font-medium text-gray-900">{log.description}</p>
                              </div>
                              <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString('tr-TR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </div>
                            </div>

                            {/* Technical Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-200">
                              <div>
                                <div className="text-xs text-gray-500">IP Adresi</div>
                                <div className="text-xs font-mono font-semibold text-gray-900">{log.ipAddress || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Port</div>
                                <div className="text-xs font-mono font-semibold text-gray-900">{log.port || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Cihaz</div>
                                <div className="text-xs font-semibold text-gray-900 capitalize">{log.device || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Tarayıcı</div>
                                <div className="text-xs font-semibold text-gray-900">{log.browser || 'N/A'}</div>
                              </div>
                            </div>

                            {/* OS & Status */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                              <div>
                                <div className="text-xs text-gray-500">İşletim Sistemi</div>
                                <div className="text-xs font-semibold text-gray-900">{log.os || 'N/A'}</div>
                              </div>
                              {log.statusCode && (
                                <div>
                                  <div className="text-xs text-gray-500">Status Code</div>
                                  <div className={`text-xs font-mono font-bold ${log.statusCode >= 200 && log.statusCode < 300 ? 'text-green-600' : log.statusCode >= 400 ? 'text-red-600' : 'text-gray-900'}`}>
                                    {log.statusCode}
                                  </div>
                                </div>
                              )}
                              {log.duration && (
                                <div>
                                  <div className="text-xs text-gray-500">Süre</div>
                                  <div className="text-xs font-mono font-semibold text-gray-900">{log.duration}ms</div>
                                </div>
                              )}
                            </div>

                            {/* User Agent */}
                            {log.userAgent && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="text-xs text-gray-500">User Agent</div>
                                <div className="text-xs font-mono text-gray-700 break-all">{log.userAgent}</div>
                              </div>
                            )}

                            {/* Metadata */}
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">Ek Bilgiler</div>
                                <pre className="text-xs bg-gray-100 rounded p-2 overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}

                            {/* Error Message */}
                            {log.errorMessage && (
                              <div className="mt-2 pt-2 border-t border-red-200">
                                <div className="text-xs text-red-600 font-medium mb-1">Hata Mesajı</div>
                                <div className="text-xs bg-red-50 text-red-800 rounded p-2">{log.errorMessage}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
