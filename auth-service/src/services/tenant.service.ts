import { query } from '../config/database';
import { Tenant } from '../types';

export class TenantService {
  async list(domainId?: string): Promise<Tenant[]> {
    if (domainId) {
      const result = await query(
        'SELECT * FROM tenants WHERE domain_id = $1 ORDER BY created_at DESC',
        [domainId]
      );
      return result.rows;
    }

    const result = await query('SELECT * FROM tenants ORDER BY created_at DESC');
    return result.rows;
  }

  async findById(id: string): Promise<Tenant | null> {
    const result = await query('SELECT * FROM tenants WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findBySlug(domainId: string, slug: string): Promise<Tenant | null> {
    const result = await query(
      'SELECT * FROM tenants WHERE domain_id = $1 AND slug = $2',
      [domainId, slug]
    );
    return result.rows[0] || null;
  }

  async create(data: {
    domain_id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    settings?: Record<string, any>;
  }): Promise<Tenant> {
    const result = await query(
      `INSERT INTO tenants (domain_id, name, slug, description, logo_url, settings)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.domain_id,
        data.name,
        data.slug,
        data.description || null,
        data.logo_url || null,
        JSON.stringify(data.settings || {}),
      ]
    );
    return result.rows[0];
  }

  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      logo_url?: string;
      is_active?: boolean;
      settings?: Record<string, any>;
    }
  ): Promise<Tenant> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.slug !== undefined) {
      fields.push(`slug = $${paramCount++}`);
      values.push(data.slug);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.logo_url !== undefined) {
      fields.push(`logo_url = $${paramCount++}`);
      values.push(data.logo_url);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.is_active);
    }
    if (data.settings !== undefined) {
      fields.push(`settings = $${paramCount++}`);
      values.push(JSON.stringify(data.settings));
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const result = await query(
      `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Tenant not found');
    }

    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    const result = await query('DELETE FROM tenants WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new Error('Tenant not found');
    }
  }

  async getTenantUsers(tenantId: string): Promise<any[]> {
    const result = await query(
      `SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.is_active,
        r.id as role_id,
        r.name as role_name,
        r.slug as role_slug,
        utr.joined_at
       FROM users u
       JOIN user_tenant_roles utr ON u.id = utr.user_id
       JOIN roles r ON utr.role_id = r.id
       WHERE utr.tenant_id = $1 AND utr.is_active = true
       ORDER BY utr.joined_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  async getTenantStats(tenantId: string): Promise<{
    total_users: number;
    active_users: number;
  }> {
    const result = await query(
      `SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE u.is_active = true) as active_users
       FROM user_tenant_roles utr
       JOIN users u ON utr.user_id = u.id
       WHERE utr.tenant_id = $1 AND utr.is_active = true`,
      [tenantId]
    );
    return result.rows[0];
  }
}

export default new TenantService();
