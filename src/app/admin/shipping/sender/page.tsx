'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateSenderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({
    name: 'Orange Candle',
    email: 'destek@orangecandle.com.tr',
    phone: '+905551234567',
    address1: 'Örnek Mahallesi, Örnek Sokak No:1',
    cityName: 'İstanbul',
    cityCode: '34',
    districtName: 'Kadıköy',
    zip: '34710',
    shortName: 'Ana Depo',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/admin/shipping/sender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          sender: data.sender,
          message: data.message,
        });
      } else {
        setResult({
          success: false,
          error: data.error,
          details: data.details,
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: 'İstek başarısız',
        details: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8 mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-600 to-gray-900 bg-clip-text text-transparent mb-2">
          Gönderici Adresi Oluştur
        </h1>
        <p className="text-gray-600 mb-6">
          Geliver kargo sistemi için gönderici adresinizi kaydedin. Bu adres tüm kargo gönderilerinizde kullanılacaktır.
        </p>

        {result && (
          <div
            className={`p-6 rounded-xl border-2 mb-6 ${
              result.success
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}
          >
            {result.success ? (
              <>
                <h3 className="text-lg font-bold text-green-800 mb-3">✅ Başarılı!</h3>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-green-700">
                    <span className="font-semibold">Sender ID:</span>{' '}
                    <code className="bg-green-100 px-2 py-1 rounded">{result.sender?.id}</code>
                  </p>
                  <p className="text-sm text-green-700">
                    <span className="font-semibold">Ad:</span> {result.sender?.name}
                  </p>
                </div>
                <div className="bg-green-100 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-bold text-green-900 mb-2">
                    ⚠️ ÖNEMLİ: Bu ID'yi .env dosyanıza ekleyin:
                  </p>
                  <code className="block bg-white px-3 py-2 rounded text-sm text-gray-800 overflow-x-auto">
                    GELIVER_SENDER_ADDRESS_ID={result.sender?.id}
                  </code>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-red-800 mb-3">❌ Hata</h3>
                <p className="text-sm text-red-700 mb-2">{result.error}</p>
                {result.details && (
                  <pre className="text-xs text-red-600 bg-red-100 p-3 rounded overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Firma Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                E-posta <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Telefon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                placeholder="+905551234567"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Örnek: +905551234567</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Kısa Ad (Opsiyonel)
              </label>
              <input
                type="text"
                value={form.shortName}
                onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                placeholder="Ana Depo, Şube 1"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Adres <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={form.address1}
              onChange={(e) => setForm({ ...form, address1: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Şehir <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.cityName}
                onChange={(e) => setForm({ ...form, cityName: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Şehir Kodu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.cityCode}
                onChange={(e) => setForm({ ...form, cityCode: e.target.value })}
                required
                placeholder="34"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                İlçe <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.districtName}
                onChange={(e) => setForm({ ...form, districtName: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Posta Kodu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.zip}
              onChange={(e) => setForm({ ...form, zip: e.target.value })}
              required
              placeholder="34710"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Oluşturuluyor...' : '📦 Gönderici Adresi Oluştur'}
          </button>
        </form>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">ℹ️ Bilgilendirme</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• Bu işlem sadece bir kez yapılmalıdır</li>
          <li>• Oluşturduğunuz Sender ID'yi .env dosyanıza kaydetmeyi unutmayın</li>
          <li>• Telefon numarası uluslararası formatta olmalıdır (+90...)</li>
          <li>• Posta kodu gönderici adresi için zorunludur</li>
          <li>• Bilgileri değiştirmek isterseniz yeni bir gönderici adresi oluşturabilirsiniz</li>
        </ul>
      </div>
    </div>
  );
}
