'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import CartSidebar from './CartSidebar';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const { itemCount } = useWishlist();
  const { getItemCount } = useCart();
  const cartItemCount = getItemCount();
  const settings = useSettings();

  const freeShippingThreshold = settings.shipping.freeShippingThreshold;
  const contactEmail = settings.site.contactEmail;

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsLoggedIn(true);
      try {
        const userData = JSON.parse(user);
        setUserName(userData.name || '');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen || cartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen, cartOpen]);

  return (
    <>
      {/* Top Bar - Hidden on mobile */}
      <div className="hidden lg:block bg-gray-900 text-white text-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 hover:text-orange-400 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {contactEmail}
              </a>
              <span className="text-gray-400">|</span>
              <span className="text-orange-400">🔥 {freeShippingThreshold} TL üzeri ücretsiz kargo!</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/track-order" className="hover:text-orange-400 transition">
                Siparişimi Takip Et
              </Link>
              <span className="text-gray-400">|</span>
              <Link href="/help" className="hover:text-orange-400 transition">
                Yardım
              </Link>
            </div>
          </div>
        </div>
      </div>

      <header className={`fixed left-0 right-0 z-40 bg-white transition-all duration-300 ${
        scrolled ? 'shadow-lg py-2' : 'shadow-md py-4'
      } lg:top-[42px] top-0`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <img 
                  src="/logo.svg" 
                  alt="Orange Candle Logo" 
                  className="h-10 w-auto"
                  onError={(e) => {
                    // SVG bulunamazsa PNG dene
                    if (e.currentTarget.src.includes('.svg')) {
                      e.currentTarget.src = '/logo.png';
                    } else {
                      // Fallback logo
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                          </div>
                        `;
                      }
                    }
                  }}
                />
                <div className="hidden sm:block">
                  <span className="text-xl md:text-2xl font-bold text-gray-800">
                    <span className="text-orange-500">Orange</span> Candle
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <Link href="/" className="text-gray-700 hover:text-orange-500 transition font-medium">
                Ana Sayfa
              </Link>
              <Link href="/products" className="text-gray-700 hover:text-orange-500 transition font-medium">
                Ürünler
              </Link>
              <Link href="/categories" className="text-gray-700 hover:text-orange-500 transition font-medium">
                Kategoriler
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-orange-500 transition font-medium">
                İletişim
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              {/* Search - Hidden on mobile */}
              <button className="hidden md:flex text-gray-700 hover:text-orange-500 transition p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Account - Hidden on mobile */}
              <Link 
                href={isLoggedIn ? "/account" : "/login"} 
                className="hidden md:flex text-gray-700 hover:text-orange-500 transition p-2 rounded-lg hover:bg-gray-100" 
                title={isLoggedIn ? "Hesabım" : "Giriş Yap"}
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>

              {/* Wishlist - Hidden on small mobile */}
              <Link href="/wishlist" className="hidden sm:flex text-gray-700 hover:text-orange-500 transition relative p-2 rounded-lg hover:bg-gray-100" title="Favoriler">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-semibold">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button 
                onClick={() => setCartOpen(!cartOpen)}
                className="text-gray-700 hover:text-orange-500 transition relative p-2 rounded-lg hover:bg-orange-50"
                title="Sepetim"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold animate-pulse">
                    {cartItemCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-gray-700 hover:text-orange-500 p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-4/5 max-w-sm bg-white z-50 shadow-2xl lg:hidden transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold">
                    <span className="text-orange-500">Orange</span> Candle
                  </span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile Menu Content */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  <Link 
                    href="/" 
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Ana Sayfa
                  </Link>
                  <Link 
                    href="/products" 
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Ürünler
                  </Link>
                  <Link 
                    href="/categories" 
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Kategoriler
                  </Link>
                  <Link 
                    href="/about" 
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Hakkımızda
                  </Link>
                  <Link 
                    href="/contact" 
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    İletişim
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t space-y-1">
                  <Link 
                    href={isLoggedIn ? "/account" : "/login"}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {isLoggedIn ? (userName ? userName : 'Hesabım') : 'Giriş Yap'}
                  </Link>
                  <Link 
                    href="/wishlist" 
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Favorilerim
                  </Link>
                </div>
              </nav>

              {/* Mobile Menu Footer */}
              <div className="p-4 border-t bg-gray-50">
                <div className="text-xs text-gray-600 text-center">
                  <p className="mb-1">📧 info@orangecandle.com.tr</p>
                  <p>📞 +90 (5xx) xxx xx xx</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cart Sidebar */}
      {cartOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full sm:w-96 max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-orange-50 to-white">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Sepetim</h3>
                  <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">{cartItemCount}</span>
                </div>
                <button 
                  onClick={() => setCartOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <CartSidebar onClose={() => setCartOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
