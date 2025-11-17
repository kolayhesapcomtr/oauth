import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { ChevronDown, Building } from 'lucide-react';
import clsx from 'clsx';

export function TenantSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { contexts, currentContext, currentTenant, switchTenant } = useAuthStore();

  // Get current domain's tenants
  const currentDomain = contexts.find((c) => c.domain_id === currentContext?.domain_id);
  const tenants = currentDomain?.tenants || [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = async (tenantId: string) => {
    if (tenantId === currentContext?.tenant_id) {
      setIsOpen(false);
      return;
    }

    try {
      await switchTenant(tenantId);
      setIsOpen(false);
      window.location.reload(); // Reload to refresh data
    } catch (error: any) {
      alert(error.message || 'Failed to switch tenant');
    }
  };

  if (tenants.length <= 1) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        <Building className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentTenant?.tenant_name || 'Select Tenant'}
        </span>
        <ChevronDown className={clsx(
          'w-4 h-4 text-gray-400 transition-transform',
          isOpen && 'transform rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase">Switch Organization</p>
          </div>

          {tenants.map((tenant) => {
            const isActive = tenant.tenant_id === currentContext?.tenant_id;

            return (
              <button
                key={tenant.tenant_id}
                onClick={() => handleSwitch(tenant.tenant_id)}
                className={clsx(
                  'w-full text-left px-3 py-2 hover:bg-gray-50 transition',
                  isActive && 'bg-indigo-50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={clsx(
                      'text-sm font-medium',
                      isActive ? 'text-indigo-600' : 'text-gray-900'
                    )}>
                      {tenant.tenant_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Role: {tenant.roles.join(', ')}
                    </p>
                  </div>

                  {isActive && (
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
