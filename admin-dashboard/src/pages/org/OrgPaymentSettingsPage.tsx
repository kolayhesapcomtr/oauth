import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { CreditCard, Plus, Edit2, Trash2, CheckCircle, XCircle, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface PaymentProvider {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
  supports_sub_merchant: boolean;
  required_credentials: any;
  setup_instructions?: string;
}

interface PaymentSettings {
  id: string;
  organization_id: string;
  payment_provider_id: string;
  is_active: boolean;
  is_live_mode: boolean;
  commission_percentage: number;
  setup_completed_at?: string;
  last_verified_at?: string;
  created_at: string;
}

export default function OrgPaymentSettingsPage() {
  const { user } = useAuthStore();
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [settings, setSettings] = useState<PaymentSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [providersRes, settingsRes] = await Promise.all([
        api.get('/payment/providers'),
        api.get('/payment/settings'),
      ]);
      setProviders(providersRes.data.data || providersRes.data || []);
      setSettings(settingsRes.data.data || settingsRes.data || []);
    } catch (error) {
      console.error('Failed to load payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = (provider: PaymentProvider) => {
    setSelectedProvider(provider);
    setShowSetupModal(true);
  };

  const handleDelete = async (settingId: string) => {
    if (!window.confirm('Bu ödeme ayarını silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/payment/settings/${settingId}`);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ayar silinemedi');
    }
  };

  const handleToggleActive = async (settingId: string, currentStatus: boolean) => {
    try {
      await api.put(`/payment/settings/${settingId}`, { is_active: !currentStatus });
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'İşlem başarısız oldu');
    }
  };

  const getSettingsForProvider = (providerId: string) => {
    return settings.find(s => s.payment_provider_id === providerId);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ödeme Ayarları</h1>
          <p className="text-gray-600 mt-1">Ödeme sağlayıcılarınızı yönetin ve tenantlarınızdan ödeme alın</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm text-gray-600">Tüm bilgiler şifreli saklanır</span>
        </div>
      </div>

      {/* Payment Providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider) => {
          const existingSettings = getSettingsForProvider(provider.id);

          return (
            <div
              key={provider.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all ${
                existingSettings?.is_active
                  ? 'border-green-500'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Provider Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{provider.name}</h3>
                  {provider.supports_sub_merchant && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                      Sub Merchant ⭐
                    </span>
                  )}
                </div>
                {existingSettings && (
                  <div>
                    {existingSettings.is_active ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              {provider.description && (
                <p className="text-sm text-gray-600 mb-4">{provider.description}</p>
              )}

              {/* Status */}
              {existingSettings ? (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Durum</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      existingSettings.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {existingSettings.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Mod</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      existingSettings.is_live_mode
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {existingSettings.is_live_mode ? 'Canlı' : 'Test'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Platform Komisyonu</span>
                    <span className="font-semibold text-gray-900">%{existingSettings.commission_percentage}</span>
                  </div>
                  {existingSettings.last_verified_at && (
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Doğrulanmış</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded p-3">
                    <AlertCircle className="h-4 w-4" />
                    <span>Henüz kurulmamış</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                {existingSettings ? (
                  <>
                    <button
                      onClick={() => handleSetup(provider)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                    >
                      <Edit2 className="h-4 w-4" />
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleToggleActive(existingSettings.id, existingSettings.is_active)}
                      className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                        existingSettings.is_active
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {existingSettings.is_active ? 'Devre Dışı' : 'Aktif Et'}
                    </button>
                    <button
                      onClick={() => handleDelete(existingSettings.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleSetup(provider)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    <Plus className="h-5 w-5" />
                    Kur
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {providers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ödeme sağlayıcı bulunamadı</h3>
          <p className="text-gray-600">Lütfen sistem yöneticisiyle iletişime geçin</p>
        </div>
      )}

      {/* Setup Modal */}
      {showSetupModal && selectedProvider && (
        <PaymentSetupModal
          provider={selectedProvider}
          existingSettings={getSettingsForProvider(selectedProvider.id)}
          onClose={() => {
            setShowSetupModal(false);
            setSelectedProvider(null);
          }}
          onSuccess={() => {
            setShowSetupModal(false);
            setSelectedProvider(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Payment Setup Modal
function PaymentSetupModal({
  provider,
  existingSettings,
  onClose,
  onSuccess,
}: {
  provider: PaymentProvider;
  existingSettings?: PaymentSettings;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuthStore();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isLiveMode, setIsLiveMode] = useState(existingSettings?.is_live_mode || false);
  const [isActive, setIsActive] = useState(existingSettings?.is_active !== undefined ? existingSettings.is_active : true);
  const [showCredentials, setShowCredentials] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Initialize credentials from required fields
  useEffect(() => {
    if (provider.required_credentials) {
      const initialCreds: Record<string, string> = {};
      Object.keys(provider.required_credentials).forEach(key => {
        initialCreds[key] = '';
      });
      setCredentials(initialCreds);
    }
  }, [provider]);

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyStatus('idle');
    setError('');

    try {
      // First save if editing
      if (existingSettings) {
        await api.put(`/payment/settings/${existingSettings.id}`, {
          credentials,
          is_live_mode: isLiveMode,
        });
      }

      // Then verify
      const response = await api.post(
        existingSettings
          ? `/payment/settings/${existingSettings.id}/verify`
          : '/payment/settings/verify',
        { credentials, provider_id: provider.id }
      );

      if (response.data.success) {
        setVerifyStatus('success');
      } else {
        setVerifyStatus('error');
        setError('Doğrulama başarısız oldu');
      }
    } catch (err: any) {
      setVerifyStatus('error');
      setError(err.response?.data?.error || 'Doğrulama başarısız oldu');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        payment_provider_id: provider.id,
        credentials,
        is_live_mode: isLiveMode,
        is_active: isActive,
      };

      if (existingSettings) {
        await api.put(`/payment/settings/${existingSettings.id}`, payload);
      } else {
        await api.post('/payment/settings', payload);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-8">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{provider.name} Kurulumu</h2>
          <p className="text-gray-600 mt-1">
            {existingSettings ? 'Ödeme ayarlarınızı güncelleyin' : 'Ödeme sağlayıcınızı kurun'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {verifyStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Credentials başarıyla doğrulandı!
            </div>
          )}

          {/* Setup Instructions */}
          {provider.setup_instructions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Kurulum Talimatları</h3>
              <p className="text-sm text-blue-700">{provider.setup_instructions}</p>
            </div>
          )}

          {/* Credentials */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">API Bilgileri</h3>
              <button
                type="button"
                onClick={() => setShowCredentials(!showCredentials)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {showCredentials ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Gizle
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Göster
                  </>
                )}
              </button>
            </div>

            {provider.required_credentials && Object.entries(provider.required_credentials).map(([key, type]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} *
                </label>
                <input
                  type={showCredentials ? 'text' : 'password'}
                  value={credentials[key] || ''}
                  onChange={(e) => setCredentials({ ...credentials, [key]: e.target.value })}
                  required
                  placeholder={`${key}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
              </div>
            ))}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Ayarlar</h3>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Canlı Mod</p>
                <p className="text-sm text-gray-600">Gerçek ödemeler alın (Test modu: sandbox)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLiveMode}
                  onChange={(e) => setIsLiveMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Aktif</p>
                <p className="text-sm text-gray-600">Ödemelerde bu provider kullanılsın</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {provider.supports_sub_merchant && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Sub Merchant Avantajı</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Bu provider ile platform komisyonu otomatik olarak kesilir ve para direkt hesabınıza geçer.
                  Komisyon oranı: <strong>%10</strong>
                </p>
              </div>
            )}
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || Object.values(credentials).some(v => !v)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {verifying ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Doğrulanıyor...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                Credentials'ı Doğrula
              </>
            )}
          </button>
        </form>

        <div className="border-t px-6 py-4 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
          >
            {saving ? 'Kaydediliyor...' : existingSettings ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
