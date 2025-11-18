import { query, getClient } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/password';

export class UserManagementService {
  async assignUserToTenant(
    userId: string,
    tenantId: string,
    roleId: string,
    invitedBy?: string
  ): Promise<any> {
    const result = await query(
      `INSERT INTO user_tenant_roles (user_id, tenant_id, role_id, invited_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, tenant_id, role_id) DO UPDATE
       SET is_active = true
       RETURNING *`,
      [userId, tenantId, roleId, invitedBy || null]
    );
    return result.rows[0];
  }

  async removeUserFromTenant(userId: string, tenantId: string): Promise<void> {
    await query(
      'DELETE FROM user_tenant_roles WHERE user_id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );
  }

  async updateUserRole(userId: string, tenantId: string, newRoleId: string): Promise<any> {
    const result = await query(
      `UPDATE user_tenant_roles
       SET role_id = $3
       WHERE user_id = $1 AND tenant_id = $2
       RETURNING *`,
      [userId, tenantId, newRoleId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found in tenant');
    }

    return result.rows[0];
  }

  async deactivateUserInTenant(userId: string, tenantId: string): Promise<void> {
    await query(
      'UPDATE user_tenant_roles SET is_active = false WHERE user_id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );
  }

  async reactivateUserInTenant(userId: string, tenantId: string): Promise<void> {
    await query(
      'UPDATE user_tenant_roles SET is_active = true WHERE user_id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );
  }

  async createInvitation(data: {
    tenant_id: string;
    role_id: string;
    email: string;
    invited_by: string;
    expires_in_days?: number;
  }): Promise<any> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expires_in_days || 7));

    const result = await query(
      `INSERT INTO invitations (tenant_id, role_id, email, token, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.tenant_id, data.role_id, data.email, token, data.invited_by, expiresAt]
    );

    return result.rows[0];
  }

  async getInvitation(token: string): Promise<any> {
    const result = await query(
      `SELECT
        i.*,
        t.name as tenant_name,
        t.domain_id,
        d.name as domain_name,
        d.domain as domain_url,
        r.name as role_name
       FROM invitations i
       JOIN tenants t ON i.tenant_id = t.id
       JOIN domains d ON t.domain_id = d.id
       JOIN roles r ON i.role_id = r.id
       WHERE i.token = $1 AND i.is_used = false AND i.expires_at > NOW()`,
      [token]
    );

    return result.rows[0] || null;
  }

  async acceptInvitation(
    token: string,
    userData: {
      email: string;
      password: string;
      first_name?: string;
      last_name?: string;
    }
  ): Promise<{ user: any; invitation: any }> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Get invitation
      const invitationResult = await client.query(
        `SELECT * FROM invitations
         WHERE token = $1 AND is_used = false AND expires_at > NOW()`,
        [token]
      );

      if (invitationResult.rows.length === 0) {
        throw new Error('Invalid or expired invitation');
      }

      const invitation = invitationResult.rows[0];

      if (invitation.email.toLowerCase() !== userData.email.toLowerCase()) {
        throw new Error('Email does not match invitation');
      }

      // Check if user exists
      let user;
      const existingUserResult = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUserResult.rows.length > 0) {
        user = existingUserResult.rows[0];
      } else {
        // Create new user
        const passwordHash = await hashPassword(userData.password);
        const newUserResult = await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, is_email_verified)
           VALUES ($1, $2, $3, $4, true)
           RETURNING *`,
          [userData.email, passwordHash, userData.first_name, userData.last_name]
        );
        user = newUserResult.rows[0];
      }

      // Assign user to tenant
      await client.query(
        `INSERT INTO user_tenant_roles (user_id, tenant_id, role_id, invited_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, tenant_id, role_id) DO NOTHING`,
        [user.id, invitation.tenant_id, invitation.role_id, invitation.invited_by]
      );

      // Mark invitation as used
      await client.query(
        'UPDATE invitations SET is_used = true, accepted_at = NOW() WHERE id = $1',
        [invitation.id]
      );

      await client.query('COMMIT');

      return { user, invitation };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listInvitations(tenantId: string): Promise<any[]> {
    const result = await query(
      `SELECT
        i.*,
        r.name as role_name,
        u.email as invited_by_email,
        u.first_name || ' ' || u.last_name as invited_by_name
       FROM invitations i
       JOIN roles r ON i.role_id = r.id
       LEFT JOIN users u ON i.invited_by = u.id
       WHERE i.tenant_id = $1
       ORDER BY i.created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    await query('DELETE FROM invitations WHERE id = $1', [invitationId]);
  }

  async getUserAccess(userId: string): Promise<any[]> {
    const result = await query(
      `SELECT
        utr.*,
        t.name as tenant_name,
        t.slug as tenant_slug,
        d.name as domain_name,
        d.slug as domain_slug,
        d.domain as domain_url,
        r.name as role_name,
        r.slug as role_slug
       FROM user_tenant_roles utr
       JOIN tenants t ON utr.tenant_id = t.id
       JOIN domains d ON t.domain_id = d.id
       JOIN roles r ON utr.role_id = r.id
       WHERE utr.user_id = $1
       ORDER BY d.name, t.name`,
      [userId]
    );
    return result.rows;
  }

  async getAllUsers(filters?: {
    domain_id?: string;
    tenant_id?: string;
    organization_id?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<any[]> {
    let sql = `
      SELECT DISTINCT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.is_active,
        u.is_email_verified,
        u.last_login_at,
        u.created_at
      FROM users u
    `;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.domain_id || filters?.tenant_id || filters?.organization_id) {
      sql += `
        JOIN user_tenant_roles utr ON u.id = utr.user_id
        JOIN tenants t ON utr.tenant_id = t.id
      `;

      if (filters.domain_id) {
        conditions.push(`t.domain_id = $${paramCount++}`);
        values.push(filters.domain_id);
      }

      if (filters.tenant_id) {
        conditions.push(`utr.tenant_id = $${paramCount++}`);
        values.push(filters.tenant_id);
      }

      if (filters.organization_id) {
        conditions.push(`t.organization_id = $${paramCount++}`);
        values.push(filters.organization_id);
      }
    }

    if (filters?.is_active !== undefined) {
      conditions.push(`u.is_active = $${paramCount++}`);
      values.push(filters.is_active);
    }

    if (filters?.search) {
      conditions.push(`(u.email ILIKE $${paramCount} OR u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY u.created_at DESC';

    const result = await query(sql, values);
    return result.rows;
  }
}

export default new UserManagementService();
