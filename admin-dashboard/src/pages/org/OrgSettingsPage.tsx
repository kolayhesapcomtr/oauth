import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { Save, Building2 } from 'lucide-react';

interface OrganizationSettings {
  name: string;
  slug: string;
  owner_email: string;
  billing_email: string | null;
}

export default function OrgSettingsPage() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<OrganizationSettings>({
    name: '',
    slug: '',
    owner_email: '',
    billing_email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user?.organization_id) return;

    try {
      setLoading(true);
      const response = await api.get(`/organizations/${user.organization_id}`);
      const org = response.data.data;
      setSettings({
        name: org.name,
        slug: org.slug,
        owner_email: org.owner_email,
        billing_email: org.billing_email || '',
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.organization_id) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put(`/organizations/${user.organization_id}`, settings);
      setMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Ayarlar kaydedilemedi' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Organizasyon Ayarları</h1>
        <p className="text-gray-600 mt-1">Organizasyon bilgilerini düzenleyin</p>
      </div>

      {message.text && (
        <div
          className={`px-4 py-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Genel Bilgiler</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organizasyon Adı
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug
            </label>
            <input
              type="text"
              value={settings.slug}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Slug değiştirilemez
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sahip E-posta
            </label>
            <input
              type="email"
              value={settings.owner_email}
              onChange={(e) => setSettings({ ...settings, owner_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fatura E-posta
            </label>
            <input
              type="email"
              value={settings.billing_email || ''}
              onChange={(e) => setSettings({ ...settings, billing_email: e.target.value })}
              placeholder="fatura@sirketiniz.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
