import { useState, useEffect } from 'react';
import { Settings, Mail, Shield, Database, CreditCard, Save } from 'lucide-react';
import { api } from '../lib/api';

interface PlatformSettings {
  platform_name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_from_name: string;
  smtp_from_email: string;
  frontend_url: string;
  allowed_origins: string;
  jwt_expires_in: string;
  jwt_refresh_expires_in: string;
}

interface SystemInfo {
  version: string;
  database_status: string;
  total_organizations: number;
  total_domains: number;
  total_users: number;
  total_tenants: number;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: 'OAuth Platform',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_from_name: '',
    smtp_from_email: '',
    frontend_url: '',
    allowed_origins: '',
    jwt_expires_in: '24h',
    jwt_refresh_expires_in: '7d',
  });
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
    loadSystemInfo();
  }, []);

  const loadSettings = async () => {
    try {
      // In a real app, this would fetch from an API
      // For now, we'll use environment-based defaults
      setSettings({
        platform_name: 'OAuth Platform',
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: '',
        smtp_from_name: 'OAuth Platform',
        smtp_from_email: 'noreply@oauth.local',
        frontend_url: 'http://localhost:5173',
        allowed_origins: 'http://localhost:5173,http://localhost:3001,http://localhost:3002',
        jwt_expires_in: '24h',
        jwt_refresh_expires_in: '7d',
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadSystemInfo = async () => {
    try {
      const response = await api.get('/stats');
      setSystemInfo({
        version: '1.0.0',
        database_status: 'Bağlı',
        total_organizations: response.data.total_organizations || 0,
        total_domains: response.data.total_domains || 0,
        total_users: response.data.total_users || 0,
        total_tenants: response.data.total_tenants || 0,
      });
    } catch (error) {
      console.error('Failed to load system info:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // In a real app, this would save to the backend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Ayarlar kaydedilemedi' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'Genel', icon: Settings },
    { id: 'email', name: 'E-posta', icon: Mail },
    { id: 'security', name: 'Güvenlik', icon: Shield },
    { id: 'system', name: 'Sistem', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600 mt-1">Platform yapılandırmasını ve ayarlarını yönetin</p>
      </div>

      {message.text && (
        <div
          className={`px-4 py-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        {/* Tabs */}
        <div className="border-b">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={settings.platform_name}
                  onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frontend URL
                </label>
                <input
                  type="url"
                  value={settings.frontend_url}
                  onChange={(e) => setSettings({ ...settings, frontend_url: e.target.value })}
                  placeholder="http://localhost:5173"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Base URL for the frontend application
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed Origins (CORS)
                </label>
                <textarea
                  value={settings.allowed_origins}
                  onChange={(e) => setSettings({ ...settings, allowed_origins: e.target.value })}
                  rows={3}
                  placeholder="http://localhost:5173,http://localhost:3001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Comma-separated list of allowed origins
                </p>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Email configuration requires server restart to take effect. Update these values in
                  your .env file.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                <input
                  type="text"
                  value={settings.smtp_host}
                  onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                <input
                  type="number"
                  value={settings.smtp_port}
                  onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
                  placeholder="587"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Kullanıcı</label>
                <input
                  type="text"
                  value={settings.smtp_user}
                  onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                  placeholder="your-email@gmail.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Name
                </label>
                <input
                  type="text"
                  value={settings.smtp_from_name}
                  onChange={(e) => setSettings({ ...settings, smtp_from_name: e.target.value })}
                  placeholder="OAuth Platform"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Email
                </label>
                <input
                  type="email"
                  value={settings.smtp_from_email}
                  onChange={(e) => setSettings({ ...settings, smtp_from_email: e.target.value })}
                  placeholder="noreply@oauth.local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700">
                  Security settings require server restart. Modify these values in your .env file.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JWT Access Token Expiry
                </label>
                <input
                  type="text"
                  value={settings.jwt_expires_in}
                  onChange={(e) => setSettings({ ...settings, jwt_expires_in: e.target.value })}
                  placeholder="24h"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Format: number + unit (s=seconds, m=minutes, h=hours, d=days)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JWT Refresh Token Expiry
                </label>
                <input
                  type="text"
                  value={settings.jwt_refresh_expires_in}
                  onChange={(e) =>
                    setSettings({ ...settings, jwt_refresh_expires_in: e.target.value })
                  }
                  placeholder="7d"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Recommended: 7d to 30d for better security
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Güvenlik En İyi Uygulamaları</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Use strong, randomly generated JWT_SECRET (minimum 32 characters)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Production'da HTTPS'i etkinleştirin</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>JWT secret'larını düzenli olarak değiştirin</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Keep access token expiry short (1-24 hours)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Implement rate limiting on authentication endpoints</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistem Bilgisi</h3>
                {systemInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Versiyon</p>
                      <p className="text-2xl font-bold text-gray-900">{systemInfo.version}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Veritabanı Durumu</p>
                      <p className="text-2xl font-bold text-green-600">
                        {systemInfo.database_status}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Organizasyonlar</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {systemInfo.total_organizations}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Domains</p>
                      <p className="text-2xl font-bold text-gray-900">{systemInfo.total_domains}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Kiracılar</p>
                      <p className="text-2xl font-bold text-gray-900">{systemInfo.total_tenants}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Users</p>
                      <p className="text-2xl font-bold text-gray-900">{systemInfo.total_users}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Loading system information...</p>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Veritabanı Yönetimi</h3>
                <div className="space-y-3">
                  <button className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Backup Database
                  </button>
                  <button className="w-full md:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-0 md:ml-3">
                    View Logs
                  </button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ortam</h3>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
                  <div>NODE_ENV: development</div>
                  <div>API_VERSION: v1</div>
                  <div>DATABASE: PostgreSQL 15</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        {activeTab !== 'system' && (
          <div className="border-t px-6 py-4 bg-gray-50">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Saving...' : 'Ayarları Kaydet'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
