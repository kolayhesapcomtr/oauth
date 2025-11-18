import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Globe, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { format } from 'date-fns';

interface Domain {
  id: string;
  name: string;
  slug: string;
  domain: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  tenant_count?: number;
  created_at: string;
}

export default function OrgDomainsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    if (!user?.organization_id) return;

    try {
      setLoading(true);
      const response = await api.get(`/domains?organization_id=${user.organization_id}`);
      setDomains(response.data);
    } catch (error) {
      console.error('Failed to load domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu domain\'i silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/domains/${id}`);
      await loadDomains();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Domain silinemedi');
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
          <h1 className="text-3xl font-bold text-gray-900">Domain'ler</h1>
          <p className="text-gray-600 mt-1">Organizasyonunuzun domain'lerini yönetin</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Domain Ekle
        </button>
      </div>

      {/* Domains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {domains.map((domain) => (
          <div key={domain.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {domain.logo_url ? (
                    <img src={domain.logo_url} alt={domain.name} className="h-12 w-12 rounded" />
                  ) : (
                    <div className="h-12 w-12 bg-indigo-100 rounded flex items-center justify-center">
                      <Globe className="h-6 w-6 text-indigo-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{domain.name}</h3>
                    <p className="text-sm text-gray-500">{domain.slug}</p>
                  </div>
                </div>
                {domain.is_active ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Domain:</span>
                  <span className="text-gray-900 font-mono">{domain.domain}</span>
                </div>
                {domain.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{domain.description}</p>
                )}
                {domain.tenant_count !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Kiracılar:</span>
                    <span className="text-gray-900 font-semibold">{domain.tenant_count}</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Oluşturulma: {format(new Date(domain.created_at), 'dd MMM yyyy', { locale: require('date-fns/locale/tr') })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/org/domains/${domain.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  Detaylar
                </button>
                <button
                  onClick={() => handleDelete(domain.id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {domains.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Globe className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Henüz domain yok</h2>
          <p className="text-gray-600 mb-6">İlk domain'inizi oluşturarak başlayın</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Domain Ekle
          </button>
        </div>
      )}

      {/* Create Domain Modal */}
      {showCreateModal && (
        <DomainCreateModal
          organizationId={user?.organization_id || ''}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadDomains();
          }}
        />
      )}
    </div>
  );
}

// Domain Create Modal Component
function DomainCreateModal({
  organizationId,
  onClose,
  onSuccess,
}: {
  organizationId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    description: '',
    logo_url: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.post('/domains', {
        ...formData,
        organization_id: organizationId,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Domain oluşturulamadı');
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Yeni Domain Oluştur</h2>
          <p className="text-gray-600 mt-1">OAuth entegrasyonu için yeni bir domain ekleyin</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domain İsmi *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="CRM Sistemi"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              placeholder="crm-sistemi"
              pattern="[a-z0-9-]+"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">Sadece küçük harf, rakam ve tire kullanın</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domain URL *
            </label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              required
              placeholder="crm.sirketim.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">OAuth için kullanılacak domain adresi</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Domain hakkında kısa açıklama..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo URL
            </label>
            <input
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://sirketim.com/logo.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Aktif (Domain hemen kullanıma hazır olsun)
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Oluşturuluyor...' : 'Domain Oluştur'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
