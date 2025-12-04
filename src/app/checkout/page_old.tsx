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
                        // Teslimat adresinin fatura adresi olarak kullanılabilirliğini kontrol et
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

        {/* Step 3: Payment - Placeholder for now */}
        {currentStep === 'payment' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ödeme Ekranı</h2>
            <p className="text-gray-600">Bu bölüm şu anda hazırlanıyor...</p>
            <button
              onClick={() => setCurrentStep('address-selection')}
              className="mt-6 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              ← Adres Seçimine Dön
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
