'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string;
  currentStock: number;
  currentPrice: number;
}

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  product: Product | null;
}

interface Address {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  zipCode: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
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
  paramposTransactionId: string | null;
  paramposOrderId: string | null;
  // Payment Receipt Fields
  paymentReceiptBase64: string | null;
  paymentReceiptFileName: string | null;
  paymentReceiptMimeType: string | null;
  paymentReceiptUploadedAt: string | null;
  paymentApprovedAt: string | null;
  paymentRejectedAt: string | null;
  paymentRejectionReason: string | null;
  items: OrderItem[];
  // Geliver Cargo Fields
  geliverShipmentId: string | null;
  geliverTransactionId: string | null;
  cargoProvider: string | null;
  cargoTrackingUrl: string | null;
  cargoTrackingNumber: string | null;
  cargoBarcode: string | null;
  cargoLabelUrl: string | null;
  cargoResponsiveLabelUrl: string | null;
}

interface CargoOffer {
  id: string;
  providerName: string;
  serviceName: string;
  price: number;
  currency: string;
  deliveryTime: string;
}

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    orderStatus: '',
    paymentStatus: '',
    trackingNumber: '',
    notes: '',
  });

  // Cargo states
  const [showCargoModal, setShowCargoModal] = useState(false);
  const [cargoLoading, setCargoLoading] = useState(false);
  const [cargoOffers, setCargoOffers] = useState<CargoOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<CargoOffer | null>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);

  // Tracking states
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  // Payment receipt states
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);

  useEffect(() => {
    loadOrderDetail();
  }, [params.id]);

  // Sipariş yüklendikten sonra kargo durumunu otomatik çek
  useEffect(() => {
    if (order && order.geliverShipmentId && !trackingInfo) {
      fetchTrackingInfo();
    }
  }, [order]);

  const loadOrderDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/admin/orders/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setUpdateForm({
          orderStatus: data.orderStatus,
          paymentStatus: data.paymentStatus,
          trackingNumber: data.trackingNumber || '',
          notes: data.notes || '',
        });
      } else if (res.status === 401 || res.status === 403) {
        router.push('/login');
      } else if (res.status === 404) {
        alert('Sipariş bulunamadı');
        router.push('/admin/orders');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Sipariş yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!order) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateForm),
      });

      if (res.ok) {
        alert('Sipariş güncellendi');
        setShowUpdateModal(false);
        loadOrderDetail();
      } else {
        const error = await res.json();
        alert(error.error || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Güncelleme sırasında hata oluştu');
    } finally {
      setUpdating(false);
    }
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

  const getPaymentMethodText = (method: string) => {
    const methods: { [key: string]: string } = {
      CREDIT_CARD: 'Kredi Kartı',
      BANK_TRANSFER: 'Havale / EFT',
      CASH_ON_DELIVERY: 'Kapıda Ödeme',
    };
    return methods[method] || method;
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Tracking functions
  const fetchTrackingInfo = async () => {
    if (!order?.geliverShipmentId) return;

    setTrackingLoading(true);
    setTrackingError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/admin/shipping/track?shipmentId=${order.geliverShipmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Takip bilgisi alınamadı');
      }

      const data = await response.json();
      setTrackingInfo(data);

      // Reload order to get updated status
      await loadOrderDetail();
    } catch (err: any) {
      setTrackingError(err.message || 'Bir hata oluştu');
    } finally {
      setTrackingLoading(false);
    }
  };

  const getTrackingStatusText = (statusCode: string) => {
    const statusMap: { [key: string]: { text: string; color: string } } = {
      PENDING: { text: '⏳ Kargo bekleniyor', color: 'text-yellow-600' },
      PICKED_UP: { text: '📦 Kargoya alındı', color: 'text-blue-600' },
      IN_TRANSIT: { text: '🚚 Dağıtımda', color: 'text-purple-600' },
      OUT_FOR_DELIVERY: { text: '🏃 Teslimat aşamasında', color: 'text-orange-600' },
      DELIVERED: { text: '✅ Teslim edildi', color: 'text-green-600' },
      FAILED: { text: '❌ Teslim başarısız', color: 'text-red-600' },
      RETURNED: { text: '↩️ İade edildi', color: 'text-gray-600' },
    };

    return statusMap[statusCode] || { text: statusCode, color: 'text-gray-600' };
  };

  const getStatusCode = (status: any) => {
    // Geliver API statusCode veya trackingStatusCode dönebilir
    return status?.statusCode || status?.trackingStatusCode || 'UNKNOWN';
  };

  // Cargo functions
  const getProviderName = (providerCode: string) => {
    const providers: { [key: string]: string } = {
      GELIVER: 'Geliver',
      MNG: 'MNG Kargo',
      YURTICI: 'Yurtiçi Kargo',
      ARAS: 'Aras Kargo',
      PTT: 'PTT Kargo',
      SURAT: 'Sürat Kargo',
      UPS: 'UPS',
      DHL: 'DHL',
      FEDEX: 'FedEx',
    };
    return providers[providerCode] || providerCode;
  };

  const getServiceName = (serviceCode: string) => {
    const services: { [key: string]: string } = {
      GELIVER_STANDART: 'Standart',
      SURAT_STANDART: 'Standart',
      MNG_STANDART: 'Standart',
      YURTICI_STANDART: 'Standart',
      ARAS_STANDART: 'Standart',
    };
    return services[serviceCode] || serviceCode.replace(/_/g, ' ');
  };

  // Desi hesaplama state'leri
  const [desi, setDesi] = useState<number>(3);
  const [showDesiCalculator, setShowDesiCalculator] = useState(false);
  const [calculatorLength, setCalculatorLength] = useState<string>('30');
  const [calculatorWidth, setCalculatorWidth] = useState<string>('20');
  const [calculatorHeight, setCalculatorHeight] = useState<string>('15');
  const [calculatedDesi, setCalculatedDesi] = useState<number>(0);

  const calculateDesi = () => {
    const l = parseFloat(calculatorLength) || 0;
    const w = parseFloat(calculatorWidth) || 0;
    const h = parseFloat(calculatorHeight) || 0;
    const result = (l * w * h) / 3000;
    setCalculatedDesi(result);
    setDesi(result);
  };

  // Payment receipt functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Dosya boyutu 5MB\'dan küçük olmalıdır');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Sadece JPEG, PNG ve PDF dosyaları yüklenebilir');
        return;
      }

      setReceiptFile(file);
    }
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !order) return;

    setReceiptLoading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/orders/${order.id}/payment-receipt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileBase64: base64Data,
            fileName: receiptFile.name,
            mimeType: receiptFile.type,
          }),
        });

        if (response.ok) {
          alert('Dekont başarıyla yüklendi');
          setShowReceiptModal(false);
          setReceiptFile(null);
          await loadOrderDetail();
        } else {
          const data = await response.json();
          alert(data.error || 'Dekont yükleme başarısız');
        }
      };
      reader.readAsDataURL(receiptFile);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Dekont yükleme hatası');
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!order) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/orders/${order.id}/payment-receipt`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const { base64, fileName, mimeType } = data.file;

        // Create download link
        const link = document.createElement('a');
        link.href = `data:${mimeType};base64,${base64}`;
        link.download = fileName || 'dekont';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Dekont indirilemedi');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Dekont indirme hatası');
    }
  };

  const handleApprovePayment = async () => {
    if (!order || !approvalAction) return;

    if (approvalAction === 'REJECT' && !rejectionReason.trim()) {
      alert('Red nedeni belirtilmelidir');
      return;
    }

    setApprovalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/orders/${order.id}/approve-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: approvalAction,
          rejectionReason: approvalAction === 'REJECT' ? rejectionReason : undefined,
        }),
      });

      if (response.ok) {
        alert(approvalAction === 'APPROVE' ? 'Ödeme onaylandı' : 'Ödeme reddedildi');
        setShowApprovalModal(false);
        setApprovalAction(null);
        setRejectionReason('');
        await loadOrderDetail();
      } else {
        const data = await response.json();
        alert(data.error || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Approval error:', error);
      alert('İşlem hatası');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleCreateShipment = async () => {
    if (!order) return;

    setCargoLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/shipping/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          desi: desi, // Desi bilgisini gönder
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        alert('Kargo gönderisi oluşturuldu! Teklifler yükleniyor...');
        setShowCargoModal(false);
        // Teklifleri getir
        await loadCargoOffers(data.shipment.id);
      } else {
        const errorMsg = data.error || 'Kargo gönderisi oluşturulamadı';
        const hint = data.hint || '';
        alert(`${errorMsg}\n\n${hint}`);
      }
    } catch (error) {
      console.error('Create shipment error:', error);
      alert('Kargo gönderisi oluşturulurken hata oluştu');
    } finally {
      setCargoLoading(false);
    }
  };

  const loadCargoOffers = async (shipmentId?: string) => {
    const sid = shipmentId || order?.geliverShipmentId;
    if (!sid) return;

    setOffersLoading(true);
    setShowOffersModal(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/shipping/offers?shipmentId=${sid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      console.log('Offers API response:', data);

      if (res.ok && data.offers) {
        console.log('Offers data structure:', data.offers);
        // Geliver API offers.list dizisini kullanıyor
        const offersArray = data.offers.list || data.offers.data || data.offers.offers || [];
        console.log('Offers array:', offersArray);
        
        setCargoOffers(offersArray.map((offer: any) => ({
          id: offer.id,
          providerName: getProviderName(offer.providerCode || ''),
          serviceName: getServiceName(offer.providerServiceCode || ''),
          price: parseFloat(offer.totalAmount || offer.amount || 0),
          currency: offer.currency || 'TRY',
          deliveryTime: offer.averageEstimatedTimeHumanReadible || offer.durationTerms || '-',
        })));
        
        if (offersArray.length === 0) {
          alert('Teklifler henüz hazır değil. Birkaç saniye sonra tekrar deneyin.');
          setShowOffersModal(false);
        }
      } else {
        console.error('Offers not ready or error:', data);
        alert('Teklifler henüz hazır değil. Birkaç saniye sonra tekrar deneyin.');
        setShowOffersModal(false);
      }
    } catch (error) {
      console.error('Load offers error:', error);
      alert('Teklifler yüklenirken hata oluştu');
      setShowOffersModal(false);
    } finally {
      setOffersLoading(false);
    }
  };

  const handleAcceptOffer = async (offer: CargoOffer) => {
    if (!order) return;

    if (!confirm(`${offer.providerName} - ${offer.serviceName} (${offer.price} ${offer.currency}) teklifini kabul etmek istiyor musunuz?`)) {
      return;
    }

    setOffersLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/shipping/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          offerId: offer.id,
          providerName: offer.providerName,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Kargo teklifi kabul edildi! Etiket oluşturuldu.');
        setShowOffersModal(false);
        loadOrderDetail(); // Sayfayı yenile
      } else {
        alert(data.error || 'Teklif kabul edilemedi');
      }
    } catch (error) {
      console.error('Accept offer error:', error);
      alert('Teklif kabul edilirken hata oluştu');
    } finally {
      setOffersLoading(false);
    }
  };

  const handleDownloadLabel = async (format: 'pdf' | 'html') => {
    if (!order?.cargoLabelUrl && !order?.cargoResponsiveLabelUrl) {
      alert('Etiket URL\'si bulunamadı');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = format === 'pdf' ? order.cargoLabelUrl : order.cargoResponsiveLabelUrl;
      
      if (!url) {
        alert(`${format.toUpperCase()} etiketi bulunamadı`);
        return;
      }

      const res = await fetch(`/api/admin/shipping/label?url=${encodeURIComponent(url)}&format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `kargo-etiketi-${order.orderNumber}.${format === 'pdf' ? 'pdf' : 'html'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } else {
        alert('Etiket indirilemedi');
      }
    } catch (error) {
      console.error('Download label error:', error);
      alert('Etiket indirilirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg mb-4">Sipariş bulunamadı</p>
        <Link
          href="/admin/orders"
          className="text-orange-500 hover:text-orange-600 font-semibold"
        >
          Siparişlere Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-semibold mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Siparişlere Dön
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 bg-clip-text text-transparent mb-2">
              Sipariş #{order.orderNumber}
            </h1>
            <p className="text-gray-600">
              Sipariş Tarihi: {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span
              className={`inline-block px-4 py-2 rounded-xl text-sm font-semibold border-2 ${getStatusColor(
                order.paymentStatus
              )}`}
            >
              {getStatusText(order.paymentStatus)}
            </span>
            <span
              className={`inline-block px-4 py-2 rounded-xl text-sm font-semibold border-2 ${getStatusColor(
                order.orderStatus
              )}`}
            >
              {getStatusText(order.orderStatus)}
            </span>
            <button
              onClick={() => setShowUpdateModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
            >
              Durumu Güncelle
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sipariş Ürünleri</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                >
                  <img
                    src={item.image || '/placeholder-product.jpg'}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.quantity} adet × {formatPrice(Number(item.price))}
                    </p>
                    {item.product && (
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-600">
                          Güncel Stok: <span className="font-semibold">{item.product.currentStock}</span>
                        </span>
                        <span className="text-gray-600">
                          Güncel Fiyat: <span className="font-semibold">{formatPrice(Number(item.product.currentPrice))}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-lg">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Müşteri Bilgileri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ad Soyad</p>
                <p className="font-semibold text-gray-900">{order.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">E-posta</p>
                <p className="font-semibold text-gray-900">{order.customer.email}</p>
              </div>
              {order.customer.phone && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Telefon</p>
                  <p className="font-semibold text-gray-900">{order.customer.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping Address */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Teslimat Adresi</h2>
              <div className="text-gray-700 space-y-1">
                <p className="font-semibold">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.district} / {order.shippingAddress.city}
                </p>
                <p>{order.shippingAddress.zipCode}</p>
              </div>
            </div>

            {/* Billing Address */}
            {order.billingAddress && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Fatura Adresi</h2>
                <div className="text-gray-700 space-y-1">
                  <p className="font-semibold">{order.billingAddress.fullName}</p>
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
        </div>

        {/* Right Column - Summary & Info */}
        <div className="space-y-6">
          {/* Cargo Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Kargo İşlemleri</h2>
            
            {!order.geliverShipmentId ? (
              /* Kargo gönderisi yoksa oluştur butonu */
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">Henüz kargo gönderisi oluşturulmadı</p>
                <button
                  onClick={() => setShowCargoModal(true)}
                  disabled={cargoLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {cargoLoading ? 'Oluşturuluyor...' : '📦 Kargo Gönderisi Oluştur'}
                </button>
              </div>
            ) : !order.cargoLabelUrl && !order.cargoBarcode ? (
              /* Gönderi var ama teklif kabul edilmemişse */
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">✓</span> Kargo gönderisi oluşturuldu
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Shipment ID: {order.geliverShipmentId}</p>
                </div>
                <button
                  onClick={() => loadCargoOffers()}
                  disabled={offersLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {offersLoading ? 'Yükleniyor...' : '📋 Kargo Tekliflerini Gör'}
                </button>
              </div>
            ) : (
              /* Teklif kabul edildiyse - bilgileri göster */
              <div className="space-y-4">
                {/* Teslim edilmemiş siparişler için kargo bilgileri */}
                {order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-green-800 mb-2">
                      <span className="mr-2">✓</span>Kargo Etiketi Oluşturuldu
                    </p>
                    
                    {order.cargoProvider && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-600">Kargo Firması</p>
                        <p className="font-semibold text-gray-900">{order.cargoProvider}</p>
                      </div>
                    )}

                    {order.cargoBarcode && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-600">Barkod</p>
                        <p className="font-mono text-sm text-gray-900">{order.cargoBarcode}</p>
                      </div>
                    )}

                    {order.cargoTrackingNumber && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-600">Takip Numarası</p>
                        <p className="font-mono text-sm text-gray-900">{order.cargoTrackingNumber}</p>
                      </div>
                    )}

                    {order.cargoTrackingUrl && (
                      <a
                        href={order.cargoTrackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-sm text-blue-600 hover:text-blue-700 underline mb-3"
                      >
                        🔗 Kargoyu Takip Et
                      </a>
                    )}
                  </div>
                )}

                {/* Güncel Kargo Durumu - Otomatik Yüklenir */}
                {trackingLoading && !trackingInfo && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                    <span className="text-sm text-gray-600">Kargo durumu sorgulanıyor...</span>
                  </div>
                )}

                {trackingInfo?.trackingStatus && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs text-gray-600 mb-2">Güncel Kargo Durumu</p>
                    <p className={`font-semibold text-base ${getTrackingStatusText(getStatusCode(trackingInfo.trackingStatus)).color}`}>
                      {getTrackingStatusText(getStatusCode(trackingInfo.trackingStatus)).text}
                    </p>
                    {(trackingInfo.trackingStatus.subStatusCode || trackingInfo.trackingStatus.trackingSubStatusCode) && (
                      <p className="text-xs text-gray-600 mt-1">
                        {trackingInfo.trackingStatus.subStatusCode || trackingInfo.trackingStatus.trackingSubStatusCode}
                      </p>
                    )}
                    {trackingInfo.shipment?.updatedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Son güncelleme: {formatDate(trackingInfo.shipment.updatedAt)}
                      </p>
                    )}
                    {/* Yenile Butonu */}
                    <button
                      onClick={fetchTrackingInfo}
                      disabled={trackingLoading}
                      className="mt-3 w-full bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 transition disabled:bg-gray-400"
                    >
                      {trackingLoading ? 'Güncelleniyor...' : '🔄 Yenile'}
                    </button>
                  </div>
                )}

                {trackingError && !trackingInfo && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
                    <p className="font-medium mb-1">Kargo durumu alınamadı</p>
                    <p className="text-xs">{trackingError}</p>
                    <button
                      onClick={fetchTrackingInfo}
                      disabled={trackingLoading}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Tekrar dene
                    </button>
                  </div>
                )}

                {/* Teslim edilmemiş siparişler için ek butonlar */}
                {order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED' && (
                  <>
                    {/* Teklifleri Tekrar Görüntüleme Butonu */}
                    <button
                      onClick={() => loadCargoOffers()}
                      disabled={offersLoading}
                      className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 text-sm"
                    >
                      {offersLoading ? 'Yükleniyor...' : '🔄 Teklifleri Tekrar Gör'}
                    </button>

                    {/* Etiket İndirme Butonları */}
                    <div className="grid grid-cols-2 gap-3">
                      {order.cargoLabelUrl && (
                        <button
                          onClick={() => handleDownloadLabel('pdf')}
                          className="bg-red-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-600 transition text-sm"
                        >
                          📄 PDF İndir
                        </button>
                      )}
                      {order.cargoResponsiveLabelUrl && (
                        <button
                          onClick={() => handleDownloadLabel('html')}
                          className="bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition text-sm"
                        >
                          📱 HTML İndir
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* Teslim edilen siparişler için bilgi mesajı */}
                {order.orderStatus === 'DELIVERED' && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
                    <p className="font-medium">✅ Sipariş teslim edildi</p>
                    <p className="text-xs mt-1">İade işlemleri için müşteri hizmetleri ile iletişime geçiniz.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sipariş Özeti</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-gray-700">
                <span>Ara Toplam</span>
                <span className="font-semibold">{formatPrice(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Kargo</span>
                <span className="font-semibold">
                  {Number(order.shipping) === 0 ? 'Ücretsiz' : formatPrice(Number(order.shipping))}
                </span>
              </div>
              {Number(order.tax) > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>KDV</span>
                  <span className="font-semibold">{formatPrice(Number(order.tax))}</span>
                </div>
              )}
              <div className="border-t-2 border-gray-200 pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-gray-900">Toplam</span>
                  <span className="text-orange-600">{formatPrice(Number(order.total))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ödeme Bilgileri</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ödeme Yöntemi</p>
                <p className="font-semibold text-gray-900">{getPaymentMethodText(order.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Ödeme Durumu</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                    order.paymentStatus
                  )}`}
                >
                  {getStatusText(order.paymentStatus)}
                </span>
              </div>
              {order.paramposTransactionId && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">İşlem ID</p>
                  <p className="font-mono text-sm text-gray-900">{order.paramposTransactionId}</p>
                </div>
              )}

              {/* EFT/Havale Dekont Bölümü */}
              {order.paymentMethod === 'BANK_TRANSFER' && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">💳 Dekont İşlemleri</h3>
                  
                  {/* Dekont Yükleme */}
                  {!order.paymentReceiptBase64 && order.paymentStatus === 'PENDING' && (
                    <button
                      onClick={() => setShowReceiptModal(true)}
                      className="w-full bg-blue-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-600 transition mb-3"
                    >
                      📎 Dekont Yükle
                    </button>
                  )}

                  {/* Dekont Yüklendi */}
                  {order.paymentReceiptBase64 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
                      <p className="text-sm font-semibold text-green-900 mb-2">
                        ✓ Dekont yüklendi
                      </p>
                      <p className="text-xs text-green-700 mb-2">
                        Dosya: {order.paymentReceiptFileName}
                      </p>
                      <p className="text-xs text-green-600 mb-3">
                        {order.paymentReceiptUploadedAt && `Yüklenme: ${formatDate(order.paymentReceiptUploadedAt)}`}
                      </p>
                      <button
                        onClick={handleDownloadReceipt}
                        className="w-full bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition"
                      >
                        📥 Dekont İndir
                      </button>
                    </div>
                  )}

                  {/* Onay Durumu */}
                  {order.paymentApprovedAt && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-green-900">
                        ✅ Ödeme Onaylandı
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        {formatDate(order.paymentApprovedAt)}
                      </p>
                    </div>
                  )}

                  {order.paymentRejectedAt && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-red-900">
                        ❌ Ödeme Reddedildi
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        {formatDate(order.paymentRejectedAt)}
                      </p>
                      {order.paymentRejectionReason && (
                        <p className="text-xs text-red-600 mt-2">
                          Neden: {order.paymentRejectionReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Onay Butonları */}
                  {order.paymentReceiptBase64 && 
                   !order.paymentApprovedAt && 
                   !order.paymentRejectedAt && 
                   order.paymentStatus === 'PENDING' && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <button
                        onClick={() => {
                          setApprovalAction('APPROVE');
                          setShowApprovalModal(true);
                        }}
                        className="bg-green-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-600 transition text-sm"
                      >
                        ✓ Onayla
                      </button>
                      <button
                        onClick={() => {
                          setApprovalAction('REJECT');
                          setShowApprovalModal(true);
                        }}
                        className="bg-red-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-600 transition text-sm"
                      >
                        ✗ Reddet
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Shipping Info */}
          {order.trackingNumber && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Kargo Takip</h2>
              <div>
                <p className="text-sm text-gray-600 mb-2">Takip Numarası</p>
                <p className="font-mono font-semibold text-gray-900 mb-4">{order.trackingNumber}</p>
                <button className="w-full bg-purple-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-purple-600 transition">
                  Kargoyu Takip Et
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sipariş Notu</h2>
              <p className="text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cargo Create Modal */}
      {showCargoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="border-b border-gray-200 px-8 py-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Kargo Gönderisi Oluştur</h3>
                <button
                  onClick={() => setShowCargoModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">ℹ️ Bilgi:</span> Geliver entegrasyonu ile kargo gönderisi oluşturulacak. 
                  Teklif alınacak ve en uygun kargo firmasını seçebileceksiniz.
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Sipariş: <span className="font-semibold">{order?.orderNumber}</span></p>
                <p className="text-sm text-gray-600 mb-2">Müşteri: <span className="font-semibold">{order?.customer.name}</span></p>
                <p className="text-sm text-gray-600">Adres: <span className="font-semibold">{order?.shippingAddress.city} / {order?.shippingAddress.district}</span></p>
              </div>

              {/* Desi Girişi */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Desi (kg)
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={desi}
                    onChange={(e) => setDesi(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Örn: 3.5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDesiCalculator(!showDesiCalculator)}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                  >
                    🧮 Hesapla
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Tahmini paket desisi (kargo teklifi için kullanılacak)</p>
              </div>

              {/* Desi Hesaplama Aracı */}
              {showDesiCalculator && (
                <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Desi Hesaplama
                  </h4>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Uzunluk (cm)</label>
                      <input
                        type="number"
                        value={calculatorLength}
                        onChange={(e) => setCalculatorLength(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Genişlik (cm)</label>
                      <input
                        type="number"
                        value={calculatorWidth}
                        onChange={(e) => setCalculatorWidth(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        placeholder="20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Yükseklik (cm)</label>
                      <input
                        type="number"
                        value={calculatorHeight}
                        onChange={(e) => setCalculatorHeight(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        placeholder="15"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={calculateDesi}
                    className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium text-sm mb-2"
                  >
                    Hesapla
                  </button>
                  {calculatedDesi > 0 && (
                    <div className="bg-white rounded-lg p-3 border border-orange-200">
                      <p className="text-xs text-gray-600 mb-1">Hesaplanan Desi:</p>
                      <p className="text-2xl font-bold text-orange-600">{calculatedDesi.toFixed(2)} kg</p>
                      <p className="text-xs text-gray-500 mt-1">Formül: (U × G × Y) ÷ 3000</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCargoModal(false)}
                  disabled={cargoLoading}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateShipment}
                  disabled={cargoLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {cargoLoading ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offers Modal */}
      {showOffersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Kargo Teklifleri</h3>
                <button
                  onClick={() => setShowOffersModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8">
              {offersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : cargoOffers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">Henüz teklif bulunmuyor</p>
                  <p className="text-sm text-gray-500">Teklifler oluşturulurken birkaç saniye sürebilir. Lütfen bekleyip tekrar deneyin.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cargoOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 transition"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{offer.providerName}</h4>
                          <p className="text-sm text-gray-600">{offer.serviceName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600">
                            {offer.price.toFixed(2)} {offer.currency}
                          </p>
                          {offer.deliveryTime && (
                            <p className="text-xs text-gray-500">{offer.deliveryTime}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAcceptOffer(offer)}
                        disabled={offersLoading}
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                      >
                        Bu Teklifi Kabul Et
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Sipariş Durumu Güncelle</h3>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Sipariş Durumu <span className="text-red-500">*</span>
                </label>
                <select
                  value={updateForm.orderStatus}
                  onChange={(e) => setUpdateForm({ ...updateForm, orderStatus: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="PENDING">Beklemede</option>
                  <option value="PROCESSING">Hazırlanıyor</option>
                  <option value="SHIPPED">Kargoya Verildi</option>
                  <option value="DELIVERED">Teslim Edildi</option>
                  <option value="CANCELLED">İptal Edildi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Ödeme Durumu <span className="text-red-500">*</span>
                </label>
                <select
                  value={updateForm.paymentStatus}
                  onChange={(e) => setUpdateForm({ ...updateForm, paymentStatus: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="PENDING">Ödeme Bekleniyor</option>
                  <option value="PAID">Ödendi</option>
                  <option value="FAILED">Başarısız</option>
                  <option value="REFUNDED">İade Edildi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Kargo Takip Numarası
                </label>
                <input
                  type="text"
                  value={updateForm.trackingNumber}
                  onChange={(e) => setUpdateForm({ ...updateForm, trackingNumber: e.target.value })}
                  placeholder="Kargo takip numarasını girin"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Notlar
                </label>
                <textarea
                  rows={4}
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  placeholder="Sipariş ile ilgili notlar..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  disabled={updating}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateOrder}
                  disabled={updating}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {updating ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dekont Yükleme Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="border-b border-gray-200 px-8 py-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Dekont Yükle</h3>
                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                    setReceiptFile(null);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Dekont Dosyası
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Maksimum 5MB • JPEG, PNG veya PDF
                </p>
              </div>

              {receiptFile && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-green-900 font-medium">
                    ✓ {receiptFile.name}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {(receiptFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiptModal(false);
                    setReceiptFile(null);
                  }}
                  disabled={receiptLoading}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleUploadReceipt}
                  disabled={receiptLoading || !receiptFile}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {receiptLoading ? 'Yükleniyor...' : 'Yükle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ödeme Onay/Red Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="border-b border-gray-200 px-8 py-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  {approvalAction === 'APPROVE' ? 'Ödemeyi Onayla' : 'Ödemeyi Reddet'}
                </h3>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalAction(null);
                    setRejectionReason('');
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8">
              {approvalAction === 'APPROVE' ? (
                <div className="mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm text-green-900">
                      <span className="font-semibold">⚠️ Dikkat:</span> Ödemeyi onayladığınızda:
                    </p>
                    <ul className="text-xs text-green-800 mt-2 ml-4 list-disc space-y-1">
                      <li>Sipariş durumu "Hazırlanıyor" olarak güncellenecek</li>
                      <li>Ürün stokları düşecek</li>
                      <li>İşlem geri alınamaz</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Red Nedeni <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ödeme red nedenini açıklayın..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Bu bilgi müşteriye iletilecektir.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalAction(null);
                    setRejectionReason('');
                  }}
                  disabled={approvalLoading}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleApprovePayment}
                  disabled={approvalLoading}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 ${
                    approvalAction === 'APPROVE'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                  }`}
                >
                  {approvalLoading
                    ? 'İşleniyor...'
                    : approvalAction === 'APPROVE'
                    ? '✓ Onayla'
                    : '✗ Reddet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
