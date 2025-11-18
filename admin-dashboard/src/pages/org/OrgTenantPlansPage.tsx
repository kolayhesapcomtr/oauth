import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { DollarSign, Plus, Edit2, Trash2, Users, Copy, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

interface TenantPlan {
  id: string;
  organization_id: string;
  domain_id?: string;
  name: string;
  slug: string;
  description?: string;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  max_users: number;
  max_storage_gb: number;
  max_api_calls_per_month: number;
  max_custom_fields: number;
  features: any;
  has_trial: boolean;
  trial_days: number;
  display_order: number;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export default function OrgTenantPlansPage() {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<TenantPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TenantPlan | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    if (!user?.organization_id) return;

    try {
      setLoading(true);
      const response = await api.get(`/tenant-subscription-plans?organization_id=${user.organization_id}`);
      setPlans(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: TenantPlan) => {
    setEditingPlan(plan);
    setShowEditModal(true);
  };

  const handleDelete = async (planId: string) => {
    if (!window.confirm('Bu planı silmek istediğinizden emin misiniz? Bu planı kullanan tenantlar varsa silinemez.')) return;

    try {
      await api.delete(`/tenant-subscription-plans/${planId}`);
      await loadPlans();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Plan silinemedi');
    }
  };

  const handleToggleActive = async (planId: string, currentStatus: boolean) => {
    try {
      await api.put(`/tenant-subscription-plans/${planId}`, { is_active: !currentStatus });
      await loadPlans();
    } catch (error: any) {
      alert(error.response?.data?.error || 'İşlem başarısız oldu');
    }
  };

  const handleTogglePublic = async (planId: string, currentStatus: boolean) => {
    try {
      await api.put(`/tenant-subscription-plans/${planId}`, { is_public: !currentStatus });
      await loadPlans();
    } catch (error: any) {
      alert(error.response?.data?.error || 'İşlem başarısız oldu');
    }
  };

  const handleClone = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const newName = prompt('Yeni plan adı:', `${plan.name} (Kopya)`);
    if (!newName) return;

    const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
      await api.post(`/tenant-subscription-plans/${planId}/clone`, { name: newName, slug: newSlug });
      await loadPlans();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Plan kopyalanamadı');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Abonelik Planları</h1>
          <p className="text-gray-600 mt-1">Tenantlarınız için fiyatlandırma planları oluşturun ve yönetin</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Yeni Plan Oluştur
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
              plan.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
            }`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500">/{plan.slug}</p>
                </div>
                <div className="flex items-center gap-1">
                  {plan.is_public ? (
                    <Eye className="h-4 w-4 text-green-600" title="Herkese açık" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" title="Gizli" />
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.currency === 'USD' && '$'}
                    {plan.currency === 'EUR' && '€'}
                    {plan.currency === 'TRY' && '₺'}
                    {plan.monthly_price}
                  </span>
                  <span className="text-gray-600">/ay</span>
                </div>
                {plan.yearly_price > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    veya {plan.currency === 'USD' && '$'}{plan.currency === 'EUR' && '€'}{plan.currency === 'TRY' && '₺'}{plan.yearly_price}/yıl
                  </p>
                )}
                {plan.has_trial && (
                  <p className="text-sm text-green-600 mt-2">
                    🎁 {plan.trial_days} gün ücretsiz deneme
                  </p>
                )}
              </div>

              {/* Description */}
              {plan.description && (
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              )}

              {/* Limits */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Kullanıcı Limiti</span>
                  <span className="font-semibold">{plan.max_users === -1 ? 'Sınırsız' : plan.max_users}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">API Çağrıları</span>
                  <span className="font-semibold">{plan.max_api_calls_per_month === -1 ? 'Sınırsız' : plan.max_api_calls_per_month.toLocaleString()}/ay</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Depolama</span>
                  <span className="font-semibold">{plan.max_storage_gb === -1 ? 'Sınırsız' : `${plan.max_storage_gb} GB`}</span>
                </div>
              </div>

              {/* Features */}
              {plan.features && Object.keys(plan.features).length > 0 && (
                <div className="border-t pt-4 mb-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">ÖZELLİKLER</p>
                  <div className="space-y-1 text-xs">
                    {Object.entries(plan.features).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        {value ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-300">✗</span>
                        )}
                        <span className={value ? 'text-gray-700' : 'text-gray-400'}>
                          {key.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-2 mb-4">
                {plan.is_active ? (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                    Aktif
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    Pasif
                  </span>
                )}
                {plan.is_public && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    Herkese Açık
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(plan)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  title="Düzenle"
                >
                  <Edit2 className="h-4 w-4" />
                  Düzenle
                </button>
                <button
                  onClick={() => handleClone(plan.id)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Kopyala"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(plan.id, plan.is_active)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    plan.is_active
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                  title={plan.is_active ? 'Devre Dışı Bırak' : 'Aktif Et'}
                >
                  {plan.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  title="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz plan yok</h3>
          <p className="text-gray-600 mb-6">Tenantlarınız için fiyatlandırma planları oluşturun</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            İlk Planı Oluştur
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <PlanFormModal
          organizationId={user?.organization_id!}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPlans();
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingPlan && (
        <PlanFormModal
          organizationId={user?.organization_id!}
          plan={editingPlan}
          onClose={() => {
            setShowEditModal(false);
            setEditingPlan(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingPlan(null);
            loadPlans();
          }}
        />
      )}
    </div>
  );
}

// Plan Form Modal Component
function PlanFormModal({
  organizationId,
  plan,
  onClose,
  onSuccess,
}: {
  organizationId: string;
  plan?: TenantPlan;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    slug: plan?.slug || '',
    description: plan?.description || '',
    monthly_price: plan?.monthly_price || 0,
    yearly_price: plan?.yearly_price || 0,
    currency: plan?.currency || 'USD',
    max_users: plan?.max_users || 10,
    max_storage_gb: plan?.max_storage_gb || 1,
    max_api_calls_per_month: plan?.max_api_calls_per_month || 10000,
    max_custom_fields: plan?.max_custom_fields || 5,
    has_trial: plan?.has_trial || false,
    trial_days: plan?.trial_days || 0,
    is_active: plan?.is_active !== undefined ? plan.is_active : true,
    is_public: plan?.is_public !== undefined ? plan.is_public : true,
  });
  const [features, setFeatures] = useState<Record<string, boolean>>(plan?.features || {
    custom_branding: false,
    api_access: true,
    advanced_analytics: false,
    priority_support: false,
    sso: false,
    webhooks: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: !plan ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : formData.slug,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        organization_id: organizationId,
        features,
      };

      if (plan) {
        await api.put(`/tenant-subscription-plans/${plan.id}`, payload);
      } else {
        await api.post('/tenant-subscription-plans', payload);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'İşlem başarısız oldu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-8">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {plan ? 'Planı Düzenle' : 'Yeni Plan Oluştur'}
          </h2>
          <p className="text-gray-600 mt-1">Tenant abonelik planınızın detaylarını belirleyin</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Adı *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Free, Pro, Enterprise"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                placeholder="free, pro, enterprise"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Plan açıklaması..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Fiyatlandırma</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aylık Fiyat</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthly_price}
                  onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yıllık Fiyat</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.yearly_price}
                  onChange={(e) => setFormData({ ...formData, yearly_price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="TRY">TRY (₺)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Limits */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Limitler</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maksimum Kullanıcı <span className="text-xs text-gray-500">(-1 = sınırsız)</span>
                </label>
                <input
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depolama (GB) <span className="text-xs text-gray-500">(-1 = sınırsız)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.max_storage_gb}
                  onChange={(e) => setFormData({ ...formData, max_storage_gb: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Çağrıları/Ay <span className="text-xs text-gray-500">(-1 = sınırsız)</span>
                </label>
                <input
                  type="number"
                  value={formData.max_api_calls_per_month}
                  onChange={(e) => setFormData({ ...formData, max_api_calls_per_month: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Özel Alan Sayısı</label>
                <input
                  type="number"
                  value={formData.max_custom_fields}
                  onChange={(e) => setFormData({ ...formData, max_custom_fields: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Trial */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Deneme Süresi</h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.has_trial}
                  onChange={(e) => setFormData({ ...formData, has_trial: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Deneme süresi var</span>
              </label>
              {formData.has_trial && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.trial_days}
                    onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 0 })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">gün</span>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Özellikler</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(features).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setFeatures({ ...features, [key]: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{key.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Ayarlar</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Aktif</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Herkese açık (yeni tenantlar bu planı görebilir)</span>
              </label>
            </div>
          </div>
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
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Kaydediliyor...' : plan ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}
