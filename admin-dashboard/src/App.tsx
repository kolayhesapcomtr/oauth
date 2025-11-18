import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrganizationsPage from './pages/OrganizationsPage';
import OrganizationDetailPage from './pages/OrganizationDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DomainsPage from './pages/DomainsPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';
import OrganizationLayout from './components/OrganizationLayout';
import OrgDashboardPage from './pages/org/OrgDashboardPage';
import OrgDomainsPage from './pages/org/OrgDomainsPage';
import OrgDomainDetailPage from './pages/org/OrgDomainDetailPage';
import OrgUsersPage from './pages/org/OrgUsersPage';
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

      {/* Super Admin Routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route path="/organizations/:id" element={<OrganizationDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/domains" element={<DomainsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Organization Panel Routes */}
      <Route path="/org" element={<ProtectedRoute><OrganizationLayout /></ProtectedRoute>}>
        <Route index element={<OrgDashboardPage />} />
        <Route path="domains" element={<OrgDomainsPage />} />
        <Route path="domains/:id" element={<OrgDomainDetailPage />} />
        <Route path="users" element={<OrgUsersPage />} />
        <Route path="settings" element={<OrgSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
