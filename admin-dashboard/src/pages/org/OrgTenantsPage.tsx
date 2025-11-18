import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { Building, Plus } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  user_count: number;
  created_at: string;
}

export default function OrgTenantsPage() {
  const { user } = useAuthStore();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    if (!user?.organization_id) return;

    try {
      const response = await api.get(`/tenants?organization_id=${user.organization_id}`);
      setTenants(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to load tenants:', error);
      setTenants([]);
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-900">Kiracılar</h1>
          <p className="text-gray-600 mt-1">Domain'lerinizdeki kiracıları görüntüleyin</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          <Plus className="h-5 w-5" />
          Kiracı Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <Building className="h-8 w-8 text-indigo-600" />
              <span className={`px-2 py-1 text-xs font-semibold rounded ${tenant.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {tenant.is_active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{tenant.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{tenant.slug}</p>
            <div className="text-sm text-gray-500">
              {tenant.user_count || 0} kullanıcı
            </div>
          </div>
        ))}
      </div>

      {tenants.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Building className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Henüz kiracı yok</h2>
          <p className="text-gray-600 mb-6">İlk kiracınızı oluşturarak başlayın</p>
          <button className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
            <Plus className="h-5 w-5" />
            Kiracı Ekle
          </button>
        </div>
      )}
    </div>
  );
}
