import { Globe } from 'lucide-react';

export default function DomainsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Domains</h1>
        <p className="text-gray-600 mt-1">Manage application domains</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <Globe className="h-24 w-24 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Domain Management Coming Soon
        </h2>
        <p className="text-gray-600">
          Domain management features are under development.
        </p>
      </div>
    </div>
  );
}
