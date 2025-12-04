'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  reviewCount: number;
  averageRating: number;
  description: string;
  images: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  stock: number;
  stockTracking: boolean;
  allowBackorder: boolean;
  backorderMessage: string | null;
  lowStockThreshold: number;
  weight: string | null;
  dimensions: string | null;
  burnTime: string | null;
  scent: string | null;
  material: string | null;
  tags: string[];
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  onSale: boolean;
}

type StockStatus = {
  available: boolean;
  type: 'unlimited' | 'in-stock' | 'low-stock' | 'backorder' | 'out-of-stock';
  message: string;
  badge: string;
  color: 'green' | 'yellow' | 'blue' | 'red';
  icon: 'check' | 'warning' | 'clock' | 'x';
};

interface PersonalOffer {
  id: string;
  offerType: 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT' | 'BUY_X_GET_Y';
  discountPercent: number | null;
  discountAmount: number | null;
  buyQuantity: number | null;
  getQuantity: number | null;
  description: string;
  validFrom: string;
  validUntil: string;
  maxUsage: number | null;
  usedCount: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [personalOffer, setPersonalOffer] = useState<PersonalOffer | null>(null);
  const [loadingOffer, setLoadingOffer] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Ürün bulunamadı');
          } else {
            setError('Ürün yüklenirken bir hata oluştu');
          }
          return;
        }

        const data = await response.json();
        setProduct(data);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError('Ürün yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  // Fetch personal offers when product is loaded
  useEffect(() => {
    const fetchPersonalOffer = async () => {
      if (!product) return;

      const token = localStorage.getItem('token');
      if (!token) return; // User not logged in

      try {
        setLoadingOffer(true);
        const response = await fetch(`/api/personal-offers/my-offers?productId=${product.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const offers = await response.json();
          if (offers.length > 0) {
            setPersonalOffer(offers[0]); // Take the first active offer
          }
        }
      } catch (err) {
        console.error('Failed to fetch personal offer:', err);
      } finally {
        setLoadingOffer(false);
      }
    };

    fetchPersonalOffer();
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;

    let finalPrice = product.price;
    const originalPrice = product.comparePrice || product.price;

    const cartItem: any = {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: finalPrice,
      originalPrice: originalPrice,
      image: product.images[0],
      stock: product.stock,
      stockTracking: product.stockTracking,
      allowBackorder: product.allowBackorder,
      backorderMessage: product.backorderMessage,
    };

    // Apply personal offer if exists
    if (personalOffer) {
      cartItem.personalOfferId = personalOffer.id;
      cartItem.offerType = personalOffer.offerType;

      if (personalOffer.offerType === 'PERCENTAGE_DISCOUNT' && personalOffer.discountPercent) {
        finalPrice = product.price * (1 - personalOffer.discountPercent / 100);
        cartItem.price = finalPrice;
        cartItem.discountPercent = personalOffer.discountPercent;
        cartItem.originalPrice = product.price; // Set original price before discount
      } else if (personalOffer.offerType === 'FIXED_DISCOUNT' && personalOffer.discountAmount) {
        finalPrice = Math.max(0, product.price - personalOffer.discountAmount);
        cartItem.price = finalPrice;
        cartItem.discountAmount = personalOffer.discountAmount;
        cartItem.originalPrice = product.price; // Set original price before discount
      } else if (personalOffer.offerType === 'BUY_X_GET_Y') {
        cartItem.buyQuantity = personalOffer.buyQuantity;
        cartItem.getQuantity = personalOffer.getQuantity;
        cartItem.originalPrice = product.price;
      }
    }

    if (product.comparePrice) {
      cartItem.comparePrice = product.comparePrice;
    }

    addToCart(cartItem, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    setQuantity(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Ürün yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Ürün Bulunamadı'}
          </h1>
          <p className="text-gray-600 mb-8">
            Aradığınız ürün bulunamadı veya artık mevcut değil.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Ürünlere Dön
          </Link>
        </div>
      </div>
    );
  }

  const badges: string[] = [];
  if (product.newArrival) badges.push('Yeni');
  if (product.bestseller) badges.push('Çok Satan');
  if (product.onSale && product.comparePrice) badges.push('İndirim');

  const getStockStatus = (): StockStatus => {
    if (!product.stockTracking) {
      return {
        available: true,
        type: 'unlimited',
        message: 'Sipariş alınabilir - İstediğiniz kadar sipariş verebilirsiniz',
        badge: 'Sipariş Alınır',
        color: 'green',
        icon: 'check'
      };
    }

    if (product.stock > product.lowStockThreshold) {
      return {
        available: true,
        type: 'in-stock',
        message: `Stokta ${product.stock} adet mevcut`,
        badge: 'Stokta Var',
        color: 'green',
        icon: 'check'
      };
    }

    if (product.stock > 0 && product.stock <= product.lowStockThreshold) {
      return {
        available: true,
        type: 'low-stock',
        message: `Son ${product.stock} adet! Hemen sipariş verin`,
        badge: `Son ${product.stock} Adet`,
        color: 'yellow',
        icon: 'warning'
      };
    }

    if (product.stock === 0 && product.allowBackorder) {
      return {
        available: true,
        type: 'backorder',
        message: product.backorderMessage || 'Ön sipariş alınıyor - Sipariş üzerine üretilir',
        badge: 'Ön Sipariş',
        color: 'blue',
        icon: 'clock'
      };
    }

    return {
      available: false,
      type: 'out-of-stock',
      message: 'Maalesef bu ürün şu anda stokta yok',
      badge: 'Stokta Yok',
      color: 'red',
      icon: 'x'
    };
  };

  const stockStatus = getStockStatus();

  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      badge: 'bg-green-500 text-white',
      icon: 'text-green-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      badge: 'bg-yellow-500 text-white',
      icon: 'text-yellow-600'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      badge: 'bg-blue-500 text-white',
      icon: 'text-blue-600'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      badge: 'bg-red-500 text-white',
      icon: 'text-red-600'
    }
  };

  const colors = colorClasses[stockStatus.color];

  const renderStockIcon = () => {
    switch (stockStatus.icon) {
      case 'check':
        return (
          <svg className={`w-6 h-6 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`w-6 h-6 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'clock':
        return (
          <svg className={`w-6 h-6 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'x':
        return (
          <svg className={`w-6 h-6 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-orange-500 transition">Ana Sayfa</Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/products" className="text-gray-600 hover:text-orange-500 transition">Ürünler</Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href={`/products?categoryId=${product.category.id}`} className="text-gray-600 hover:text-orange-500 transition">
              {product.category.name}
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/50 p-6 sm:p-10 border border-gray-200/50">
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden group">
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {badges.map((badge) => (
                  <span key={badge} className="px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full shadow-lg">
                    {badge}
                  </span>
                ))}
              </div>
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full shadow-lg ${colors.badge}`}>
                  {stockStatus.badge}
                </span>
              </div>
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-orange-500 scale-105' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image src={image} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>

              {product.reviewCount > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < Math.round(product.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({product.reviewCount} değerlendirme)</span>
                </div>
              )}

              {/* Personal Offer Banner */}
              {personalOffer && (
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-5 mb-6 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">
                          Size Özel Teklif 🎁
                        </span>
                      </div>
                      <h3 className="font-bold text-lg mb-1">
                        {personalOffer.offerType === 'PERCENTAGE_DISCOUNT' && `%${personalOffer.discountPercent} İndirim!`}
                        {personalOffer.offerType === 'FIXED_DISCOUNT' && `₺${Number(personalOffer.discountAmount).toFixed(2)} İndirim!`}
                        {personalOffer.offerType === 'BUY_X_GET_Y' && `${personalOffer.buyQuantity} Al ${personalOffer.getQuantity} Bedava!`}
                      </h3>
                      {personalOffer.description && (
                        <p className="text-sm text-white/90 mb-2">{personalOffer.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-white/80">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>
                            {new Date(personalOffer.validUntil).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })} tarihine kadar geçerli
                          </span>
                        </div>
                        {personalOffer.maxUsage && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              {personalOffer.maxUsage - personalOffer.usedCount} kullanım hakkı
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                {personalOffer ? (
                  <>
                    {personalOffer.offerType === 'PERCENTAGE_DISCOUNT' && (
                      <>
                        <span className="text-4xl font-bold text-purple-600">
                          {(product.price * (1 - (personalOffer.discountPercent || 0) / 100)).toFixed(2)} ₺
                        </span>
                        <span className="text-2xl text-gray-400 line-through">{product.price.toFixed(2)} ₺</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                          %{personalOffer.discountPercent} İNDİRİM
                        </span>
                      </>
                    )}
                    {personalOffer.offerType === 'FIXED_DISCOUNT' && (
                      <>
                        <span className="text-4xl font-bold text-purple-600">
                          {(product.price - (personalOffer.discountAmount || 0)).toFixed(2)} ₺
                        </span>
                        <span className="text-2xl text-gray-400 line-through">{product.price.toFixed(2)} ₺</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                          -{Number(personalOffer.discountAmount).toFixed(2)} ₺
                        </span>
                      </>
                    )}
                    {personalOffer.offerType === 'BUY_X_GET_Y' && (
                      <>
                        <span className="text-4xl font-bold text-orange-500">{product.price.toFixed(2)} ₺</span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="text-2xl text-gray-400 line-through">{product.comparePrice.toFixed(2)} ₺</span>
                        )}
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                          {personalOffer.buyQuantity} Al {personalOffer.getQuantity} Bedava
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-orange-500">{product.price.toFixed(2)} ₺</span>
                    {product.comparePrice && product.comparePrice > product.price && (
                      <span className="text-2xl text-gray-400 line-through">{product.comparePrice.toFixed(2)} ₺</span>
                    )}
                  </>
                )}
              </div>

              <div className={`border-2 ${colors.border} ${colors.bg} rounded-xl p-4 mb-6`}>
                <div className="flex items-start gap-3">
                  {renderStockIcon()}
                  <div className="flex-1">
                    <h3 className={`font-bold ${colors.text} mb-1`}>
                      {stockStatus.badge}
                    </h3>
                    <p className={`text-sm ${colors.text}`}>
                      {stockStatus.message}
                    </p>
                    {stockStatus.type === 'backorder' && (
                      <p className="text-xs text-gray-600 mt-2">
                        📦 Ürün siparişiniz alındıktan sonra özenle hazırlanacak ve size ulaştırılacaktır.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

              {(product.burnTime || product.weight || product.dimensions || product.scent || product.material) && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6 space-y-3">
                  <h3 className="font-bold text-gray-900 mb-4">Ürün Özellikleri</h3>
                  {product.burnTime && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Yanma Süresi:</span>
                      <span className="font-medium text-gray-900">{product.burnTime}</span>
                    </div>
                  )}
                  {product.weight && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ağırlık:</span>
                      <span className="font-medium text-gray-900">{product.weight}</span>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Boyutlar:</span>
                      <span className="font-medium text-gray-900">{product.dimensions}</span>
                    </div>
                  )}
                  {product.scent && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Koku:</span>
                      <span className="font-medium text-gray-900">{product.scent}</span>
                    </div>
                  )}
                  {product.material && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Malzeme:</span>
                      <span className="font-medium text-gray-900">{product.material}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center border-2 border-gray-300 rounded-xl overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 hover:bg-gray-100 transition">-</button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center font-semibold focus:outline-none"
                  />
                  <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 hover:bg-gray-100 transition">+</button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!stockStatus.available}
                  className={`relative flex-1 py-3 px-6 rounded-xl font-semibold text-white transition-all ${
                    stockStatus.available
                      ? 'bg-orange-500 hover:bg-orange-600 hover:scale-105 shadow-lg shadow-orange-200'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {addedToCart ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Sepete Eklendi!
                    </span>
                  ) : (
                    <span>{stockStatus.type === 'backorder' ? 'Ön Sipariş Ver' : stockStatus.available ? 'Sepete Ekle' : 'Stokta Yok'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
