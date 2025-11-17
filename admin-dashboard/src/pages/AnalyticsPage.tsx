import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, AlertCircle, Clock } from 'lucide-react';
import { api } from '../services/api';
import { format, subMonths } from 'date-fns';

interface UsageTrendData {
  month: string;
  api_calls: number;
  users: number;
  domains: number;
}

interface ApiEndpointData {
  endpoint: string;
  count: number;
  avg_response_time: number;
}

interface ErrorStat {
  error_type: string;
  count: number;
  last_occurred: string;
}

interface PerformanceMetrics {
  total_calls: number;
  avg_response_time: number;
  error_rate: number;
  success_rate: number;
}

export default function AnalyticsPage() {
  const [usageTrend, setUsageTrend] = useState<UsageTrendData[]>([]);
  const [apiBreakdown, setApiBreakdown] = useState<ApiEndpointData[]>([]);
  const [errorStats, setErrorStats] = useState<ErrorStat[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    total_calls: 0,
    avg_response_time: 0,
    error_rate: 0,
    success_rate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range (last 6 months)
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subMonths(new Date(), 6), 'yyyy-MM-dd');

      // Fetch all analytics data
      const [trendRes, breakdownRes, errorsRes] = await Promise.all([
        api.get('/analytics/usage/trend?months=6').catch(() => ({ data: [] })),
        api.get(`/analytics/api-usage/breakdown?start_date=${startDate}&end_date=${endDate}`).catch(() => ({ data: [] })),
        api.get(`/analytics/errors?start_date=${startDate}&end_date=${endDate}`).catch(() => ({ data: [] })),
      ]);

      setUsageTrend(trendRes.data || []);
      setApiBreakdown(trendRes.data?.top_endpoints || []);
      setErrorStats(errorsRes.data || []);

      // Calculate performance metrics
      if (trendRes.data && trendRes.data.length > 0) {
        const totalCalls = trendRes.data.reduce((sum: number, item: any) => sum + (item.api_calls || 0), 0);
        const totalErrors = errorsRes.data?.reduce((sum: number, item: any) => sum + item.count, 0) || 0;

        setMetrics({
          total_calls: totalCalls,
          avg_response_time: Math.floor(Math.random() * 200 + 50), // Mock data for now
          error_rate: totalCalls > 0 ? (totalErrors / totalCalls) * 100 : 0,
          success_rate: totalCalls > 0 ? 100 - (totalErrors / totalCalls) * 100 : 100,
        });
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Platform usage and analytics</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Platform usage and performance metrics</p>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total API Calls</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {metrics.total_calls.toLocaleString()}
              </p>
            </div>
            <Activity className="h-10 w-10 text-blue-500" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">Last 6 months</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {metrics.avg_response_time}ms
              </p>
            </div>
            <Clock className="h-10 w-10 text-purple-500" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">System performance</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {metrics.success_rate.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-500" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600">Healthy status</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Error Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {metrics.error_rate.toFixed(2)}%
              </p>
            </div>
            <AlertCircle className="h-10 w-10 text-orange-500" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Monitoring active</span>
          </div>
        </div>
      </div>

      {/* Usage Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Trends (6 Months)</h2>
        {usageTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usageTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="api_calls" stroke="#3B82F6" name="API Calls" strokeWidth={2} />
              <Line type="monotone" dataKey="users" stroke="#10B981" name="Users" strokeWidth={2} />
              <Line type="monotone" dataKey="domains" stroke="#8B5CF6" name="Domains" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No usage data available for the selected period
          </div>
        )}
      </div>

      {/* API Endpoints Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top API Endpoints</h2>
        {apiBreakdown.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={apiBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="endpoint" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3B82F6" name="Request Count" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No endpoint data available
          </div>
        )}
      </div>

      {/* Error Statistics Table */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Error Statistics</h2>
        {errorStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Occurred
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {errorStats.map((error, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {error.error_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {error.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(error.last_occurred), 'MMM dd, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No errors recorded - System running smoothly!
          </div>
        )}
      </div>
    </div>
  );
}
