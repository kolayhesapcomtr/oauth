import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import OrganizationsPage from './pages/OrganizationsPage';
import OrganizationDetailPage from './pages/OrganizationDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DomainsPage from './pages/DomainsPage';
import TenantsPage from './pages/TenantsPage';
import PermissionsPage from './pages/PermissionsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';
import OrganizationLayout from './components/OrganizationLayout';
import OrgDashboardPage from './pages/org/OrgDashboardPage';
import OrgDomainsPage from './pages/org/OrgDomainsPage';
import OrgDomainDetailPage from './pages/org/OrgDomainDetailPage';
import OrgUsersPage from './pages/org/OrgUsersPage';
import OrgTenantsPage from './pages/org/OrgTenantsPage';
import OrgSettingsPage from './pages/org/OrgSettingsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      checkAuth();
    }
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Super Admin Routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route path="/organizations/:id" element={<OrganizationDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/domains" element={<DomainsPage />} />
        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/permissions" element={<PermissionsPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Organization Panel Routes */}
      <Route path="/org" element={<ProtectedRoute><OrganizationLayout /></ProtectedRoute>}>
        <Route index element={<OrgDashboardPage />} />
        <Route path="domains" element={<OrgDomainsPage />} />
        <Route path="domains/:id" element={<OrgDomainDetailPage />} />
        <Route path="users" element={<OrgUsersPage />} />
        <Route path="tenants" element={<OrgTenantsPage />} />
        <Route path="settings" element={<OrgSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
