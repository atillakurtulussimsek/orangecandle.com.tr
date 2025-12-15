'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  price: string;
  comparePrice: string;
  stock: string;
  sku: string;
  categoryId: string;
  images: string[];
  tags: string[];
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  onSale: boolean;
  discount: string;
  weight: string;
  dimensions: string;
  burnTime: string;
  scent: string;
  material: string;
  stockTracking: boolean;
  allowBackorder: boolean;
  backorderMessage: string;
  lowStockThreshold: string;
}

export default function ProductFormPage() {
  const router = useRouter();
  const params = useParams();
  const isEdit = params.id && params.id !== 'new';
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [imageInput, setImageInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    price: '',
    comparePrice: '',
    stock: '0',
    sku: '',
    categoryId: '',
    images: [],
    tags: [],
    featured: false,
    bestseller: false,
    newArrival: false,
    onSale: false,
    discount: '0',
    weight: '',
    dimensions: '',
    burnTime: '',
    scent: '',
    material: '',
    stockTracking: true,
    allowBackorder: false,
    backorderMessage: '',
    lowStockThreshold: '10',
  });

  useEffect(() => {
    loadCategories();
    if (isEdit) {
      loadProduct();
    }
  }, []);

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

  const loadProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/products/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const product = await res.json();
        setFormData({
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price.toString(),
          comparePrice: product.comparePrice?.toString() || '',
          stock: product.stock.toString(),
          sku: product.sku,
          categoryId: product.categoryId,
          images: JSON.parse(product.images),
          tags: product.tags ? JSON.parse(product.tags) : [],
          featured: product.featured,
          bestseller: product.bestseller,
          newArrival: product.newArrival,
          onSale: product.onSale,
          discount: product.discount?.toString() || '0',
          weight: product.weight || '',
          dimensions: product.dimensions || '',
          burnTime: product.burnTime || '',
          scent: product.scent || '',
          material: product.material || '',
          stockTracking: product.stockTracking ?? true,
          allowBackorder: product.allowBackorder ?? false,
          backorderMessage: product.backorderMessage || '',
          lowStockThreshold: product.lowStockThreshold?.toString() || '10',
        });
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      alert('Ürün yüklenemedi!');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const addImage = () => {
    if (imageInput.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, imageInput.trim()],
      });
      setImageInput('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu 5MB\'dan küçük olmalıdır!');
      return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      alert('Sadece resim dosyaları yüklenebilir!');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, data.url],
        }));
        // Input'u temizle
        e.target.value = '';
      } else {
        const error = await response.json();
        alert(error.error || 'Dosya yüklenirken hata oluştu!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Dosya yüklenirken hata oluştu!');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Stok yönetimi validasyonu - En az bir seçenek aktif olmalı
    if (!formData.stockTracking && !formData.allowBackorder) {
      alert('Ürünün satışa sunulabilmesi için "Stok Takibi Yap" veya "Ön Sipariş Kabul Et" seçeneklerinden en az biri aktif olmalıdır!');
      setSaving(false);
      return;
    }
    
    if (formData.stockTracking && (!formData.stock || parseInt(formData.stock) < 0)) {
      alert('Stok takibi yapıldığında stok miktarı zorunludur ve 0 veya daha büyük olmalıdır!');
      setSaving(false);
      return;
    }

    if (formData.allowBackorder && !formData.backorderMessage.trim()) {
      alert('Sipariş üzerine üretim seçildiğinde bilgilendirme mesajı zorunludur!');
      setSaving(false);
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const url = isEdit
        ? `/api/admin/products/${params.id}`
        : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        stock: parseInt(formData.stock),
        discount: parseInt(formData.discount),
        lowStockThreshold: parseInt(formData.lowStockThreshold),
        images: formData.images,
        tags: formData.tags,
        stockTracking: formData.stockTracking,
        allowBackorder: formData.allowBackorder,
        backorderMessage: formData.backorderMessage || null,
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(isEdit ? 'Ürün güncellendi!' : 'Ürün eklendi!');
        router.push('/admin/products');
      } else {
        const error = await res.json();
        alert(error.error || 'Bir hata oluştu!');
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Bir hata oluştu!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Ürün yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 bg-clip-text text-transparent mb-2">
              {isEdit ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
            </h1>
            <p className="text-gray-600">
              {isEdit ? 'Ürün bilgilerini güncelleyin' : 'Yeni bir ürün eklemek için formu doldurun'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isEdit ? 'Güncelle' : 'Ürünü Kaydet'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Temel Bilgiler
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Örn: Lavanta Kokulu Mum"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm bg-gray-50"
                  placeholder="lavanta-kokulu-mum"
                />
                <p className="text-sm text-gray-500 mt-1">
                  URL: /products/{formData.slug || 'urun-adi'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Açıklama *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Ürün hakkında detaylı açıklama yazın..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    SKU *
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                    placeholder="MUM-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Kategori *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Kategori Seçin</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Fiyat & Stok
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Satış Fiyatı (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Karşılaştırma Fiyatı (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.comparePrice}
                  onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="text-sm text-gray-500 mt-1">Üzeri çizili fiyat</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Stok Miktarı {formData.stockTracking && '*'}
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required={formData.stockTracking}
                  disabled={!formData.stockTracking}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="0"
                  min="0"
                />
                {!formData.stockTracking && (
                  <p className="text-sm text-gray-500 mt-1">
                    Stok takibi kapalı olduğu için bu alan devre dışı
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  İndirim Oranı (%)
                </label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Stock Management */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              Stok Yönetimi
            </h2>

            <div className="space-y-5">
              {/* Stock Tracking */}
              <label className="flex items-start gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.stockTracking}
                  onChange={(e) => {
                    // Eğer kapatılıyorsa ve backorder da kapalıysa, backorder'ı otomatik aç
                    if (!e.target.checked && !formData.allowBackorder) {
                      setFormData({ ...formData, stockTracking: e.target.checked, allowBackorder: true });
                    } else {
                      setFormData({ ...formData, stockTracking: e.target.checked });
                    }
                  }}
                  className="w-6 h-6 rounded mt-1"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900 mb-1">Stok Takibi Yap</div>
                  <div className="text-sm text-gray-600">
                    Bu ürün için stok takibi yapılsın. Stok bittiğinde sipariş alınamaz (ön sipariş aktif değilse).
                  </div>
                </div>
              </label>

              {formData.stockTracking && (
                <div className="ml-10 space-y-4 pl-5 border-l-4 border-blue-200">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Düşük Stok Uyarı Seviyesi
                    </label>
                    <input
                      type="number"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10"
                      min="0"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Stok bu değere düştüğünde "Düşük Stok" uyarısı gösterilir
                    </p>
                  </div>
                </div>
              )}

              {/* Allow Backorder */}
              <label className="flex items-start gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.allowBackorder}
                  onChange={(e) => {
                    // Eğer kapatılıyorsa ve stok takibi de kapalıysa, stok takibini otomatik aç
                    if (!e.target.checked && !formData.stockTracking) {
                      setFormData({ ...formData, allowBackorder: e.target.checked, stockTracking: true });
                    } else {
                      setFormData({ ...formData, allowBackorder: e.target.checked });
                    }
                  }}
                  className="w-6 h-6 rounded mt-1"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900 mb-1">Ön Sipariş Kabul Et</div>
                  <div className="text-sm text-gray-600">
                    Stok bittiğinde veya stok takibi yapılmıyorsa sipariş alınabilsin. Sipariş üzerine üretim için idealdir.
                  </div>
                </div>
              </label>

              {formData.allowBackorder && (
                <div className="ml-10 space-y-4 pl-5 border-l-4 border-green-200">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Ön Sipariş Mesajı
                    </label>
                    <textarea
                      value={formData.backorderMessage}
                      onChange={(e) => setFormData({ ...formData, backorderMessage: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      placeholder="Örn: Bu ürün sipariş üzerine üretilmektedir. Tahmini teslimat süresi 7-10 iş günüdür."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Müşterilere gösterilecek bilgilendirme mesajı
                    </p>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-5">
                <div className="flex gap-3">
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-gray-700">
                    <p className="font-bold mb-2">Stok Yönetimi Nasıl Çalışır?</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li><strong>Stok takibi AÇIK:</strong> Stok adedi kontrol edilir, stok bitince sipariş alınamaz (ön sipariş yoksa)</li>
                      <li><strong>Stok takibi KAPALI:</strong> Stok kontrolü yapılmaz, her zaman sipariş alınır</li>
                      <li><strong>Ön sipariş AÇIK:</strong> Stok bittiğinde veya stok takibi kapalıysa sipariş alınabilir</li>
                      <li><strong>İkisi de AÇIK:</strong> Stok varken normal, stok bitince ön sipariş mesajıyla satış devam eder</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              Ürün Detayları
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Ağırlık
                </label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Örn: 250g"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Boyutlar
                </label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Örn: 10x10x12 cm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Yanma Süresi
                </label>
                <input
                  type="text"
                  value={formData.burnTime}
                  onChange={(e) => setFormData({ ...formData, burnTime: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Örn: 40-45 saat"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Koku
                </label>
                <input
                  type="text"
                  value={formData.scent}
                  onChange={(e) => setFormData({ ...formData, scent: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Örn: Lavanta"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Malzeme
                </label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Örn: %100 Doğal Soya Mumu"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              Ürün Görselleri
            </h2>

            <div className="space-y-4">
              {/* File Upload Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">Bilgisayardan Yükle</h3>
                    <p className="text-sm text-gray-600 mb-3">Resim dosyası seçin (Max: 5MB, JPG/PNG/WEBP/GIF)</p>
                    <div className="flex gap-3">
                      <label className={`flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-center cursor-pointer hover:from-blue-600 hover:to-blue-700 transition shadow-lg ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {uploading ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Yükleniyor...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Dosya Seç
                          </span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* URL Input Section */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">veya URL ile ekle</span>
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Görsel URL'si girin"
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 transition"
                >
                  Ekle
                </button>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                        <Image
                          src={img}
                          alt={`Product ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-600"
                      >
                        ×
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 px-2 py-1 bg-orange-500 text-white rounded-lg text-xs font-bold shadow-lg">
                          Ana Görsel
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              Etiketler
            </h2>

            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Etiket ekle (Örn: lavanta, doğal, hediye)"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-6 py-3 bg-pink-500 text-white rounded-2xl font-bold hover:bg-pink-600 transition"
                >
                  Ekle
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-full text-sm font-bold text-gray-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center hover:bg-pink-600 transition text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-6 sticky top-6">
            <h3 className="text-xl font-bold text-gray-900 mb-5">Durum</h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900">Öne Çıkan</div>
                  <div className="text-sm text-gray-500">Ana sayfada göster</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.bestseller}
                  onChange={(e) => setFormData({ ...formData, bestseller: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900">Çok Satan</div>
                  <div className="text-sm text-gray-500">Popüler ürün</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.newArrival}
                  onChange={(e) => setFormData({ ...formData, newArrival: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900">Yeni Ürün</div>
                  <div className="text-sm text-gray-500">Yeni gelenler</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.onSale}
                  onChange={(e) => setFormData({ ...formData, onSale: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900">İndirimde</div>
                  <div className="text-sm text-gray-500">İndirim kampanyası</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
