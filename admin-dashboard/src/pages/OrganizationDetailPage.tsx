import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { Building2, Users, Globe, Activity } from 'lucide-react';

export default function OrganizationDetailPage() {
  const { id } = useParams();
  const [organization, setOrganization] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [orgRes, usageRes] = await Promise.all([
        api.get(`/organizations/${id}`),
        api.get(`/organizations/${id}/usage`)
      ]);
      setOrganization(orgRes.data.data);
      setUsage(usageRes.data.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !organization || !usage) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
        <p className="text-gray-600 mt-1">{organization.slug}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{usage.current_domains}</p>
              <p className="text-sm text-gray-600">of {usage.max_domains === -1 ? '∞' : usage.max_domains} domains</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${usage.domains_percentage}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{usage.current_tenants}</p>
              <p className="text-sm text-gray-600">of {usage.max_tenants === -1 ? '∞' : usage.max_tenants} tenants</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${usage.tenants_percentage}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{usage.current_users}</p>
              <p className="text-sm text-gray-600">of {usage.max_users === -1 ? '∞' : usage.max_users} users</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${usage.users_percentage}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{usage.current_api_calls.toLocaleString()}</p>
              <p className="text-sm text-gray-600">API calls/month</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${usage.api_calls_percentage}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Organization Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Plan</p>
            <p className="font-semibold capitalize">{organization.plan}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="font-semibold capitalize">{organization.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Owner Email</p>
            <p className="font-semibold">{organization.owner_email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Billing Email</p>
            <p className="font-semibold">{organization.billing_email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
