'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';

interface CartSidebarProps {
  onClose: () => void;
}

export default function CartSidebar({ onClose }: CartSidebarProps) {
  const { items, removeFromCart, updateQuantity, getSubtotal, getDiscount, getTotal } = useCart();

  if (items.length === 0) {
    return (
      <>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium mb-2">Sepetiniz boş</p>
            <p className="text-gray-400 text-sm mb-6">Alışverişe başlamak için ürünlerimize göz atın</p>
            <Link 
              href="/products"
              className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
              onClick={onClose}
            >
              Alışverişe Başla
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="border-t p-4 sm:p-6 bg-gray-50">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Ara Toplam:</span>
              <span className="font-semibold">₺0.00</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Kargo:</span>
              <span className="text-green-600 font-medium">Ücretsiz</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Toplam:</span>
              <span className="font-bold text-2xl text-orange-500">₺0.00</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();
  const shipping = total >= 500 ? 0 : 29.99;
  const finalTotal = total + shipping;

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 border-b pb-4">
              <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link 
                  href={`/products/${item.slug}`} 
                  className="text-sm font-medium text-gray-900 hover:text-orange-500 line-clamp-2 mb-1"
                  onClick={onClose}
                >
                  {item.name}
                </Link>
                
                {/* Personal Offer Badge */}
                {item.personalOfferId && (
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                      🎁 Size Özel
                    </span>
                  </div>
                )}

                {/* Backorder Badge */}
                {item.allowBackorder && (!item.stockTracking || item.stock === 0) && (
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Ön Sipariş
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100 text-gray-600"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100 text-gray-600"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    {item.personalOfferId ? (
                      <>
                        <div className="text-sm font-bold text-purple-600">
                          ₺{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400 line-through">
                          ₺{((item.originalPrice || item.price) * item.quantity).toFixed(2)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-bold text-gray-900">
                          ₺{(item.price * item.quantity).toFixed(2)}
                        </div>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <div className="text-xs text-gray-400 line-through">
                            ₺{(item.originalPrice * item.quantity).toFixed(2)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeFromCart(item.productId)}
                className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t p-4 sm:p-6 bg-gray-50">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Ara Toplam:</span>
            <span className="font-semibold">₺{subtotal.toFixed(2)}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between items-center text-sm py-1 px-2 bg-purple-50 rounded -mx-1">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-purple-700 font-semibold">Kampanya İndirimi:</span>
              </div>
              <span className="font-bold text-purple-700">-₺{discount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Kargo:</span>
            {shipping === 0 ? (
              <span className="text-green-600 font-medium">Ücretsiz</span>
            ) : (
              <span className="font-semibold">₺{shipping.toFixed(2)}</span>
            )}
          </div>
          
          {total < 500 && (
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
              ₺{(500 - total).toFixed(2)} daha alışveriş yapın, kargo bedava!
            </div>
          )}
          
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Toplam:</span>
            <span className="font-bold text-2xl text-orange-500">₺{finalTotal.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <Link 
            href="/cart"
            className="block w-full bg-gray-800 text-white text-center py-3 sm:py-4 rounded-lg hover:bg-gray-700 transition font-medium"
            onClick={onClose}
          >
            Sepete Git
          </Link>
          <Link 
            href="/checkout"
            className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center py-3 sm:py-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition font-medium shadow-lg"
            onClick={onClose}
          >
            Ödeme Yap
          </Link>
        </div>
      </div>
    </>
  );
}
