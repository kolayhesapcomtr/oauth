export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface TenantInfo {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  roles: string[];
  permissions: string[];
}

export interface DomainContext {
  domain: string;
  domain_id: string;
  domain_name: string;
  tenants: TenantInfo[];
}

export interface CurrentContext {
  domain_id: string;
  tenant_id: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  contexts: DomainContext[];
  current_context?: CurrentContext;
}

export interface LoginResponse {
  message: string;
  user: User;
  available_contexts: Array<{
    domain_id: string;
    domain_name: string;
    domain_url: string;
    domain_slug: string;
    tenants: Array<{
      tenant_id: string;
      tenant_name: string;
      tenant_slug: string;
      role: string;
      role_slug: string;
    }>;
  }>;
  token?: string;
  refresh_token?: string;
  needs_context_selection: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  contexts: DomainContext[];
  currentContext: CurrentContext | null;
  currentTenant: TenantInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}
