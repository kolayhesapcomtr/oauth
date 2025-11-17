import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { TenantSwitcher } from './TenantSwitcher';
import { AppSwitcher } from './AppSwitcher';
import {
  Building2,
  Users,
  FileText,
  Settings,
  LogOut,
  User,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { user, currentTenant, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and App Name */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CRM System</h1>
                {currentTenant && (
                  <p className="text-xs text-gray-500">
                    {currentTenant.tenant_name} • {currentTenant.roles.join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Tenant Switcher */}
              <TenantSwitcher />

              {/* App Switcher */}
              <AppSwitcher />

              {/* User Menu */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.first_name || user?.email}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar and Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-3">
            <nav className="space-y-1">
              <NavItem icon={<Building2 />} label="Dashboard" active />
              <NavItem icon={<Users />} label="Customers" />
              <NavItem icon={<FileText />} label="Invoices" />
              <NavItem icon={<Settings />} label="Settings" />
            </nav>
          </aside>

          {/* Main Content */}
          <main className="col-span-9">{children}</main>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <a
      href="#"
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
        active
          ? 'bg-indigo-50 text-indigo-600 font-medium'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span>{label}</span>
    </a>
  );
}
