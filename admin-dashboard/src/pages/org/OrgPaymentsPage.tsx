import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { CreditCard, Search, Download, RefreshCw, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  amount: number;
  currency: string;
  platform_commission: number;
  organization_net_amount: number;
  payment_provider_id: string;
  provider_payment_id?: string;
  status: string;
  payment_method?: string;
  card_last_4?: string;
  card_brand?: string;
  payer_email: string;
  payer_name: string;
  paid_at?: string;
  failed_at?: string;
  failure_reason?: string;
  created_at: string;
}

export default function OrgPaymentsPage() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payment/transactions');
      setPayments(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (paymentId: string) => {
    const reason = prompt('İade nedeni (opsiyonel):');
    if (reason === null) return; // User cancelled

    if (!window.confirm('Bu ödemeyi iade etmek istediğinizden emin misiniz?')) return;

    try {
      await api.post(`/payment/transactions/${paymentId}/refund`, { reason: reason || undefined });
      await loadPayments();
    } catch (error: any) {
      alert(error.response?.data?.error || 'İade işlemi başarısız oldu');
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.payer_name?.toLowerCase().includes(search.toLowerCase()) ||
      payment.payer_email?.toLowerCase().includes(search.toLowerCase()) ||
      payment.provider_payment_id?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-gray-100 text-gray-700',
    };

    const icons = {
      completed: <CheckCircle className="h-4 w-4" />,
      pending: <Clock className="h-4 w-4" />,
      failed: <XCircle className="h-4 w-4" />,
      refunded: <RefreshCw className="h-4 w-4" />,
    };

    const labels = {
      completed: 'Tamamlandı',
      pending: 'Beklemede',
      failed: 'Başarısız',
      refunded: 'İade Edildi',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols = { TRY: '₺', USD: '$', EUR: '€' };
    const symbol = symbols[currency as keyof typeof symbols] || currency;
    return `${symbol}${(amount / 100).toFixed(2)}`;
  };

  // Calculate totals
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCommission = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.platform_commission, 0);

  const totalNet = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.organization_net_amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ödemeler</h1>
          <p className="text-gray-600 mt-1">Tenant ödemelerinizi görüntüleyin ve yönetin</p>
        </div>
        <button
          onClick={loadPayments}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="h-5 w-5" />
          Yenile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600 mb-1">Toplam Gelir</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue, 'TRY')}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600 mb-1">Platform Komisyonu</p>
          <p className="text-2xl font-bold text-red-600">-{formatCurrency(totalCommission, 'TRY')}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600 mb-1">Net Kazanç</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalNet, 'TRY')}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600 mb-1">Toplam İşlem</p>
          <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Ödeme ara (isim, email, işlem no)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="completed">Tamamlandı</option>
          <option value="pending">Beklemede</option>
          <option value="failed">Başarısız</option>
          <option value="refunded">İade Edildi</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Komisyon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Henüz ödeme kaydı yok</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {payment.provider_payment_id?.slice(0, 16) || payment.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500">{payment.payment_provider_id}</p>
                        {payment.card_last_4 && (
                          <p className="text-xs text-gray-500">
                            {payment.card_brand} •••• {payment.card_last_4}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.payer_name}</p>
                        <p className="text-xs text-gray-500">{payment.payer_email}</p>
                        {payment.tenant_name && (
                          <p className="text-xs text-gray-500">{payment.tenant_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-red-600">
                        -{formatCurrency(payment.platform_commission, payment.currency)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(payment.organization_net_amount, payment.currency)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(payment.status)}
                      {payment.failure_reason && (
                        <p className="text-xs text-red-600 mt-1">{payment.failure_reason}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {payment.paid_at
                          ? format(new Date(payment.paid_at), 'dd MMM yyyy')
                          : format(new Date(payment.created_at), 'dd MMM yyyy')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.paid_at
                          ? format(new Date(payment.paid_at), 'HH:mm')
                          : format(new Date(payment.created_at), 'HH:mm')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payment.status === 'completed' && (
                        <button
                          onClick={() => handleRefund(payment.id)}
                          className="text-sm text-red-600 hover:text-red-900 font-medium"
                        >
                          İade Et
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPayments.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Toplam {filteredPayments.length} işlem gösteriliyor</span>
          <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-900 font-medium">
            <Download className="h-4 w-4" />
            Excel'e Aktar
          </button>
        </div>
      )}
    </div>
  );
}
