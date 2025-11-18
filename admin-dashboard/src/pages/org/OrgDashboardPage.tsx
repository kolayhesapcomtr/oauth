import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { Globe, Users, Activity, CreditCard, TrendingUp } from 'lucide-react';

interface OrganizationUsage {
  current_domains: number;
  max_domains: number;
  domains_percentage: number;
  current_tenants: number;
  max_tenants: number;
  tenants_percentage: number;
  current_users: number;
  max_users: number;
  users_percentage: number;
  current_api_calls: number;
  max_api_calls_per_month: number;
  api_calls_percentage: number;
}

interface Organization {
  id: string;
  name: string;
  plan: string;
  status: string;
  trial_ends_at: string | null;
}

export default function OrgDashboardPage() {
  const { user } = useAuthStore();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [usage, setUsage] = useState<OrganizationUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.organization_id) return;

    try {
      setLoading(true);
      const [orgRes, usageRes] = await Promise.all([
        api.get(`/organizations/${user.organization_id}`),
        api.get(`/organizations/${user.organization_id}/usage`)
      ]);
      setOrganization(orgRes.data.data);
      setUsage(usageRes.data.data);
    } catch (error) {
      console.error('Failed to load organization data:', error);
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

  if (!organization || !usage) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <p className="text-gray-600">Organizasyon bilgileri yüklenemedi</p>
      </div>
    );
  }

  const usageCards = [
    {
      name: "Domain'ler",
      current: usage.current_domains,
      max: usage.max_domains,
      percentage: usage.domains_percentage,
      icon: Globe,
      color: 'bg-blue-500',
    },
    {
      name: 'Kullanıcılar',
      current: usage.current_users,
      max: usage.max_users,
      percentage: usage.users_percentage,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      name: 'API Çağrıları (Aylık)',
      current: usage.current_api_calls,
      max: usage.max_api_calls_per_month,
      percentage: usage.api_calls_percentage,
      icon: Activity,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
        <div className="flex items-center gap-4 mt-2">
          <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full capitalize">
            {organization.plan} Planı
          </span>
          <span className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${
            organization.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {organization.status === 'active' ? 'Aktif' : organization.status}
          </span>
          {organization.trial_ends_at && (
            <span className="text-sm text-gray-600">
              Deneme {new Date(organization.trial_ends_at).toLocaleDateString('tr-TR')} tarihinde sona eriyor
            </span>
          )}
        </div>
      </div>

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {usageCards.map((card) => (
          <div key={card.name} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">{card.name}</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {card.current.toLocaleString()}
                  <span className="text-sm text-gray-500 font-normal">
                    {' '}/ {card.max === -1 ? '∞' : card.max.toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={card.color.replace('bg-', 'bg-').replace('-500', '-500')}
                style={{ width: `${Math.min(card.percentage, 100)}%` }}
                className="h-2 rounded-full"
              />
            </div>
            {card.percentage > 80 && (
              <p className="text-xs text-orange-600 mt-2">
                ⚠️ Limite yaklaşıyorsunuz
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Hızlı İşlemler
          </h2>
          <div className="space-y-3">
            <a
              href="/org/domains"
              className="block px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Domain Ekle</p>
                  <p className="text-sm text-gray-600">Yeni bir domain oluşturun</p>
                </div>
                <Globe className="h-5 w-5 text-gray-400" />
              </div>
            </a>
            <a
              href="/org/users"
              className="block px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Kullanıcı Davet Et</p>
                  <p className="text-sm text-gray-600">Ekip üyesi ekleyin</p>
                </div>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Plan Detayları
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Domain Limiti:</span>
              <span className="font-semibold">
                {usage.max_domains === -1 ? 'Sınırsız' : usage.max_domains}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Kullanıcı Limiti:</span>
              <span className="font-semibold">
                {usage.max_users === -1 ? 'Sınırsız' : usage.max_users.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Aylık API Limit:</span>
              <span className="font-semibold">
                {usage.max_api_calls_per_month === -1
                  ? 'Sınırsız'
                  : usage.max_api_calls_per_month.toLocaleString()}
              </span>
            </div>
            {organization.plan !== 'enterprise' && (
              <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <TrendingUp className="h-4 w-4" />
                Planı Yükselt
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
