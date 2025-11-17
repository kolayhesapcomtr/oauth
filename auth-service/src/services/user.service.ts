import { query } from '../config/database';
import { User, UserContext, UserPermission } from '../types';

export class UserService {
  async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(data: {
    email: string;
    password_hash: string;
    first_name?: string;
    last_name?: string;
  }): Promise<User> {
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.email, data.password_hash, data.first_name, data.last_name]
    );
    return result.rows[0];
  }

  async updateLastLogin(userId: string): Promise<void> {
    await query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }

  async getUserContexts(userId: string, domainUrl?: string): Promise<UserContext[]> {
    let sql = `SELECT * FROM v_user_contexts WHERE user_id = $1`;
    const params: any[] = [userId];

    if (domainUrl) {
      sql += ` AND domain_url = $2`;
      params.push(domainUrl);
    }

    sql += ` ORDER BY domain_name, tenant_name`;

    const result = await query(sql, params);
    return result.rows;
  }

  async getUserPermissions(userId: string, tenantId: string): Promise<UserPermission[]> {
    const result = await query(
      `SELECT * FROM v_user_permissions
       WHERE user_id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );
    return result.rows;
  }

  async hasPermission(
    userId: string,
    tenantId: string,
    permissionSlug: string
  ): Promise<boolean> {
    const result = await query(
      `SELECT EXISTS(
        SELECT 1 FROM v_user_permissions
        WHERE user_id = $1 AND tenant_id = $2 AND permission_slug = $3
      ) as has_permission`,
      [userId, tenantId, permissionSlug]
    );
    return result.rows[0]?.has_permission || false;
  }
}

export default new UserService();
