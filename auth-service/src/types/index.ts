export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  email_verified_at: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Domain {
  id: string;
  name: string;
  slug: string;
  domain: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Tenant {
  id: string;
  domain_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  domain_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Permission {
  id: string;
  domain_id: string | null;
  name: string;
  slug: string;
  resource: string;
  action: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserContext {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  domain_id: string;
  domain_name: string;
  domain_slug: string;
  domain_url: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  role_id: string;
  role_name: string;
  role_slug: string;
  access_is_active: boolean;
}

export interface UserPermission {
  user_id: string;
  tenant_id: string;
  domain_id: string;
  permission_id: string;
  permission_name: string;
  permission_slug: string;
  resource: string;
  action: string;
}

export interface AuthRequest extends Request {
  user?: User;
  context?: {
    domain_id: string;
    tenant_id: string;
  };
}
