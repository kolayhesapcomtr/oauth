import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { Building2, Users, Globe, Activity, ArrowUpCircle, UserPlus, Mail } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  max_domains: number;
  max_tenants: number;
  max_users: number;
  max_api_calls_per_month: number;
  features: Record<string, any>;
}

export default function OrganizationDetailPage() {
  const { id } = useParams();
  const [organization, setOrganization] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
          <p className="text-gray-600 mt-1">{organization.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-5 w-5" />
            Invite User
          </button>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowUpCircle className="h-5 w-5" />
            Upgrade Plan
          </button>
        </div>
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
        <h2 className="text-lg font-semibold mb-4">Organizasyon Detayları</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Plan</p>
            <p className="font-semibold capitalize">{organization.plan}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Durum</p>
            <p className="font-semibold capitalize">{organization.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sahip E-posta</p>
            <p className="font-semibold">{organization.owner_email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fatura E-posta</p>
            <p className="font-semibold">{organization.billing_email}</p>
          </div>
        </div>
      </div>

      {/* Plan Upgrade Modal */}
      {showUpgradeModal && (
        <PlanUpgradeModal
          organizationId={id!}
          currentPlan={organization.plan}
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={() => {
            setShowUpgradeModal(false);
            loadData();
          }}
        />
      )}

      {/* User Invite Modal */}
      {showInviteModal && (
        <UserInviteModal
          organizationId={id!}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
          }}
        />
      )}
    </div>
  );
}

// Plan Upgrade Modal Component
function PlanUpgradeModal({
  organizationId,
  currentPlan,
  onClose,
  onSuccess,
}: {
  organizationId: string;
  currentPlan: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get('/subscription-plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    setUpgrading(true);
    setError('');

    try {
      await api.put(`/organizations/${organizationId}`, { plan: selectedPlan });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upgrade plan');
    } finally {
      setUpgrading(false);
    }
  };

  const planOrder = ['trial', 'starter', 'business', 'enterprise'];
  const currentPlanIndex = planOrder.indexOf(currentPlan);
  const availablePlans = plans.filter((plan) => {
    const planIndex = planOrder.indexOf(plan.name.toLowerCase());
    return planIndex > currentPlanIndex;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Abonelik Planını Yükselt</h2>
          <p className="text-gray-600 mt-1">Mevcut plan: <span className="font-semibold capitalize">{currentPlan}</span></p>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 rounded-lg p-1 flex gap-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly <span className="text-green-600 text-sm ml-1">(Save 20%)</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : availablePlans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">You're already on the highest plan!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePlans.map((plan) => {
                const price = billingCycle === 'monthly' ? plan.monthly_price : plan.yearly_price;
                const monthlyPrice = billingCycle === 'yearly' ? price / 12 : price;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.name.toLowerCase())}
                    className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                      selectedPlan === plan.name.toLowerCase()
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <h3 className="text-xl font-bold text-gray-900 capitalize">{plan.name}</h3>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">${monthlyPrice.toFixed(0)}</span>
                      <span className="text-gray-600">/month</span>
                      {billingCycle === 'yearly' && (
                        <p className="text-sm text-gray-500 mt-1">
                          ${price}/year (billed annually)
                        </p>
                      )}
                    </div>
                    <ul className="mt-6 space-y-3 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{plan.max_domains === -1 ? 'Sınırsız' : plan.max_domains} Domains</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{plan.max_tenants === -1 ? 'Sınırsız' : plan.max_tenants.toLocaleString()} Tenants</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{plan.max_users === -1 ? 'Sınırsız' : plan.max_users.toLocaleString()} Users</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{plan.max_api_calls_per_month === -1 ? 'Sınırsız' : `${(plan.max_api_calls_per_month / 1000).toFixed(0)}K`} API Calls/mo</span>
                      </li>
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpgrade}
            disabled={!selectedPlan || upgrading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {upgrading ? 'Yükseltiliyor...' : 'Planı Yükselt'}
          </button>
        </div>
      </div>
    </div>
  );
}

// User Invite Modal Component
function UserInviteModal({
  organizationId,
  onClose,
  onSuccess,
}: {
  organizationId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('user');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      // This would call your invite endpoint
      await api.post('/users/invite', {
        organization_id: organizationId,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Davetiye gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Invitation Sent!</h3>
          <p className="text-gray-600">
            An invitation email has been sent to <strong>{email}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Kullanıcı Davet Et</h2>
          <p className="text-gray-600 mt-1">Bu organizasyona katılmak için davetiye gönderin</p>
        </div>

        <form onSubmit={handleInvite} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="John"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="user">Kullanıcı</option>
              <option value="admin">Yönetici</option>
              <option value="viewer">Görüntüleyici</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={sending}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {sending ? 'Gönderiliyor...' : 'Davetiye Gönder'}
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
