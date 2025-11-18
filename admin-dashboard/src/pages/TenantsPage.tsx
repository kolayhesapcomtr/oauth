import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Building, Search } from 'lucide-react';

interface Tenant {
  id: string;
  domain_id: string;
  domain_name: string;
  name: string;
  slug: string;
  is_active: boolean;
  user_count: number;
  created_at: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const response = await api.get('/tenants');
      setTenants(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to load tenants:', error);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(search.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(search.toLowerCase()) ||
    tenant.domain_name?.toLowerCase().includes(search.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold text-gray-900">Kiracılar</h1>
        <p className="text-gray-600 mt-1">Tüm kiracıları görüntüleyin ve yönetin</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Kiracı ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map((tenant) => (
          <div key={tenant.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <Building className="h-8 w-8 text-primary-600" />
              <span className={`px-2 py-1 text-xs font-semibold rounded ${tenant.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {tenant.is_active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{tenant.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{tenant.slug}</p>
            <div className="text-sm text-gray-500">
              <div>Domain: {tenant.domain_name}</div>
              <div>{tenant.user_count || 0} kullanıcı</div>
            </div>
          </div>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Building className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Kiracı bulunamadı</h2>
          <p className="text-gray-600">Arama kriterlerinizi değiştirin</p>
        </div>
      )}
    </div>
  );
}
