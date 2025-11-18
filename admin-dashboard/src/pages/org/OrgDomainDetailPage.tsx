import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import {
  ArrowLeft,
  Globe,
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  Code,
  Activity,
  Link as LinkIcon,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Domain {
  id: string;
  name: string;
  slug: string;
  domain: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  client_id: string;
  client_secret: string;
  created_at: string;
}

interface CallbackUrl {
  id: string;
  url: string;
  created_at: string;
}

interface UsageData {
  date: string;
  calls: number;
}

export default function OrgDomainDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [domain, setDomain] = useState<Domain | null>(null);
  const [callbackUrls, setCallbackUrls] = useState<CallbackUrl[]>([]);
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [activeTab, setActiveTab] = useState('react');
  const [newCallbackUrl, setNewCallbackUrl] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [domainRes, callbacksRes, usageRes] = await Promise.all([
        api.get(`/domains/${id}`),
        api.get(`/domains/${id}/callbacks`),
        api.get(`/domains/${id}/usage`),
      ]);

      setDomain(domainRes.data.data || domainRes.data);
      setCallbackUrls(callbacksRes.data.data || callbacksRes.data || []);
      setUsageData(usageRes.data.data || usageRes.data || []);
    } catch (error) {
      console.error('Failed to load domain data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} panoya kopyalandı!`);
  };

  const handleRegenerateSecret = async () => {
    if (!window.confirm('Client secret yeniden oluşturulacak. Mevcut entegrasyonlar çalışmayı durduracak. Devam etmek istiyor musunuz?')) {
      return;
    }

    try {
      const response = await api.post(`/domains/${id}/regenerate-secret`);
      setDomain(response.data.data);
      alert('Client secret başarıyla yenilendi!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Secret yenilenemedi');
    }
  };

  const handleAddCallback = async () => {
    if (!newCallbackUrl.trim()) return;

    try {
      await api.post(`/domains/${id}/callbacks`, { url: newCallbackUrl });
      setNewCallbackUrl('');
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Callback URL eklenemedi');
    }
  };

  const handleDeleteCallback = async (callbackId: string) => {
    if (!window.confirm('Bu callback URL\'i silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/domains/${id}/callbacks/${callbackId}`);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Callback URL silinemedi');
    }
  };

  const handleTestConnection = async () => {
    if (!domain) return;

    setTesting(true);
    setTestResult(null);

    try {
      const response = await api.post(`/domains/${id}/test-connection`);
      setTestResult({
        success: true,
        message: response.data.message || 'Bağlantı başarıyla test edildi!',
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.response?.data?.error || 'Bağlantı testi başarısız',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <p className="text-gray-600">Domain bulunamadı</p>
      </div>
    );
  }

  const codeExamples = {
    react: `// React ile OAuth Entegrasyonu

import { useState } from 'react';

const OAUTH_CONFIG = {
  clientId: '${domain.client_id}',
  redirectUri: 'http://localhost:3000/callback',
  authUrl: 'http://localhost:3000/oauth/authorize',
  tokenUrl: 'http://localhost:3000/oauth/token',
};

function LoginButton() {
  const handleLogin = () => {
    const params = new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state: Math.random().toString(36).substring(7),
    });

    window.location.href = \`\${OAUTH_CONFIG.authUrl}?\${params}\`;
  };

  return (
    <button onClick={handleLogin}>
      ${domain.name} ile Giriş Yap
    </button>
  );
}

// Callback handler
function CallbackPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      fetch(OAUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: OAUTH_CONFIG.redirectUri,
          client_id: OAUTH_CONFIG.clientId,
          client_secret: 'YOUR_CLIENT_SECRET', // Backend'de kullanın!
        }),
      })
      .then(res => res.json())
      .then(data => {
        localStorage.setItem('access_token', data.access_token);
        setUser(data.user);
      });
    }
  }, []);

  return user ? <div>Hoş geldiniz, {user.email}!</div> : <div>Yükleniyor...</div>;
}`,
    nodejs: `// Node.js ile OAuth Entegrasyonu

const express = require('express');
const axios = require('axios');
const app = express();

const OAUTH_CONFIG = {
  clientId: '${domain.client_id}',
  clientSecret: '${domain.client_secret}',
  redirectUri: 'http://localhost:4000/callback',
  authUrl: 'http://localhost:3000/oauth/authorize',
  tokenUrl: 'http://localhost:3000/oauth/token',
  userInfoUrl: 'http://localhost:3000/oauth/userinfo',
};

// Login route
app.get('/login', (req, res) => {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state: Math.random().toString(36).substring(7),
  });

  res.redirect(\`\${OAUTH_CONFIG.authUrl}?\${params}\`);
});

// Callback route
app.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for token
    const tokenResponse = await axios.post(OAUTH_CONFIG.tokenUrl, {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
    });

    const { access_token, refresh_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get(OAUTH_CONFIG.userInfoUrl, {
      headers: { Authorization: \`Bearer \${access_token}\` },
    });

    // Store tokens and user info in session/database
    req.session.user = userResponse.data;
    req.session.accessToken = access_token;
    req.session.refreshToken = refresh_token;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Protected route example
app.get('/api/profile', async (req, res) => {
  const token = req.session.accessToken;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await axios.get(OAUTH_CONFIG.userInfoUrl, {
      headers: { Authorization: \`Bearer \${token}\` },
    });

    res.json(response.data);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});`,
    php: `<?php
// PHP ile OAuth Entegrasyonu

class OAuthClient {
    private $clientId = '${domain.client_id}';
    private $clientSecret = '${domain.client_secret}';
    private $redirectUri = 'http://localhost:8000/callback.php';
    private $authUrl = 'http://localhost:3000/oauth/authorize';
    private $tokenUrl = 'http://localhost:3000/oauth/token';
    private $userInfoUrl = 'http://localhost:3000/oauth/userinfo';

    // Redirect to OAuth provider
    public function login() {
        $params = http_build_query([
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            'response_type' => 'code',
            'scope' => 'openid profile email',
            'state' => bin2hex(random_bytes(16)),
        ]);

        header("Location: {$this->authUrl}?{$params}");
        exit;
    }

    // Handle callback
    public function handleCallback($code) {
        $data = [
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $this->redirectUri,
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
        ];

        $ch = curl_init($this->tokenUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        $tokenData = json_decode($response, true);

        if (isset($tokenData['access_token'])) {
            $_SESSION['access_token'] = $tokenData['access_token'];
            $_SESSION['refresh_token'] = $tokenData['refresh_token'];

            return $this->getUserInfo($tokenData['access_token']);
        }

        return null;
    }

    // Get user info
    public function getUserInfo($accessToken) {
        $ch = curl_init($this->userInfoUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer {$accessToken}",
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }
}

// Usage in login.php
session_start();
$oauth = new OAuthClient();
$oauth->login();

// Usage in callback.php
session_start();
$oauth = new OAuthClient();

if (isset($_GET['code'])) {
    $user = $oauth->handleCallback($_GET['code']);

    if ($user) {
        $_SESSION['user'] = $user;
        header('Location: /dashboard.php');
    } else {
        header('Location: /error.php');
    }
}
?>`,
    curl: `# cURL ile OAuth Test

# 1. Authorization Code Al
curl -X GET "http://localhost:3000/oauth/authorize?\\
  client_id=${domain.client_id}&\\
  redirect_uri=http://localhost:3000/callback&\\
  response_type=code&\\
  scope=openid+profile+email&\\
  state=random_state_string"

# 2. Code ile Token Al
curl -X POST http://localhost:3000/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTHORIZATION_CODE_FROM_STEP_1",
    "redirect_uri": "http://localhost:3000/callback",
    "client_id": "${domain.client_id}",
    "client_secret": "${domain.client_secret}"
  }'

# Response:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "Bearer",
#   "expires_in": 3600
# }

# 3. Kullanıcı Bilgilerini Al
curl -X GET http://localhost:3000/oauth/userinfo \\
  -H "Authorization: Bearer ACCESS_TOKEN_FROM_STEP_2"

# 4. Token Yenile
curl -X POST http://localhost:3000/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "REFRESH_TOKEN_FROM_STEP_2",
    "client_id": "${domain.client_id}",
    "client_secret": "${domain.client_secret}"
  }'

# 5. Token Doğrula
curl -X POST http://localhost:3000/oauth/introspect \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "ACCESS_TOKEN",
    "client_id": "${domain.client_id}",
    "client_secret": "${domain.client_secret}"
  }'`,
  };

  const tabs = [
    { id: 'react', name: 'React', icon: Code },
    { id: 'nodejs', name: 'Node.js', icon: Code },
    { id: 'php', name: 'PHP', icon: Code },
    { id: 'curl', name: 'cURL', icon: Code },
  ];

  const totalCalls = usageData.reduce((sum, item) => sum + item.calls, 0);
  const avgCalls = usageData.length > 0 ? Math.round(totalCalls / usageData.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/org/domains')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Domain'lere Geri Dön
        </button>

        <div className="flex items-center gap-4">
          {domain.logo_url ? (
            <img src={domain.logo_url} alt={domain.name} className="h-16 w-16 rounded" />
          ) : (
            <div className="h-16 w-16 bg-indigo-100 rounded flex items-center justify-center">
              <Globe className="h-8 w-8 text-indigo-600" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{domain.name}</h1>
            <p className="text-gray-600">{domain.domain}</p>
          </div>
        </div>
      </div>

      {/* API Credentials */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Key className="h-6 w-6 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">API Kimlik Bilgileri</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={domain.client_id}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(domain.client_id, 'Client ID')}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Secret
            </label>
            <div className="flex gap-2">
              <input
                type={showSecret ? 'text' : 'password'}
                value={domain.client_secret}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {showSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              <button
                onClick={() => copyToClipboard(domain.client_secret, 'Client Secret')}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Copy className="h-5 w-5" />
              </button>
              <button
                onClick={handleRegenerateSecret}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ⚠️ Client secret'ı sadece backend'de kullanın. Asla frontend kodunda paylaşmayın!
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">OAuth Endpoint'leri</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Authorization:</span>
                <code className="ml-2 text-blue-900">http://localhost:3000/oauth/authorize</code>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Token:</span>
                <code className="ml-2 text-blue-900">http://localhost:3000/oauth/token</code>
              </div>
              <div>
                <span className="text-blue-700 font-medium">UserInfo:</span>
                <code className="ml-2 text-blue-900">http://localhost:3000/oauth/userinfo</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Guide */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Code className="h-6 w-6 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Entegrasyon Kılavuzu</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Code Example */}
        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{codeExamples[activeTab as keyof typeof codeExamples]}</code>
          </pre>
          <button
            onClick={() => copyToClipboard(codeExamples[activeTab as keyof typeof codeExamples], 'Kod')}
            className="absolute top-4 right-4 px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors text-sm"
          >
            Kopyala
          </button>
        </div>
      </div>

      {/* Test Connection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="h-6 w-6 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Bağlantı Testi</h2>
        </div>

        <p className="text-gray-600 mb-4">
          Domain yapılandırmanızı ve API erişimini test edin.
        </p>

        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Zap className="h-5 w-5" />
          {testing ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
        </button>

        {testResult && (
          <div
            className={`mt-4 px-4 py-3 rounded-lg ${
              testResult.success
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span>{testResult.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* API Usage Statistics */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="h-6 w-6 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">API Kullanım İstatistikleri</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Toplam Çağrı (7 Gün)</p>
            <p className="text-2xl font-bold text-blue-900">{totalCalls.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Ortalama (Günlük)</p>
            <p className="text-2xl font-bold text-green-900">{avgCalls.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Bugün</p>
            <p className="text-2xl font-bold text-purple-900">
              {usageData.length > 0 ? usageData[usageData.length - 1].calls.toLocaleString() : 0}
            </p>
          </div>
        </div>

        {usageData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="calls" stroke="#4F46E5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Henüz kullanım verisi yok
          </div>
        )}
      </div>

      {/* Callback URLs */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <LinkIcon className="h-6 w-6 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Callback URL'leri</h2>
        </div>

        <p className="text-gray-600 mb-4">
          OAuth akışında kullanılacak yönlendirme URL'lerini tanımlayın.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="url"
            value={newCallbackUrl}
            onChange={(e) => setNewCallbackUrl(e.target.value)}
            placeholder="https://uygulamaniz.com/callback"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleAddCallback}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Ekle
          </button>
        </div>

        {callbackUrls.length > 0 ? (
          <div className="space-y-2">
            {callbackUrls.map((callback) => (
              <div
                key={callback.id}
                className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-mono text-sm">{callback.url}</span>
                </div>
                <button
                  onClick={() => handleDeleteCallback(callback.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Henüz callback URL tanımlanmamış
          </div>
        )}
      </div>
    </div>
  );
}
