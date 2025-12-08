'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  label: string;
  type: string;
  description?: string;
  options?: string;
}

interface SettingsByCategory {
  [category: string]: Setting[];
}

const categoryNames: { [key: string]: string } = {
  general: 'Genel Ayarlar',
  shipping: 'Kargo Ayarları',
  payment: 'Ödeme Ayarları',
  email: 'E-posta Ayarları',
  seo: 'SEO Ayarları',
  social: 'Sosyal Medya',
  geliver: 'Geliver Entegrasyonu',
  parampos: 'ParamPOS Entegrasyonu',
  maintenance: 'Bakım Modu',
};

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsByCategory>({});
  const [activeCategory, setActiveCategory] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/admin/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ayarlar yüklenemedi');
      }

      const data = await response.json();
      setSettings(data.settings);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setMessage({ type: 'error', text: 'Ayarlar yüklenirken hata oluştu' });
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings((prev) => {
      const updated = { ...prev };
      const category = activeCategory;
      const settingIndex = updated[category].findIndex((s) => s.key === key);
      
      if (settingIndex !== -1) {
        updated[category][settingIndex].value = value;
      }
      
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Flatten all settings into a single array
      const allSettings = Object.values(settings).flat();

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: allSettings }),
      });

      if (!response.ok) {
        throw new Error('Ayarlar kaydedilemedi');
      }

      const data = await response.json();
      setMessage({ type: 'success', text: `✅ ${data.updated} ayar başarıyla kaydedildi` });
      
      // Refresh settings
      await fetchSettings();
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Ayarlar kaydedilirken hata oluştu' });
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (setting: Setting) => {
    const { key, value, type, label, description, options } = setting;

    const commonClasses = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent';

    switch (type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => handleInputChange(key, e.target.checked ? 'true' : 'false')}
              className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Aktif</span>
          </label>
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            rows={4}
            className={commonClasses}
            placeholder={description}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className={commonClasses}
            placeholder={description}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className={commonClasses}
            placeholder={description}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className={commonClasses}
            placeholder={description}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => {
              // datetime-local formatından ISO string'e çevir
              const isoString = e.target.value ? new Date(e.target.value).toISOString() : '';
              handleInputChange(key, isoString);
            }}
            className={commonClasses}
            placeholder={description}
          />
        );

      case 'select':
        let selectOptions: string[] = [];
        try {
          selectOptions = options ? JSON.parse(options) : [];
        } catch (e) {
          // Eski format: "TEST,PROD" -> yeni format: ["TEST","PROD"]
          selectOptions = options ? options.split(',').map(s => s.trim()) : [];
        }
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className={commonClasses}
          >
            {selectOptions.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      default: // text
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className={commonClasses}
            placeholder={description}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Ayarlar yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  const categories = Object.keys(settings);
  const currentSettings = settings[activeCategory] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
              <p className="mt-1 text-sm text-gray-600">Site ve sistem ayarlarını yönetin</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Değişiklikleri Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Categories */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow sticky top-8">
              <nav className="space-y-1 p-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeCategory === category
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {categoryNames[category] || category}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Settings Form */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {categoryNames[activeCategory] || activeCategory}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {currentSettings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Bu kategoride ayar bulunamadı
                  </div>
                ) : (
                  currentSettings.map((setting) => (
                    <div key={setting.key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {setting.label}
                      </label>
                      {renderInput(setting)}
                      {setting.description && setting.type !== 'boolean' && (
                        <p className="text-xs text-gray-500">{setting.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Bilgi</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Değişikliklerinizi kaydetmek için yukarıdaki &quot;Değişiklikleri Kaydet&quot; butonunu tıklayın.
                      Bazı ayarlar uygulanması için sunucu yeniden başlatılmasını gerektirebilir.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
