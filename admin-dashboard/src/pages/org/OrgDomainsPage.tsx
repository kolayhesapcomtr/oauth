import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Globe, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../services/api';
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
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  Düzenle
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
    </div>
  );
}
