'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  images: string;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  onSale: boolean;
  stockTracking: boolean;
  allowBackorder: boolean;
  backorderMessage: string | null;
  lowStockThreshold: number;
  category: {
    id: string;
    name: string;
  };
  createdAt: string;
  _count: {
    reviews: number;
    orderItems: number;
  };
}

interface Category {
  id: string;
  name: string;
}

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc' | 'date-asc' | 'date-desc';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'featured' | 'bestseller' | 'new' | 'sale'>('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        const categoriesData = data.categories || data;
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert('Ürün silinemedi!');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Bir hata oluştu!');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`${selectedProducts.length} ürünü silmek istediğinize emin misiniz?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/products/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedProducts }),
      });

      if (res.ok) {
        setProducts(products.filter((p) => !selectedProducts.includes(p.id)));
        setSelectedProducts([]);
      } else {
        alert('Ürünler silinemedi!');
      }
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      alert('Bir hata oluştu!');
    }
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
  };

  const getFilteredProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.category.name.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category.id === selectedCategory);
    }

    if (stockFilter === 'in-stock') {
      filtered = filtered.filter((p) => {
        // Stok takibi kapalı veya ön sipariş açıksa her zaman stokta sayılır
        if (!p.stockTracking || p.allowBackorder) return true;
        return p.stock > p.lowStockThreshold;
      });
    } else if (stockFilter === 'low-stock') {
      filtered = filtered.filter((p) => {
        // Sadece stok takibi açık ve ön sipariş kapalı ürünlerde düşük stok olabilir
        if (!p.stockTracking || p.allowBackorder) return false;
        return p.stock > 0 && p.stock <= p.lowStockThreshold;
      });
    } else if (stockFilter === 'out-of-stock') {
      filtered = filtered.filter((p) => {
        // Stok takibi kapalı veya ön sipariş açıksa asla tükenmez
        if (!p.stockTracking || p.allowBackorder) return false;
        return p.stock === 0;
      });
    }

    if (statusFilter === 'featured') {
      filtered = filtered.filter((p) => p.featured);
    } else if (statusFilter === 'bestseller') {
      filtered = filtered.filter((p) => p.bestseller);
    } else if (statusFilter === 'new') {
      filtered = filtered.filter((p) => p.newArrival);
    } else if (statusFilter === 'sale') {
      filtered = filtered.filter((p) => p.onSale);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return Number(a.price) - Number(b.price);
        case 'price-desc':
          return Number(b.price) - Number(a.price);
        case 'stock-asc':
          return a.stock - b.stock;
        case 'stock-desc':
          return b.stock - a.stock;
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const getStockBadge = (product: Product) => {
    // Stok takibi kapalıysa
    if (!product.stockTracking) {
      return <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border-2 border-blue-200">Sınırsız Stok</span>;
    }
    
    // Ön sipariş açıksa
    if (product.allowBackorder) {
      if (product.stock === 0) {
        return <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border-2 border-purple-200">Ön Sipariş</span>;
      } else if (product.stock <= product.lowStockThreshold) {
        return <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold border-2 border-indigo-200">Az Kaldı (Ön Sipariş)</span>;
      }
      return <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold border-2 border-green-200">Stokta (Ön Sipariş)</span>;
    }
    
    // Normal stok takibi
    if (product.stock === 0) {
      return <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold border-2 border-red-200">Tükendi</span>;
    } else if (product.stock <= product.lowStockThreshold) {
      return <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border-2 border-yellow-200">Düşük Stok</span>;
    }
    return <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold border-2 border-green-200">Stokta</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Ürünler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 bg-clip-text text-transparent mb-2">
              Ürün Yönetimi
            </h1>
            <p className="text-gray-600">
              Toplam <span className="font-bold text-orange-600">{filteredProducts.length}</span> ürün
              {selectedProducts.length > 0 && (
                <span className="ml-2">
                  • <span className="font-bold text-blue-600">{selectedProducts.length}</span> seçili
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products/new"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Ürün Ekle
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              placeholder="Ürün, SKU veya kategori ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium bg-white">
            <option value="">Tüm Kategoriler</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as any)} className="px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium bg-white">
            <option value="all">Tüm Stoklar</option>
            <option value="in-stock">Stokta</option>
            <option value="low-stock">Düşük Stok</option>
            <option value="out-of-stock">Tükendi</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium bg-white">
            <option value="all">Tüm Durumlar</option>
            <option value="featured">Öne Çıkanlar</option>
            <option value="bestseller">Çok Satanlar</option>
            <option value="new">Yeni Ürünler</option>
            <option value="sale">İndirimde</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium bg-white">
            <option value="date-desc">En Yeni</option>
            <option value="date-asc">En Eski</option>
            <option value="name-asc">İsim (A-Z)</option>
            <option value="name-desc">İsim (Z-A)</option>
            <option value="price-asc">Fiyat (Düşük)</option>
            <option value="price-desc">Fiyat (Yüksek)</option>
            <option value="stock-asc">Stok (Düşük)</option>
            <option value="stock-desc">Stok (Yüksek)</option>
          </select>
        </div>

        {selectedProducts.length > 0 && (
          <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
            <p className="text-sm font-semibold text-gray-600">{selectedProducts.length} ürün seçildi</p>
            <div className="flex items-center gap-3">
              <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition">
                Seçilenleri Sil
              </button>
              <button onClick={() => setSelectedProducts([])} className="px-4 py-2 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition">
                Seçimi Temizle
              </button>
            </div>
          </div>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-16 text-center">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Ürün Bulunamadı</h3>
          <p className="text-gray-600 mb-6">Aradığınız kriterlere uygun ürün bulunamadı.</p>
          <Link href="/admin/products/new" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            İlk Ürünü Ekle
          </Link>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-50 to-white">
                <tr>
                  <th className="py-5 px-6 text-left">
                    <input type="checkbox" checked={selectedProducts.length === filteredProducts.length} onChange={toggleAllProducts} className="w-5 h-5 rounded cursor-pointer" />
                  </th>
                  <th className="py-5 px-6 text-left text-sm font-bold text-gray-700">Ürün</th>
                  <th className="py-5 px-6 text-left text-sm font-bold text-gray-700">SKU</th>
                  <th className="py-5 px-6 text-left text-sm font-bold text-gray-700">Kategori</th>
                  <th className="py-5 px-6 text-left text-sm font-bold text-gray-700">Fiyat</th>
                  <th className="py-5 px-6 text-left text-sm font-bold text-gray-700">Stok</th>
                  <th className="py-5 px-6 text-left text-sm font-bold text-gray-700">Durum</th>
                  <th className="py-5 px-6 text-left text-sm font-bold text-gray-700">İstatistik</th>
                  <th className="py-5 px-6 text-right text-sm font-bold text-gray-700">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const images = JSON.parse(product.images);
                  const isSelected = selectedProducts.includes(product.id);

                  return (
                    <tr key={product.id} className={`border-t-2 border-gray-100 hover:bg-orange-50/50 transition ${isSelected ? 'bg-orange-50' : ''}`}>
                      <td className="py-4 px-6">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleProductSelection(product.id)} className="w-5 h-5 rounded cursor-pointer" />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                            <Image src={images[0] || '/placeholder.png'} alt={product.name} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 mb-1">{product.name}</p>
                            <div className="flex gap-1">
                              {product.featured && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold">Öne Çıkan</span>}
                              {product.bestseller && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">Çok Satan</span>}
                              {product.newArrival && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">Yeni</span>}
                              {product.onSale && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">İndirim</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm bg-gray-100 px-3 py-1.5 rounded-lg font-semibold">{product.sku}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">{product.category.name}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-lg font-bold text-gray-900">{Number(product.price).toFixed(2)} ₺</p>
                          {product.comparePrice && <p className="text-sm text-gray-400 line-through">{Number(product.comparePrice).toFixed(2)} ₺</p>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-2">
                          {getStockBadge(product)}
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-gray-600">{product.stock} adet</span>
                            {!product.stockTracking && (
                              <span className="text-xs text-blue-600 font-semibold">⚡ Takip yok</span>
                            )}
                            {product.allowBackorder && (
                              <span className="text-xs text-purple-600 font-semibold">✓ Ön sipariş</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          {product.featured && <span className="text-xs text-purple-600 font-semibold">✓ Öne Çıkan</span>}
                          {product.bestseller && <span className="text-xs text-blue-600 font-semibold">✓ Çok Satan</span>}
                          {product.newArrival && <span className="text-xs text-green-600 font-semibold">✓ Yeni</span>}
                          {product.onSale && <span className="text-xs text-red-600 font-semibold">✓ İndirimde</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-semibold">{product._count.reviews} yorum</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <span className="font-semibold">{product._count.orderItems} satış</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/products/${product.id}`} className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition" title="Düzenle">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button onClick={() => handleDelete(product.id)} className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition" title="Sil">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
