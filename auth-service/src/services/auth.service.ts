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

  // Email Verification
  async verifyEmail(token: string): Promise<void> {
    const result = await query(
      `SELECT * FROM email_verification_tokens
       WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired verification token');
    }

    const verificationToken = result.rows[0];

    // Update user as verified
    await query(
      `UPDATE users
       SET is_email_verified = true, email_verified_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [verificationToken.user_id]
    );

    // Delete the verification token
    await query('DELETE FROM email_verification_tokens WHERE token = $1', [token]);
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.is_email_verified) {
      throw new Error('Email is already verified');
    }

    // Generate verification token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    // Store token
    await query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET token = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP`,
      [userId, token, expiresAt]
    );

    // TODO: Send email with verification link
    // For now, just log it
    console.log(`Verification link: http://localhost:3001/verify-email/${token}`);
  }

  // Password Reset
  async forgotPassword(email: string): Promise<void> {
    const user = await userService.findByEmail(email);
    if (!user) {
      // Don't reveal that email doesn't exist (security best practice)
      return;
    }

    // Generate password reset token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    // Store token
    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET token = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP`,
      [user.id, token, expiresAt]
    );

    // TODO: Send email with reset link
    // For now, just log it
    console.log(`Password reset link: http://localhost:3001/reset-password/${token}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const result = await query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const resetToken = result.rows[0];

    // Hash new password
    const password_hash = await hashPassword(newPassword);

    // Update user password
    await query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [password_hash, resetToken.user_id]
    );

    // Delete the reset token
    await query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);

    // Revoke all refresh tokens for this user (force re-login)
    await query('UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1', [resetToken.user_id]);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Incorrect current password');
    }

    // Hash new password
    const password_hash = await hashPassword(newPassword);

    // Update password
    await query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [password_hash, userId]
    );
  }
}

export default new AuthService();
