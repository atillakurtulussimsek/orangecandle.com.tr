'use client';

import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

interface ActiveOffer {
  id: string;
  offerType: 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT' | 'BUY_X_GET_Y';
  discountPercent?: number;
  discountAmount?: number;
  buyQuantity?: number;
  getQuantity?: number;
  description?: string;
}

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { items: cartItems, removeFromCart } = useCart();
  const [showOfferWarning, setShowOfferWarning] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{ productId: string; productName: string } | null>(null);
  const [activeOffer, setActiveOffer] = useState<ActiveOffer | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveClick = async (productId: string, productName: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Giriş yapmanız gerekiyor');
        return;
      }

      // Önce ürünü çıkarmayı dene (force=false)
      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      // Eğer aktif kampanya varsa, uyarı göster
      if (response.status === 409 && data.hasActiveOffer) {
        setPendingRemoval({ productId, productName });
        setActiveOffer(data.offer);
        setShowOfferWarning(true);
        return;
      }

      // Kampanya yoksa veya hata varsa normal akış
      if (response.ok) {
        removeFromWishlist(productId);
      } else {
        alert(data.error || 'Ürün çıkarılırken hata oluştu');
      }
    } catch (error) {
      console.error('Remove error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleConfirmRemoval = async () => {
    if (!pendingRemoval) return;

    setIsRemoving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Force parametresi ile tekrar dene
      const response = await fetch(`/api/wishlist?productId=${pendingRemoval.productId}&force=true`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // İstek listesinden kaldır
        removeFromWishlist(pendingRemoval.productId);

        // Eğer kampanya iptal edildiyse ve ürün sepette varsa, sepetten de çıkar
        if (data.offerCancelled) {
          const cartItem = cartItems.find(item => item.productId === pendingRemoval.productId);
          if (cartItem && cartItem.personalOfferId) {
            removeFromCart(pendingRemoval.productId);
          }
        }

        // Dialog'u kapat
        setShowOfferWarning(false);
        setPendingRemoval(null);
        setActiveOffer(null);
      } else {
        alert(data.error || 'Ürün çıkarılırken hata oluştu');
      }
    } catch (error) {
      console.error('Confirm removal error:', error);
      alert('Bir hata oluştu');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCancelRemoval = () => {
    setShowOfferWarning(false);
    setPendingRemoval(null);
    setActiveOffer(null);
  };

  const getOfferDescription = (offer: ActiveOffer) => {
    if (offer.offerType === 'PERCENTAGE_DISCOUNT') {
      return `%${offer.discountPercent} indirim`;
    } else if (offer.offerType === 'FIXED_DISCOUNT') {
      return `₺${Number(offer.discountAmount).toFixed(2)} indirim`;
    } else if (offer.offerType === 'BUY_X_GET_Y') {
      return `${offer.buyQuantity} Al ${offer.getQuantity} Bedava`;
    }
    return 'Özel kampanya';
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            İstek Listeniz Boş
          </h1>
          <p className="text-gray-600 mb-8">
            Beğendiğiniz ürünleri favorilere ekleyerek daha sonra kolayca ulaşabilirsiniz.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-lg hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Ürünleri Keşfet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
      {/* Offer Warning Dialog */}
      {showOfferWarning && pendingRemoval && activeOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            {/* Icon */}
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Özel Kampanya İptal Olacak
            </h3>

            {/* Description */}
            <div className="text-center mb-4">
              <p className="text-gray-700 mb-3">
                <strong>{pendingRemoval.productName}</strong> ürünü için
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                <p className="text-purple-700 font-semibold text-lg">
                  {getOfferDescription(activeOffer)}
                </p>
                {activeOffer.description && (
                  <p className="text-sm text-purple-600 mt-1">
                    {activeOffer.description}
                  </p>
                )}
              </div>
              <p className="text-gray-600 text-sm">
                kampanyası aktif. Ürünü favorilerden çıkarırsanız bu kampanya <strong>iptal olacaktır</strong>.
              </p>
            </div>

            {/* Cart Warning */}
            {cartItems.some(item => item.productId === pendingRemoval.productId && item.personalOfferId) && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-orange-700">
                    Bu ürün sepetinizde de var. Kampanya iptal edilirse sepetinizdeki ürün de <strong>otomatik olarak çıkarılacaktır</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelRemoval}
                disabled={isRemoving}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmRemoval}
                disabled={isRemoving}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRemoving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    İşleniyor...
                  </>
                ) : (
                  'Yine de Çıkar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Favorilerim
          </h1>
          <p className="text-gray-600">
            {items.length} ürün listenizde
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Tüm favori ürünlerinizi silmek istediğinize emin misiniz?')) {
                clearWishlist();
              }
            }}
            className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Tümünü Temizle
          </button>
        )}
      </div>

      {/* Wishlist Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300"
          >
            {/* Image */}
            <Link href={`/products/${item.slug}`} className="block relative aspect-square overflow-hidden bg-gray-100">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Campaign Badge */}
            {item.hasActiveOffer && item.activeOffer && (
              <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1.5 rounded-lg shadow-md z-10 flex items-center gap-1.5">
                <span className="text-sm">🎁</span>
                <span className="text-xs font-semibold">Size Özel Kampanya</span>
              </div>
            )}

            {/* Remove Button */}
            <button
              onClick={() => handleRemoveClick(item.id, item.name)}
              className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-500 hover:text-white transition z-10"
              title="Favorilerden Çıkar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Product Info */}
            <div className="p-4">
              <Link href={`/products/${item.slug}`}>
                <h3 className="text-base font-medium text-gray-800 mb-2 line-clamp-2 hover:text-orange-500 transition min-h-[48px]">
                  {item.name}
                </h3>
              </Link>

              {/* Campaign Info */}
              {item.hasActiveOffer && item.activeOffer && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mb-2">
                  <p className="text-xs text-purple-700 font-medium">
                    {getOfferDescription(item.activeOffer)}
                  </p>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl font-bold text-orange-500">
                  {item.price.toFixed(2)} ₺
                </span>
                {item.comparePrice && (
                  <>
                    <span className="text-sm text-gray-400 line-through">
                      {item.comparePrice.toFixed(2)} ₺
                    </span>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-semibold">
                      -{Math.round(((item.comparePrice - item.price) / item.comparePrice) * 100)}%
                    </span>
                  </>
                )}
              </div>

              {/* Added Date */}
              <p className="text-xs text-gray-500 mb-3">
                {new Date(item.addedAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })} tarihinde eklendi
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Link
                  href={`/products/${item.slug}`}
                  className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition text-center text-sm font-medium"
                >
                  İncele
                </Link>
                <button
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                  title="Sepete Ekle"
                >
                  Sepete Ekle
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Continue Shopping */}
      <div className="mt-12 text-center">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Alışverişe Devam Et
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {items.length}
          </div>
          <div className="text-sm text-gray-700">Favori Ürün</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {items.reduce((sum, item) => sum + item.price, 0).toFixed(2)} ₺
          </div>
          <div className="text-sm text-gray-700">Toplam Değer</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {items.filter(item => item.comparePrice).reduce((sum, item) => 
              sum + (item.comparePrice ? item.comparePrice - item.price : 0), 0
            ).toFixed(2)} ₺
          </div>
          <div className="text-sm text-gray-700">Toplam İndirim</div>
        </div>
      </div>
    </div>
  );
}
