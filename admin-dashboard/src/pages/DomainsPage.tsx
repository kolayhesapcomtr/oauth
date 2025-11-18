import { useState, useEffect } from 'react';
import { Globe, Plus, Search, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { format } from 'date-fns';

interface Domain {
  id: string;
  organization_id: string;
  organization_name?: string;
  name: string;
  slug: string;
  domain: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  settings: Record<string, any>;
  tenant_count?: number;
  created_at: string;
  updated_at: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedOrg]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [domainsRes, orgsRes] = await Promise.all([
        api.get(selectedOrg === 'all' ? '/domains' : `/domains?organization_id=${selectedOrg}`),
        api.get('/organizations'),
      ]);
      setDomains(domainsRes.data);
      setOrganizations(orgsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this domain?')) return;

    try {
      await api.delete(`/domains/${id}`);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete domain');
    }
  };

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain);
    setShowEditModal(true);
  };

  const filteredDomains = domains.filter(
    (domain) =>
      domain.name.toLowerCase().includes(search.toLowerCase()) ||
      domain.slug.toLowerCase().includes(search.toLowerCase()) ||
      domain.domain.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Domains</h1>
          <p className="text-gray-600 mt-1">Uygulama domain'lerini yönetin</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Domains</h1>
          <p className="text-gray-600 mt-1">Organizasyonlardaki uygulama domain'lerini yönetin</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Domain
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tüm Organizasyonlar</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Domains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDomains.map((domain) => (
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
                    <span className="text-gray-500">Tenants:</span>
                    <span className="text-gray-900 font-semibold">{domain.tenant_count}</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Created {format(new Date(domain.created_at), 'MMM dd, yyyy')}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(domain)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
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

      {filteredDomains.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Globe className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Domain bulunamadı</h2>
          <p className="text-gray-600">
            {search ? 'Farklı bir arama terimi deneyin' : 'Create your first domain to get started'}
          </p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <DomainModal
          organizations={organizations}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingDomain && (
        <DomainModal
          domain={editingDomain}
          organizations={organizations}
          onClose={() => {
            setShowEditModal(false);
            setEditingDomain(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingDomain(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Domain Create/Edit Modal Component
function DomainModal({
  domain,
  organizations,
  onClose,
  onSuccess,
}: {
  domain?: Domain;
  organizations: Organization[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    organization_id: domain?.organization_id || '',
    name: domain?.name || '',
    slug: domain?.slug || '',
    domain: domain?.domain || '',
    description: domain?.description || '',
    logo_url: domain?.logo_url || '',
    is_active: domain?.is_active ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (domain) {
        await api.put(`/domains/${domain.id}`, formData);
      } else {
        await api.post('/domains', formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save domain');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {domain ? 'Edit Domain' : 'Domain Oluştur'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization *
            </label>
            <select
              value={formData.organization_id}
              onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
              required
              disabled={!!domain}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              <option value="">Select organization...</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="CRM System"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              placeholder="crm"
              pattern="[a-z0-9-]+"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">Sadece küçük harf, rakam ve tire</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain *</label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              required
              placeholder="crm.example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Brief description of the domain..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
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
              Active
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving...' : domain ? 'Update Domain' : 'Domain Oluştur'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
