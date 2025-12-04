'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

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
  discount: number;
  stock: number;
  stockTracking: boolean;
  allowBackorder: boolean;
  backorderMessage: string | null;
  category: string;
  categoryId: string;
  reviewCount: number;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState('featured');
  const [showOnSale, setShowOnSale] = useState(false);
  const [showNewArrivals, setShowNewArrivals] = useState(false);
  const [showBestsellers, setShowBestsellers] = useState(false);
  const [showInStock, setShowInStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '9',
          sortBy,
        });

        if (selectedCategory !== 'all') {
          params.append('categoryId', selectedCategory);
        }
        if (priceRange[0] > 0) {
          params.append('minPrice', priceRange[0].toString());
        }
        if (priceRange[1] < 500) {
          params.append('maxPrice', priceRange[1].toString());
        }
        if (showOnSale) params.append('onSale', 'true');
        if (showNewArrivals) params.append('newArrival', 'true');
        if (showBestsellers) params.append('bestseller', 'true');
        if (showInStock) params.append('inStock', 'true');

        const response = await fetch(`/api/products?${params.toString()}`);
        const data = await response.json();

        setProducts(data.products);
        setTotalPages(data.pagination.totalPages);
        setTotalProducts(data.pagination.total);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, selectedCategory, priceRange, sortBy, showOnSale, showNewArrivals, showBestsellers, showInStock]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        
        const categoryList = [
          { id: 'all', name: 'Tümü', count: 0 },
          ...data.map((cat: any) => ({ id: cat.id, name: cat.name, count: 0 })),
        ];
        
        setCategories(categoryList);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const resetFilters = () => {
    setSelectedCategory('all');
    setPriceRange([0, 500]);
    setShowOnSale(false);
    setShowNewArrivals(false);
    setShowBestsellers(false);
    setShowInStock(false);
    setCurrentPage(1);
  };

  const handleFilterChange = (callback: () => void) => {
    callback();
    setCurrentPage(1);
  };

  const activeFiltersCount = 
    (selectedCategory !== 'all' ? 1 : 0) +
    (showOnSale ? 1 : 0) +
    (showNewArrivals ? 1 : 0) +
    (showBestsellers ? 1 : 0) +
    (showInStock ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Breadcrumb */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-orange-500 transition">
              Ana Sayfa
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium">Ürünler</span>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="container mx-auto px-4 pt-8 pb-6">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg shadow-orange-200 mb-6 transform hover:scale-110 transition-transform duration-300">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">Tüm Ürünler</h1>
          <p className="text-lg text-gray-600">El yapımı mumlar ve özel koleksiyonlarımızı keşfedin</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block lg:w-80 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Filtreler</h2>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                  >
                    Temizle ({activeFiltersCount})
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Kategoriler</h3>
                <div className="space-y-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleFilterChange(() => setSelectedCategory(category.id))}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                        selectedCategory === category.id
                          ? 'bg-orange-50 text-orange-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Fiyat Aralığı</h3>
                <div className="space-y-4">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={priceRange[1]}
                    onChange={(e) => handleFilterChange(() => setPriceRange([priceRange[0], parseInt(e.target.value)]))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">0 ₺</span>
                    <span className="font-semibold text-orange-600">{priceRange[1]} ₺</span>
                  </div>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Hızlı Filtreler</h3>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showOnSale}
                    onChange={(e) => handleFilterChange(() => setShowOnSale(e.target.checked))}
                    className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-orange-500 transition">
                    İndirimli Ürünler
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showNewArrivals}
                    onChange={(e) => handleFilterChange(() => setShowNewArrivals(e.target.checked))}
                    className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-orange-500 transition">
                    Yeni Ürünler
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showBestsellers}
                    onChange={(e) => handleFilterChange(() => setShowBestsellers(e.target.checked))}
                    className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-orange-500 transition">
                    Çok Satanlar
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showInStock}
                    onChange={(e) => handleFilterChange(() => setShowInStock(e.target.checked))}
                    className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-orange-500 transition">
                    Stokta Var
                  </span>
                </label>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filtreler
                    {activeFiltersCount > 0 && (
                      <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  <p className="text-gray-600">
                    <span className="font-semibold text-gray-900">{totalProducts}</span> ürün bulundu
                  </p>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label htmlFor="sort" className="text-sm text-gray-600 whitespace-nowrap">
                    Sırala:
                  </label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => handleFilterChange(() => setSortBy(e.target.value))}
                    className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="featured">Öne Çıkanlar</option>
                    <option value="newest">Yeni Ürünler</option>
                    <option value="bestseller">Çok Satanlar</option>
                    <option value="price-asc">Fiyat: Düşükten Yükseğe</option>
                    <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
                    <option value="name-asc">İsim: A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 font-semibold">Ürünler yükleniyor...</p>
                </div>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm p-6">
                    <p className="text-sm text-gray-600">
                      Sayfa <span className="font-semibold text-gray-900">{currentPage}</span> / {totalPages}
                      <span className="mx-2">•</span>
                      Toplam <span className="font-semibold text-gray-900">{totalProducts}</span> ürün
                    </p>

                    <div className="flex items-center gap-2">
                      {/* Previous Button */}
                      <button
                        onClick={() => {
                          setCurrentPage(prev => Math.max(1, prev - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Next Button */}
                      <button
                        onClick={() => {
                          setCurrentPage(prev => Math.min(totalPages, prev + 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ürün Bulunamadı</h3>
                <p className="text-gray-600 mb-6">Seçtiğiniz filtrelere uygun ürün bulunamadı</p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
