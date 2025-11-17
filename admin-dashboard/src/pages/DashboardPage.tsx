import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Building2, Globe, Users, Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface PlatformStats {
  total_organizations: number;
  total_domains: number;
  total_tenants: number;
  total_users: number;
  api_calls_today: number;
  plan_distribution: Array<{ plan: string; count: number }>;
  revenue: {
    total: number;
    invoices: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/analytics/platform');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
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

  const statCards = [
    {
      name: 'Organizations',
      value: stats?.total_organizations || 0,
      icon: Building2,
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up',
    },
    {
      name: 'Domains',
      value: stats?.total_domains || 0,
      icon: Globe,
      color: 'bg-green-500',
      change: '+8%',
      trend: 'up',
    },
    {
      name: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'bg-purple-500',
      change: '+24%',
      trend: 'up',
    },
    {
      name: 'API Calls Today',
      value: stats?.api_calls_today || 0,
      icon: Activity,
      color: 'bg-orange-500',
      change: '-5%',
      trend: 'down',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform overview and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{stat.change}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {stat.value.toLocaleString()}
            </h3>
            <p className="text-gray-600 text-sm mt-1">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Plan Distribution */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Plan Distribution
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats?.plan_distribution.map((plan) => (
            <div key={plan.plan} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">{plan.count}</p>
              <p className="text-sm text-gray-600 capitalize">{plan.plan}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Total Revenue
          </h2>
          <p className="text-4xl font-bold text-green-600">
            ${stats?.revenue.total.toLocaleString() || 0}
          </p>
          <p className="text-gray-600 text-sm mt-2">
            From {stats?.revenue.invoices || 0} paid invoices
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Platform Activity
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Organizations</span>
              <span className="font-semibold">{stats?.total_organizations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Domains</span>
              <span className="font-semibold">{stats?.total_domains}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tenants</span>
              <span className="font-semibold">{stats?.total_tenants}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
