import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Platform settings and configuration</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <Settings className="h-24 w-24 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Settings Panel Coming Soon
        </h2>
        <p className="text-gray-600">
          Settings and configuration features are under development.
        </p>
      </div>
    </div>
  );
}
