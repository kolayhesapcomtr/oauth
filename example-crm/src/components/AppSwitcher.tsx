import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Grid3x3, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export function AppSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { contexts, currentContext } = useAuthStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAppSwitch = (domainUrl: string) => {
    // Navigate to another app with current token
    const protocol = window.location.protocol;
    window.location.href = `${protocol}//${domainUrl}`;
  };

  // Filter out current domain
  const otherDomains = contexts.filter((c) => c.domain_id !== currentContext?.domain_id);

  if (otherDomains.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        <Grid3x3 className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Apps</span>
        <ChevronDown className={clsx(
          'w-4 h-4 text-gray-400 transition-transform',
          isOpen && 'transform rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase">Other Applications</p>
          </div>

          {otherDomains.map((domain) => (
            <button
              key={domain.domain_id}
              onClick={() => handleAppSwitch(domain.domain)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 transition"
            >
              <p className="text-sm font-medium text-gray-900">{domain.domain_name}</p>
              <p className="text-xs text-gray-500">
                {domain.tenants.length} organization{domain.tenants.length !== 1 ? 's' : ''}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
