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
}

type CheckoutStep = 'cart-review' | 'address-selection' | 'payment';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, getDiscount, getTotal, clearCart } = useCart();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart-review');
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState('');
  const [selectedBillingId, setSelectedBillingId] = useState('');
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Card info states
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();
  const shipping = total >= 500 ? 0 : 29.99;
  const finalTotal = total + shipping;

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      router.push('/login?redirect=/checkout');
      return;
    }

    try {
      const userData = JSON.parse(user);
      setUserId(userData.id);
      setIsLoggedIn(true);
      fetchAddresses(userData.id, token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login?redirect=/checkout');
    }
  }, [router]);

  useEffect(() => {
    if (items.length === 0 && !loading) {
      router.push('/cart');
    }
  }, [items, loading, router]);

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

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddressId) {
      alert('Lütfen teslimat adresi seçin');
      return;
    }

    if (!useSameAddress && !billingAddressId) {
      alert('Lütfen fatura adresi seçin');
      return;
    }

    setProcessing(true);

    try {
      const token = localStorage.getItem('token');
      
      // Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            personalOfferId: item.personalOfferId,
          })),
          shippingAddressId: selectedAddressId,
          billingAddressId: useSameAddress ? selectedAddressId : billingAddressId,
          subtotal,
          discount,
          shipping,
          total: finalTotal,
          notes,
        }),
      });

      if (!orderRes.ok) {
        const error = await orderRes.json();
        throw new Error(error.error || 'Sipariş oluşturulamadı');
      }

      const order = await orderRes.json();

      // Process payment with ParamPOS
      const paymentRes = await fetch('/api/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: finalTotal,
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardName,
          expiryMonth,
          expiryYear,
          cvv,
        }),
      });

      if (!paymentRes.ok) {
        const error = await paymentRes.json();
        throw new Error(error.error || 'Ödeme işlemi başarısız');
      }

      const paymentResult = await paymentRes.json();

      if (paymentResult.success) {
        clearCart();
        router.push(`/orders/${order.id}?payment=success`);
      } else {
        throw new Error(paymentResult.message || 'Ödeme işlemi başarısız');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Bir hata oluştu');
    } finally {
      setProcessing(false);
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
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/cart" className="hover:text-orange-500">Sepet</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-orange-500 font-medium">Ödeme</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Ödeme</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Teslimat Adresi
                </h2>

                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Kayıtlı adresiniz bulunmuyor</p>
                    <Link
                      href="/account/addresses"
                      className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
                    >
                      Adres Ekle
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                          selectedAddressId === address.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingAddress"
                          value={address.id}
                          checked={selectedAddressId === address.id}
                          onChange={(e) => setSelectedAddressId(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-start gap-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                            selectedAddressId === address.id
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedAddressId === address.id && (
                              <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 mb-1">{address.title}</div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>{address.fullName}</p>
                              <p>{address.phone}</p>
                              <p>{address.address}</p>
                              <p>{address.district} / {address.city} {address.zipCode}</p>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Billing Address */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="useSameAddress"
                    checked={useSameAddress}
                    onChange={(e) => setUseSameAddress(e.target.checked)}
                    className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="useSameAddress" className="text-gray-700 font-medium cursor-pointer">
                    Fatura adresi teslimat adresi ile aynı
                  </label>
                </div>

                {!useSameAddress && addresses.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                          billingAddressId === address.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="billingAddress"
                          value={address.id}
                          checked={billingAddressId === address.id}
                          onChange={(e) => setBillingAddressId(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-start gap-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                            billingAddressId === address.id
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-300'
                          }`}>
                            {billingAddressId === address.id && (
                              <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 mb-1">{address.title}</div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>{address.fullName}</p>
                              <p>{address.address}</p>
                              <p>{address.district} / {address.city}</p>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Kart Bilgileri
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kart Numarası <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => formatCardNumber(e.target.value)}
                      maxLength={19}
                      placeholder="1234 5678 9012 3456"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kart Üzerindeki İsim <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      placeholder="AD SOYAD"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ay <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={expiryMonth}
                        onChange={(e) => setExpiryMonth(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Ay</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = (i + 1).toString().padStart(2, '0');
                          return <option key={month} value={month}>{month}</option>;
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Yıl <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={expiryYear}
                        onChange={(e) => setExpiryYear(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Yıl</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = (new Date().getFullYear() + i).toString().slice(-2);
                          return <option key={year} value={year}>{year}</option>;
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        maxLength={3}
                        placeholder="123"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Sipariş Notu (Opsiyonel)</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Siparişiniz hakkında not eklemek isterseniz buraya yazabilirsiniz..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Sipariş Özeti</h2>

                {/* Cart Items */}
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                        {item.allowBackorder && (!item.stockTracking || item.stock === 0) && (
                          <div className="flex items-center gap-1 mt-1">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs text-blue-600 font-medium">Ön Sipariş</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">{item.quantity}x</span>
                          <span className="text-sm font-semibold text-gray-900">₺{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Ara Toplam:</span>
                    <span className="font-semibold">₺{subtotal.toFixed(2)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between items-center py-2 px-3 bg-purple-50 rounded-lg -mx-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="font-semibold text-purple-700">Özel Kampanya İndirimi:</span>
                      </div>
                      <span className="font-bold text-purple-700">-₺{discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>Kargo:</span>
                    <span className="font-semibold">{shipping === 0 ? 'Ücretsiz' : `₺${shipping.toFixed(2)}`}</span>
                  </div>

                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Toplam:</span>
                    <span className="text-2xl font-bold text-orange-500">₺{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={processing || addresses.length === 0}
                  className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition font-bold text-lg shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      İşleniyor...
                    </span>
                  ) : (
                    `₺${finalTotal.toFixed(2)} Öde`
                  )}
                </button>

                {/* Security Info */}
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>256-bit SSL Güvenli Ödeme</span>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Kart bilgileriniz güvenli bir şekilde şifrelenir
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
