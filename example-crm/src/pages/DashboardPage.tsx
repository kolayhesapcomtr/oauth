import { useAuthStore } from '../store/authStore';
import { Layout } from '../components/Layout';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export function DashboardPage() {
  const { user, currentTenant, hasPermission } = useAuthStore();

  const canViewCustomers = hasPermission('customers-read');
  const canViewInvoices = hasPermission('invoices-read');
  const canCreateCustomers = hasPermission('customers-create');
  const canCreateInvoices = hasPermission('invoices-create');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.first_name || user?.email}!
          </h1>
          <p className="text-gray-600 mt-1">
            You're viewing <span className="font-semibold">{currentTenant?.tenant_name}</span> as{' '}
            <span className="font-semibold">{currentTenant?.roles.join(', ')}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Customers"
            value="1,234"
            trend="+12%"
            color="blue"
          />
          <StatCard
            icon={<FileText className="w-6 h-6" />}
            label="Active Invoices"
            value="89"
            trend="+5%"
            color="green"
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Revenue"
            value="$45,678"
            trend="+18%"
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Growth"
            value="23%"
            trend="+3%"
            color="orange"
          />
        </div>

        {/* Permissions Demo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Permissions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PermissionItem
              label="View Customers"
              granted={canViewCustomers}
              permission="customers-read"
            />
            <PermissionItem
              label="Create Customers"
              granted={canCreateCustomers}
              permission="customers-create"
            />
            <PermissionItem
              label="View Invoices"
              granted={canViewInvoices}
              permission="invoices-read"
            />
            <PermissionItem
              label="Create Invoices"
              granted={canCreateInvoices}
              permission="invoices-create"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ActionButton
              label="Add Customer"
              disabled={!canCreateCustomers}
              tooltip={!canCreateCustomers ? 'You need customers-create permission' : undefined}
            />
            <ActionButton
              label="Create Invoice"
              disabled={!canCreateInvoices}
              tooltip={!canCreateInvoices ? 'You need invoices-create permission' : undefined}
            />
            <ActionButton
              label="View Reports"
              disabled={false}
            />
          </div>
        </div>

        {/* Role & Tenant Info */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <h2 className="text-lg font-semibold mb-4">Current Context</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-indigo-100 text-sm">Organization</p>
              <p className="font-semibold text-lg">{currentTenant?.tenant_name}</p>
            </div>
            <div>
              <p className="text-indigo-100 text-sm">Your Roles</p>
              <p className="font-semibold text-lg">{currentTenant?.roles.join(', ')}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-indigo-100 text-sm">Available Permissions ({currentTenant?.permissions.length})</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {currentTenant?.permissions.slice(0, 6).map((perm) => (
                <span
                  key={perm}
                  className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs"
                >
                  {perm}
                </span>
              ))}
              {(currentTenant?.permissions.length || 0) > 6 && (
                <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs">
                  +{(currentTenant?.permissions.length || 0) - 6} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <span className="text-sm font-medium text-green-600">{trend}</span>
      </div>
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function PermissionItem({
  label,
  granted,
  permission,
}: {
  label: string;
  granted: boolean;
  permission: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        {granted ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">{permission}</p>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  disabled,
  tooltip,
}: {
  label: string;
  disabled: boolean;
  tooltip?: string;
}) {
  return (
    <button
      disabled={disabled}
      title={tooltip}
      className={`px-4 py-3 rounded-lg font-medium transition ${
        disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      }`}
    >
      {label}
    </button>
  );
}
