import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../utils/jwt';
import userService from './user.service';
import { User, UserContext } from '../types';

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }): Promise<User> {
    // Check if user already exists
    const existingUser = await userService.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const password_hash = await hashPassword(data.password);

    // Create user
    const user = await userService.create({
      email: data.email,
      password_hash,
      first_name: data.first_name,
      last_name: data.last_name,
    });

    return user;
  }

  async login(email: string, password: string, domainUrl?: string): Promise<{
    user: User;
    contexts: UserContext[];
    token?: string;
    refreshToken?: string;
  }> {
    // Find user
    const user = await userService.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('User account is inactive');
    }

    // Get user contexts (filtered by domain if provided)
    const contexts = await userService.getUserContexts(user.id, domainUrl);

    if (contexts.length === 0) {
      throw new Error('User has no access to any domain or tenant');
    }

    // Update last login
    await userService.updateLastLogin(user.id);

    // If only one context, auto-select it and generate token
    let token: string | undefined;
    let refreshToken: string | undefined;

    if (contexts.length === 1 || domainUrl) {
      const tokenPayload = await this.buildTokenPayload(user, contexts);

      // Auto-select first context
      if (contexts.length > 0) {
        tokenPayload.current_context = {
          domain_id: contexts[0].domain_id,
          tenant_id: contexts[0].tenant_id,
        };
      }

      token = generateAccessToken(tokenPayload);
      refreshToken = generateRefreshToken(user.id);

      // Store refresh token
      await this.storeRefreshToken(user.id, refreshToken);
    }

    return { user, contexts, token, refreshToken };
  }

  async selectContext(
    userId: string,
    domainId: string,
    tenantId: string
  ): Promise<{ token: string; refreshToken: string }> {
    // Get all contexts
    const contexts = await userService.getUserContexts(userId);

    // Verify user has access to this context
    const hasAccess = contexts.some(
      (ctx) => ctx.domain_id === domainId && ctx.tenant_id === tenantId
    );

    if (!hasAccess) {
      throw new Error('User does not have access to this context');
    }

    const user = await userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Build token payload
    const tokenPayload = await this.buildTokenPayload(user, contexts);
    tokenPayload.current_context = { domain_id: domainId, tenant_id: tenantId };

    const token = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(userId);

    await this.storeRefreshToken(userId, refreshToken);

    return { token, refreshToken };
  }

  async switchContext(
    userId: string,
    tenantId: string
  ): Promise<{ token: string }> {
    const contexts = await userService.getUserContexts(userId);

    const targetContext = contexts.find((ctx) => ctx.tenant_id === tenantId);
    if (!targetContext) {
      throw new Error('User does not have access to this tenant');
    }

    const user = await userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const tokenPayload = await this.buildTokenPayload(user, contexts);
    tokenPayload.current_context = {
      domain_id: targetContext.domain_id,
      tenant_id: targetContext.tenant_id,
    };

    const token = generateAccessToken(tokenPayload);

    return { token };
  }

  private async buildTokenPayload(user: User, contexts: UserContext[]): Promise<TokenPayload> {
    // Group contexts by domain
    const domainMap = new Map<string, {
      domain: string;
      domain_id: string;
      domain_name: string;
      tenants: Array<{
        tenant_id: string;
        tenant_name: string;
        tenant_slug: string;
        roles: string[];
        permissions: string[];
      }>;
    }>();

    for (const ctx of contexts) {
      if (!domainMap.has(ctx.domain_id)) {
        domainMap.set(ctx.domain_id, {
          domain: ctx.domain_url,
          domain_id: ctx.domain_id,
          domain_name: ctx.domain_name,
          tenants: [],
        });
      }

      const domain = domainMap.get(ctx.domain_id)!;

      // Check if tenant already exists
      let tenant = domain.tenants.find((t) => t.tenant_id === ctx.tenant_id);
      if (!tenant) {
        // Get permissions for this tenant
        const permissions = await userService.getUserPermissions(user.id, ctx.tenant_id);

        tenant = {
          tenant_id: ctx.tenant_id,
          tenant_name: ctx.tenant_name,
          tenant_slug: ctx.tenant_slug,
          roles: [ctx.role_slug],
          permissions: permissions.map((p) => p.permission_slug),
        };
        domain.tenants.push(tenant);
      } else {
        // Add role if not already present
        if (!tenant.roles.includes(ctx.role_slug)) {
          tenant.roles.push(ctx.role_slug);
        }
      }
    }

    return {
      sub: user.id,
      email: user.email,
      contexts: Array.from(domainMap.values()),
    };
  }

  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );
  }

  async refreshAccessToken(refreshToken: string): Promise<{ token: string }> {
    // Verify refresh token exists and is valid
    const result = await query(
      `SELECT * FROM refresh_tokens
       WHERE token = $1 AND is_revoked = false AND expires_at > CURRENT_TIMESTAMP`,
      [refreshToken]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired refresh token');
    }

    const tokenRecord = result.rows[0];
    const userId = tokenRecord.user_id;

    const user = await userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const contexts = await userService.getUserContexts(userId);
    const tokenPayload = await this.buildTokenPayload(user, contexts);

    const token = generateAccessToken(tokenPayload);

    return { token };
  }

  async logout(refreshToken: string): Promise<void> {
    await query(
      'UPDATE refresh_tokens SET is_revoked = true WHERE token = $1',
      [refreshToken]
    );
  }
}

export default new AuthService();
