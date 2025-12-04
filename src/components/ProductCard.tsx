'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/contexts/WishlistContext';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  onSale: boolean;
  discount?: number;
  stock: number;
  stockTracking: boolean;
  allowBackorder: boolean;
  backorderMessage: string | null;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [showNotification, setShowNotification] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOfferWarning, setShowOfferWarning] = useState(false);
  const [activeOffer, setActiveOffer] = useState<any>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const mainImage = product.images[0] || '/placeholder-product.jpg';
  const hoverImage = product.images[1] || mainImage;
  const discountPercentage = product.discount || 
    (product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0);

  const isInWishlistAlready = isInWishlist(product.id);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInWishlistAlready) {
      // İstek listesinden çıkarma - kampanya kontrolü ile
      await handleRemoveFromWishlist();
    } else {
      const success = await addToWishlist({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        comparePrice: product.comparePrice,
        image: mainImage,
      });
      
      if (success) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 2000);
      } else {
        // Giriş yapılmamışsa modal göster
        setShowLoginModal(true);
      }
    }
  };

  const handleRemoveFromWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // İlk deneme - kampanya kontrolü
      const response = await fetch(`/api/wishlist?productId=${product.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.status === 409 && data.hasActiveOffer) {
        // Aktif kampanya var - uyarı göster
        setActiveOffer(data.offer);
        setShowOfferWarning(true);
      } else if (response.ok) {
        // Direkt silindi
        removeFromWishlist(product.id);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 2000);
      }
    } catch (error) {
      console.error('Wishlist remove error:', error);
    }
  };

  const handleConfirmRemoval = async () => {
    try {
      setIsRemoving(true);
      const token = localStorage.getItem('token');
      
      // Force removal - kampanyayı iptal et
      const response = await fetch(`/api/wishlist?productId=${product.id}&force=true`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        removeFromWishlist(product.id);
        setShowOfferWarning(false);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 2000);
      }
    } catch (error) {
      console.error('Force remove error:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const getOfferDescription = (offer: any) => {
    if (offer.offerType === 'PERCENTAGE') {
      return `%${offer.discountPercent} indirim`;
    } else if (offer.offerType === 'FIXED_AMOUNT') {
      return `${offer.discountAmount} ₺ indirim`;
    } else if (offer.offerType === 'BUY_X_GET_Y') {
      return `${offer.buyQuantity} Al ${offer.getQuantity} Bedava`;
    }
    return offer.description || 'Özel Kampanya';
  };

  // Stok durumunu belirle
  const getStockStatus = () => {
    if (!product.stockTracking) {
      return { available: true, label: 'Sipariş Alınır', showOverlay: false };
    }
    if (product.stock > 0) {
      return { available: true, label: 'Stokta Var', showOverlay: false };
    }
    if (product.stock === 0 && product.allowBackorder) {
      return { available: true, label: 'Ön Sipariş', showOverlay: false };
    }
    return { available: false, label: 'Stokta Yok', showOverlay: true };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      {/* Image Container */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={mainImage}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {hoverImage !== mainImage && (
          <Image
            src={hoverImage}
            alt={product.name}
            fill
            className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        )}

        {/* Badges */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1.5 sm:gap-2 z-10">
          {product.newArrival && (
            <span className="bg-blue-500 text-white text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-md shadow-lg">
              Yeni
            </span>
          )}
          {product.onSale && discountPercentage > 0 && (
            <span className="bg-red-500 text-white text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-md shadow-lg animate-pulse">
              -{discountPercentage}%
            </span>
          )}
          {product.bestseller && (
            <span className="bg-orange-500 text-white text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-md shadow-lg">
              ⭐ Çok Satan
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-1.5 sm:gap-2 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleWishlistToggle}
            className={`p-2 rounded-full shadow-md transition ${
              isInWishlistAlready 
                ? 'bg-red-500 text-white' 
                : 'bg-white hover:bg-orange-500 hover:text-white'
            }`}
            title={isInWishlistAlready ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
          >
            <svg 
              className="w-5 h-5" 
              fill={isInWishlistAlready ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button
            className="bg-white p-2 rounded-full shadow-md hover:bg-orange-500 hover:text-white transition"
            title="Hızlı Görünüm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>

        {/* Wishlist Notification */}
        {showNotification && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-xl z-20 animate-fade-in">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Favorilere eklendi!</span>
            </div>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {stockStatus.showOverlay && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-white text-gray-800 px-4 py-2 rounded font-semibold">
              {stockStatus.label}
            </span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-3 sm:p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm sm:text-base text-gray-800 font-medium mb-2 line-clamp-2 hover:text-orange-500 transition min-h-[40px]">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs sm:text-sm text-gray-500">(5)</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base sm:text-lg font-bold text-orange-500">
            ₺{product.price.toFixed(2)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs sm:text-sm text-gray-400 line-through">
              ₺{product.comparePrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Status Badge */}
        {!stockStatus.showOverlay && (
          <div className="mb-3">
            {!product.stockTracking ? (
              <span className="inline-block text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded">
                ✓ {stockStatus.label}
              </span>
            ) : product.stock === 0 && product.allowBackorder ? (
              <span className="inline-block text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded">
                🕒 {stockStatus.label}
              </span>
            ) : null}
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          disabled={!stockStatus.available}
          className={`w-full py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-300 ${
            !stockStatus.available
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-orange-500'
          }`}
        >
          {!product.stockTracking ? 'Sepete Ekle' : 
           product.stock === 0 && product.allowBackorder ? 'Ön Sipariş Ver' :
           !stockStatus.available ? 'Stokta Yok' : 'Sepete Ekle'}
        </button>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowLoginModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                İstek Listesi
              </h3>
              <p className="text-gray-600">
                İstek listesine ürün eklemek için giriş yapmalısınız
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors text-center"
                onClick={() => setShowLoginModal(false)}
              >
                Giriş Yap
              </Link>
              
              <Link
                href="/register"
                className="block w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border-2 border-gray-300 transition-colors text-center"
                onClick={() => setShowLoginModal(false)}
              >
                Kayıt Ol
              </Link>

              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
              >
                Daha Sonra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Warning Modal */}
      {showOfferWarning && activeOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => !isRemoving && setShowOfferWarning(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all" onClick={(e) => e.stopPropagation()}>
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              🎁 Özel Kampanya Uyarısı
            </h3>

            <p className="text-gray-600 text-center mb-4">
              Bu ürün için <strong className="text-purple-600">size özel bir kampanya</strong> tanımlı:
            </p>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-purple-700 text-center">
                {getOfferDescription(activeOffer)}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-700 text-center">
                Favorilerden çıkarırsanız <strong>kampanya iptal olacaktır!</strong>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowOfferWarning(false)}
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
    </div>
  );
}
