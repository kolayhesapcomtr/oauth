import { useState } from 'react';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Platform usage and analytics</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <BarChart3 className="h-24 w-24 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Analytics Dashboard Coming Soon
        </h2>
        <p className="text-gray-600">
          Advanced analytics and reporting features are under development.
        </p>
      </div>
    </div>
  );
}
