'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import Link from 'next/link';

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
  isBillingAddress: boolean;
  companyName?: string | null;
  taxNumber?: string | null;
  taxOffice?: string | null;
}

type CheckoutStep = 'cart-review' | 'address-selection' | 'payment';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, getDiscount, getTotal, clearCart, removeFromCart, updateQuantity } = useCart();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart-review');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState('');
  const [selectedBillingId, setSelectedBillingId] = useState('');
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'credit-card' | 'bank-transfer'>('credit-card');
  const [processingPayment, setProcessingPayment] = useState(false);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();
  const shipping = total >= 500 ? 0 : 29.99;
  const finalTotal = total + shipping;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      router.push('/login?redirect=/checkout');
      return;
    }

    try {
      const userData = JSON.parse(user);
      setUserId(userData.id);
      fetchAddresses(userData.id, token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login?redirect=/checkout');
    }
  }, [router]);

  const fetchAddresses = async (userId: string, token: string) => {
    try {
      const res = await fetch(`/api/addresses?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
        const defaultAddress = data.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedShippingId(defaultAddress.id);
          setSelectedBillingId(defaultAddress.id);
        } else if (data.length > 0) {
          setSelectedShippingId(data[0].id);
          setSelectedBillingId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToAddress = () => {
    if (items.length === 0) {
      alert('Sepetiniz boş!');
      return;
    }
    setCurrentStep('address-selection');
  };

  const handleProceedToPayment = () => {
    if (!selectedShippingId) {
      alert('Lütfen teslimat adresi seçin!');
      return;
    }
    if (!useSameAddress && !selectedBillingId) {
      alert('Lütfen fatura adresi seçin!');
      return;
    }
    setCurrentStep('payment');
  };



  const handleProcessPayment = async () => {

    setProcessingPayment(true);

    try {
      // Log checkout attempt
      await fetch('/api/activity/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECKOUT_ATTEMPT',
          details: `Ödeme işlemi başlatıldı - ${paymentMethod === 'credit-card' ? 'Kredi Kartı' : 'Havale/EFT'}`,
          metadata: {
            paymentMethod,
            itemCount: items.length,
            total: finalTotal
          }
        })
      }).catch(() => {});

      const token = localStorage.getItem('token');
      const shippingAddress = addresses.find(a => a.id === selectedShippingId);
      const billingAddress = addresses.find(a => a.id === (useSameAddress ? selectedShippingId : selectedBillingId));

      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          personalOfferId: item.personalOfferId,
        })),
        shippingAddress: {
          fullName: shippingAddress?.fullName,
          phone: shippingAddress?.phone,
          address: shippingAddress?.address,
          city: shippingAddress?.city,
          district: shippingAddress?.district,
          zipCode: shippingAddress?.zipCode,
        },
        billingAddress: {
          fullName: billingAddress?.fullName,
          phone: billingAddress?.phone,
          address: billingAddress?.address,
          city: billingAddress?.city,
          district: billingAddress?.district,
          zipCode: billingAddress?.zipCode,
          companyName: billingAddress?.companyName,
          taxNumber: billingAddress?.taxNumber,
          taxOffice: billingAddress?.taxOffice,
        },
        paymentMethod,
        notes,
        subtotal,
        shipping,
        total: finalTotal,
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      console.log('Order creation response:', data);

      if (res.ok && data.success) {
        if (data.redirectUrl) {
          console.log('Redirecting to Parampos:', data.redirectUrl);
          // Sepeti temizle
          clearCart();
          // Processing state'i açık tut (sayfa zaten değişecek)
          // Parampos 3D Secure sayfasına yönlendir
          window.location.href = data.redirectUrl;
        } else {
          // Başarılı ödeme (havale/EFT)
          console.log('No redirect URL, going to success page');
          clearCart();
          setProcessingPayment(false);
          router.push(`/order/${data.orderNumber}?success=true`);
        }
      } else {
        // Log failed checkout
        await fetch('/api/activity/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CHECKOUT_FAILED',
            details: `Ödeme başarısız: ${data.message}`,
            metadata: { error: data.message }
          })
        }).catch(() => {});
        
        console.error('Checkout error:', data);
        alert(data.error || data.message || 'Sipariş oluşturulamadı!');
        if (data.details) {
          console.error('Error details:', data.details);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Error details:', error);
      
      // Log error
      await fetch('/api/activity/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECKOUT_FAILED',
          details: `Ödeme hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
          metadata: { error: String(error) }
        })
      }).catch(() => {});
      
      alert('Bir hata oluştu! Lütfen tekrar deneyin.');
    } finally {
      // Sadece redirect olmadıysa processing'i kapat
      // (redirect durumunda sayfa zaten değişiyor)
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[
              { id: 'cart-review', label: 'Sepet Özeti', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
              { id: 'address-selection', label: 'Adres Seçimi', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
              { id: 'payment', label: 'Ödeme', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
            ].map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    currentStep === step.id ? 'bg-orange-500 text-white' :
                    ['cart-review', 'address-selection'].includes(currentStep) && index < ['cart-review', 'address-selection', 'payment'].indexOf(currentStep) ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                    </svg>
                  </div>
                  <span className="text-xs font-medium mt-2 text-center">{step.label}</span>
                </div>
                {index < 2 && (
                  <div className={`w-24 h-1 mx-2 ${
                    ['address-selection', 'payment'].includes(currentStep) && index < 1 ? 'bg-green-500' :
                    currentStep === 'payment' && index === 1 ? 'bg-green-500' :
                    'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Cart Review */}
        {currentStep === 'cart-review' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Sepet Özeti</h2>
                
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-600 mb-4">Sepetiniz boş</p>
                    <Link href="/products" className="text-orange-500 hover:text-orange-600 font-semibold">
                      Alışverişe Devam Et
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.productId} className="flex gap-4 border-b pb-4">
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center border rounded">
                              <button
                                onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                                className="px-3 py-1 hover:bg-gray-100"
                              >
                                -
                              </button>
                              <span className="px-3 py-1 border-x">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="px-3 py-1 hover:bg-gray-100"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-red-500 hover:text-red-600 text-sm"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          {item.personalOfferId && item.originalPrice && (
                            <div className="text-sm text-gray-400 line-through">
                              ₺{(item.originalPrice * item.quantity).toFixed(2)}
                            </div>
                          )}
                          <div className="text-lg font-bold text-gray-900">
                            ₺{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sipariş Özeti</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Ara Toplam:</span>
                    <span>₺{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Kampanya İndirimi:</span>
                      <span>-₺{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Kargo:</span>
                    <span>{shipping === 0 ? 'Ücretsiz' : `₺${shipping.toFixed(2)}`}</span>
                  </div>
                  {shipping === 0 && (
                    <p className="text-xs text-green-600">🎉 500 TL ve üzeri siparişlerde kargo bedava!</p>
                  )}
                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                    <span>Toplam:</span>
                    <span>₺{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleProceedToAddress}
                  disabled={items.length === 0}
                  className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adres Seçimine Geç
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Address Selection */}
        {currentStep === 'address-selection' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Teslimat Adresi
                    <span className="text-red-500 text-sm">*</span>
                  </h2>
                  <Link
                    href="/account?tab=addresses"
                    target="_blank"
                    className="text-sm text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Yeni Adres Ekle
                  </Link>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <p className="text-gray-600 mb-4">Kayıtlı adresiniz bulunmuyor</p>
                    <Link
                      href="/account?tab=addresses"
                      target="_blank"
                      className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
                    >
                      İlk Adresinizi Ekleyin
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                          selectedShippingId === address.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingAddress"
                          value={address.id}
                          checked={selectedShippingId === address.id}
                          onChange={(e) => {
                            setSelectedShippingId(e.target.value);
                            if (useSameAddress) {
                              setSelectedBillingId(e.target.value);
                            }
                          }}
                          className="sr-only"
                        />
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                            selectedShippingId === address.id
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedShippingId === address.id && (
                              <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900">{address.title}</span>
                              {address.isDefault && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Varsayılan</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mb-1">{address.fullName}</p>
                            <p className="text-sm text-gray-600 mb-1">{address.phone}</p>
                            <p className="text-sm text-gray-600">{address.address}</p>
                            <p className="text-sm text-gray-600">{address.district} / {address.city} {address.zipCode}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Billing Address */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Fatura Adresi
                </h2>

                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSameAddress}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      
                      if (checked) {
                        const shippingAddress = addresses.find(a => a.id === selectedShippingId);
                        
                        if (!shippingAddress) {
                          alert('Lütfen önce teslimat adresi seçin');
                          return;
                        }
                        
                        if (!shippingAddress.isBillingAddress) {
                          alert('Seçili teslimat adresi fatura adresi olarak işaretlenmemiş. Lütfen fatura bilgilerini içeren bir adres seçin veya ayrı bir fatura adresi belirleyin.');
                          return;
                        }
                        
                        if (!shippingAddress.companyName || !shippingAddress.taxNumber || !shippingAddress.taxOffice) {
                          alert('Seçili adresin fatura bilgileri eksik (Unvan, Vergi No, Vergi Dairesi). Lütfen fatura bilgilerini tamamlayın veya başka bir adres seçin.');
                          return;
                        }
                        
                        setSelectedBillingId(selectedShippingId);
                      }
                      
                      setUseSameAddress(checked);
                    }}
                    className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-gray-700 font-medium">Teslimat adresi ile aynı</span>
                </label>

                {useSameAddress && selectedShippingId && (
                  <div className="mt-4 mb-4">
                    {(() => {
                      const selectedAddress = addresses.find(a => a.id === selectedShippingId);
                      
                      if (!selectedAddress) {
                        return null;
                      }
                      
                      const hasBillingInfo = selectedAddress.isBillingAddress && 
                                           selectedAddress.companyName && 
                                           selectedAddress.taxNumber && 
                                           selectedAddress.taxOffice;
                      
                      if (hasBillingInfo) {
                        return (
                          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="flex-1">
                                <p className="font-semibold text-green-800 mb-2">Fatura Bilgileri Mevcut</p>
                                <div className="text-sm text-green-700 space-y-1">
                                  <p><strong>Unvan:</strong> {selectedAddress.companyName}</p>
                                  <p><strong>Vergi No:</strong> {selectedAddress.taxNumber}</p>
                                  <p><strong>Vergi Dairesi:</strong> {selectedAddress.taxOffice}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <div className="flex-1">
                                <p className="font-semibold text-yellow-800 mb-2">⚠️ Fatura Bilgileri Eksik</p>
                                <p className="text-sm text-yellow-700 mb-3">
                                  Seçili teslimat adresinde fatura bilgileri bulunmuyor. Fatura almak için adresinize fatura bilgilerini eklemeniz gerekiyor.
                                </p>
                                {!selectedAddress.isBillingAddress && (
                                  <p className="text-sm text-yellow-700 mb-2">• Adres fatura adresi olarak işaretlenmemiş</p>
                                )}
                                {!selectedAddress.companyName && (
                                  <p className="text-sm text-yellow-700 mb-2">• Unvan bilgisi eksik</p>
                                )}
                                {!selectedAddress.taxNumber && (
                                  <p className="text-sm text-yellow-700 mb-2">• Vergi numarası eksik</p>
                                )}
                                {!selectedAddress.taxOffice && (
                                  <p className="text-sm text-yellow-700 mb-2">• Vergi dairesi eksik</p>
                                )}
                                <Link
                                  href="/account?tab=addresses"
                                  target="_blank"
                                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm font-semibold"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Adresi Düzenle
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}

                {!useSameAddress && addresses.length > 0 && (
                  <div className="space-y-4">
                    {addresses.filter(a => a.isBillingAddress && a.companyName && a.taxNumber && a.taxOffice).length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-600 mb-2 font-semibold">Fatura bilgisi içeren adresiniz bulunmuyor</p>
                        <p className="text-sm text-gray-500 mb-4">Adreslerinize fatura bilgisi (Unvan, Vergi No, Vergi Dairesi) ekleyerek fatura adresi olarak kullanabilirsiniz.</p>
                        <Link
                          href="/account?tab=addresses"
                          target="_blank"
                          className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
                        >
                          Adreslerime Git
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.filter(a => a.isBillingAddress && a.companyName && a.taxNumber && a.taxOffice).map((address) => (
                          <label
                            key={address.id}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                              selectedBillingId === address.id
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="billingAddress"
                              value={address.id}
                              checked={selectedBillingId === address.id}
                              onChange={(e) => setSelectedBillingId(e.target.value)}
                              className="sr-only"
                            />
                            <div className="flex items-start gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                                selectedBillingId === address.id
                                  ? 'border-orange-500 bg-orange-500'
                                  : 'border-gray-300'
                              }`}>
                                {selectedBillingId === address.id && (
                                  <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-gray-900">{address.title}</span>
                                  {address.isDefault && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Varsayılan</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 mb-1">{address.fullName}</p>
                                <p className="text-sm text-gray-600 mb-1">{address.phone}</p>
                                <p className="text-sm text-gray-600">{address.address}</p>
                                <p className="text-sm text-gray-600 mb-2">{address.district} / {address.city} {address.zipCode}</p>
                                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
                                  <p><strong>Unvan:</strong> {address.companyName}</p>
                                  <p><strong>Vergi No:</strong> {address.taxNumber}</p>
                                  <p><strong>Vergi Dairesi:</strong> {address.taxOffice}</p>
                                </div>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Order Notes */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Sipariş Notu (Opsiyonel)</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Siparişiniz hakkında eklemek istediğiniz notlar..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Order Summary - Sticky */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sipariş Özeti</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Ara Toplam:</span>
                    <span>₺{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Kampanya İndirimi:</span>
                      <span>-₺{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Kargo:</span>
                    <span>{shipping === 0 ? 'Ücretsiz' : `₺${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                    <span>Toplam:</span>
                    <span>₺{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setCurrentStep('cart-review')}
                    className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    ← Sepete Dön
                  </button>
                  <button
                    onClick={handleProceedToPayment}
                    disabled={!selectedShippingId || (!useSameAddress && !selectedBillingId)}
                    className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Ödemeye Geç →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {currentStep === 'payment' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Method Selection */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Ödeme Yöntemi
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <label className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                    paymentMethod === 'credit-card' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit-card"
                      checked={paymentMethod === 'credit-card'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'credit-card')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                        paymentMethod === 'credit-card' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'credit-card' && (
                          <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Kredi / Banka Kartı</p>
                        <p className="text-sm text-gray-600">Güvenli ödeme ile</p>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-8 h-6 bg-gradient-to-br from-blue-600 to-blue-400 rounded"></div>
                        <div className="w-8 h-6 bg-gradient-to-br from-red-600 to-orange-400 rounded"></div>
                      </div>
                    </div>
                  </label>

                  <label className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                    paymentMethod === 'bank-transfer' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank-transfer"
                      checked={paymentMethod === 'bank-transfer'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'bank-transfer')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                        paymentMethod === 'bank-transfer' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'bank-transfer' && (
                          <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Banka Havalesi / EFT</p>
                        <p className="text-sm text-gray-600">Havale bilgileri gönderilecek</p>
                      </div>
                    </div>
                  </label>
                </div>

                {paymentMethod === 'credit-card' && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mt-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">🔒 Güvenli Ödeme</h3>
                        <p className="text-sm text-gray-700 mb-3">
                          "Ödemeyi Tamamla" butonuna tıkladığınızda <strong>bankanızın güvenli 3D Secure sayfasına</strong> yönlendirileceksiniz.
                        </p>
                        <div className="bg-white rounded-lg p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-xs text-gray-700">Kart bilgileriniz <strong>hiçbir zaman sitemizde saklanmaz</strong></p>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-xs text-gray-700">Ödeme işlemi <strong>256-bit SSL</strong> ile şifrelenir</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-xs text-gray-700"><strong>PCI DSS</strong> uyumlu güvenli ödeme</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank-transfer' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Not:</strong> Sipariş onaylandıktan sonra banka hesap bilgilerimiz e-posta ile gönderilecektir. 
                      Ödeme yaptıktan sonra dekont/makbuzu bize iletmeniz gerekmektedir.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary - Sticky */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sipariş Özeti</h3>
                
                <div className="space-y-3 mb-4 pb-4 border-b">
                  <p className="text-sm text-gray-600">
                    <strong>{items.length}</strong> ürün
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Ara Toplam:</span>
                    <span>₺{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Kampanya İndirimi:</span>
                      <span>-₺{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Kargo:</span>
                    <span>{shipping === 0 ? 'Ücretsiz' : `₺${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-900">
                    <span>Ödenecek Tutar:</span>
                    <span className="text-orange-600">₺{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setCurrentStep('address-selection')}
                    disabled={processingPayment}
                    className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    ← Adres Seçimine Dön
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    disabled={processingPayment}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingPayment ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        İşleniyor...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Ödemeyi Tamamla
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  "Ödemeyi Tamamla" butonuna tıklayarak <Link href="/terms" className="text-orange-600 hover:underline">kullanım koşullarını</Link> kabul etmiş olursunuz.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
