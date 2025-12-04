'use client';

import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, clearCart, getSubtotal, getDiscount, getTotal } = useCart();

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();
  const shipping = total >= 500 ? 0 : 29.99;
  const finalTotal = total + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Alışveriş Sepeti</h1>
          
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Sepetiniz Boş</h2>
            <p className="text-gray-600 mb-8">Alışverişe başlamak için ürünlerimize göz atın</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Alışverişe Başla
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Alışveriş Sepeti ({items.length} ürün)</h1>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Sepeti Temizle
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link href={`/products/${item.slug}`} className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 pr-4">
                        <Link 
                          href={`/products/${item.slug}`}
                          className="text-lg font-semibold text-gray-900 hover:text-orange-500 line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        
                        {/* Personal Offer Badge */}
                        {item.personalOfferId && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                              🎁 Size Özel Teklif
                            </span>
                            {item.offerType === 'PERCENTAGE_DISCOUNT' && (
                              <span className="text-sm text-purple-600 font-medium">
                                %{item.discountPercent} indirim
                              </span>
                            )}
                            {item.offerType === 'FIXED_DISCOUNT' && (
                              <span className="text-sm text-purple-600 font-medium">
                                ₺{Number(item.discountAmount).toFixed(2)} indirim
                              </span>
                            )}
                            {item.offerType === 'BUY_X_GET_Y' && (
                              <span className="text-sm text-purple-600 font-medium">
                                {item.buyQuantity} Al {item.getQuantity} Bedava
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition"
                        title="Sepetten Çıkar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Stock Warning */}
                    {item.stockTracking && item.stock < 5 && item.stock > 0 && (
                      <div className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded inline-block mb-2">
                        ⚠️ Son {item.stock} adet
                      </div>
                    )}

                    {/* Backorder Message */}
                    {item.allowBackorder && (!item.stockTracking || item.stock === 0) && (
                      <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg mb-2 flex items-start gap-2">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-semibold mb-1">Ön Sipariş Ürünü</p>
                          <p className="text-xs leading-relaxed">
                            {item.backorderMessage || 'Bu ürün siparişiniz alındıktan sonra özenle hazırlanacak ve size ulaştırılacaktır.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Quantity and Price */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Adet:</span>
                        <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="px-3 py-2 hover:bg-gray-100 transition"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.productId, Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 text-center font-semibold focus:outline-none"
                          />
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="px-3 py-2 hover:bg-gray-100 transition"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        {/* Özel teklif varsa indirimleri hesapla ve göster */}
                        {item.personalOfferId ? (
                          <>
                            <div className="text-2xl font-bold text-purple-600">
                              ₺{(item.price * item.quantity).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-400 line-through">
                              ₺{((item.originalPrice || item.price) * item.quantity).toFixed(2)}
                            </div>
                            <div className="text-xs text-green-600 font-semibold mt-1">
                              {item.offerType === 'PERCENTAGE_DISCOUNT' && item.discountPercent && (
                                `%${item.discountPercent} indirim - ₺${(((item.originalPrice || item.price) * (item.discountPercent / 100)) * item.quantity).toFixed(2)} tasarruf`
                              )}
                              {item.offerType === 'FIXED_DISCOUNT' && item.discountAmount && (
                                `₺${(item.discountAmount * item.quantity).toFixed(2)} indirim`
                              )}
                              {item.offerType === 'BUY_X_GET_Y' && item.buyQuantity && item.getQuantity && (
                                `${Math.floor(item.quantity / item.buyQuantity)} set - ${Math.floor(item.quantity / item.buyQuantity) * item.getQuantity} ürün bedava`
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-2xl font-bold text-orange-500">
                              ₺{(item.price * item.quantity).toFixed(2)}
                            </div>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <div className="text-sm text-gray-400 line-through">
                                ₺{(item.originalPrice * item.quantity).toFixed(2)}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Birim: ₺{item.price.toFixed(2)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Sipariş Özeti</h2>
              
              <div className="space-y-4 mb-6">
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
                  {shipping === 0 ? (
                    <span className="font-semibold text-green-600">Ücretsiz</span>
                  ) : (
                    <span className="font-semibold">₺{shipping.toFixed(2)}</span>
                  )}
                </div>

                {total < 500 && (
                  <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        <strong>₺{(500 - total).toFixed(2)}</strong> daha alışveriş yapın, <strong>kargo ücretsiz</strong> olsun!
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Toplam:</span>
                  <span className="text-3xl font-bold text-orange-500">₺{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition font-bold text-lg shadow-lg hover:shadow-xl mb-3"
              >
                Ödemeye Geç
              </button>

              <Link
                href="/products"
                className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Alışverişe Devam Et
              </Link>

              {/* Security Badges */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Güvenli Ödeme</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>Tüm Kartlara Taksit</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Hızlı Teslimat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
