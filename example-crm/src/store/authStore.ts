import { create } from 'zustand';
import { authApi } from '../lib/api';
import { decodeToken } from '../lib/jwt';
import {
  User,
  DomainContext,
  CurrentContext,
  TenantInfo,
  AuthContextType,
} from '../types';

interface AuthState extends AuthContextType {
  setAuth: (
    token: string,
    refreshToken: string,
    user: User,
    contexts: DomainContext[],
    currentContext?: CurrentContext
  ) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refresh_token'),
  contexts: [],
  currentContext: null,
  currentTenant: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (token, refreshToken, user, contexts, currentContext) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refresh_token', refreshToken);

    // Decode token to get contexts and current context
    const payload = decodeToken(token);
    const tokenContexts = payload?.contexts || contexts;
    const tokenCurrentContext = payload?.current_context || currentContext;

    // Find current tenant info
    let currentTenant: TenantInfo | null = null;
    if (tokenCurrentContext) {
      const domain = tokenContexts.find(
        (d) => d.domain_id === tokenCurrentContext.domain_id
      );
      if (domain) {
        currentTenant =
          domain.tenants.find(
            (t) => t.tenant_id === tokenCurrentContext.tenant_id
          ) || null;
      }
    }

    set({
      token,
      refreshToken,
      user,
      contexts: tokenContexts,
      currentContext: tokenCurrentContext || null,
      currentTenant,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    set({
      user: null,
      token: null,
      refreshToken: null,
      contexts: [],
      currentContext: null,
      currentTenant: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await authApi.login(email, password);

      if (response.token) {
        // Auto-selected context
        get().setAuth(
          response.token,
          response.refresh_token,
          response.user,
          []
        );
      } else {
        // Multiple contexts, need to select
        // For now, auto-select first one
        const firstDomain = response.available_contexts[0];
        const firstTenant = firstDomain.tenants[0];

        const selectResponse = await authApi.selectContext(
          firstDomain.domain_id,
          firstTenant.tenant_id
        );

        get().setAuth(
          selectResponse.token,
          selectResponse.refresh_token,
          response.user,
          []
        );
      }
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(
        error.response?.data?.error || 'Login failed'
      );
    }
  },

  logout: async () => {
    try {
      const { refreshToken } = get();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      get().clearAuth();
    }
  },

  switchTenant: async (tenantId: string) => {
    try {
      set({ isLoading: true });
      const response = await authApi.switchContext(tenantId);

      const { user, contexts } = get();
      if (user) {
        get().setAuth(response.token, get().refreshToken || '', user, contexts);
      }
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(
        error.response?.data?.error || 'Failed to switch tenant'
      );
    }
  },

  hasPermission: (permission: string) => {
    const { currentTenant } = get();
    if (!currentTenant) return false;
    return currentTenant.permissions.includes(permission);
  },

  hasRole: (role: string) => {
    const { currentTenant } = get();
    if (!currentTenant) return false;
    return currentTenant.roles.includes(role);
  },
}));

// Initialize auth state from token
const token = localStorage.getItem('token');
if (token) {
  const payload = decodeToken(token);
  if (payload && payload.exp && Date.now() < payload.exp * 1000) {
    // Token is valid, restore state
    authApi.me()
      .then((data) => {
        useAuthStore.getState().setAuth(
          token,
          localStorage.getItem('refresh_token') || '',
          data.user,
          data.contexts,
          data.current_context
        );
      })
      .catch(() => {
        useAuthStore.getState().clearAuth();
      });
  } else {
    useAuthStore.getState().clearAuth();
  }
} else {
  useAuthStore.getState().setLoading(false);
}
