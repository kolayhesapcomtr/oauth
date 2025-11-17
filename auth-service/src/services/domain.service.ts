import { query, getClient } from '../config/database';
import { Domain } from '../types';

export class DomainService {
  async list(): Promise<Domain[]> {
    const result = await query('SELECT * FROM domains ORDER BY created_at DESC');
    return result.rows;
  }

  async findById(id: string): Promise<Domain | null> {
    const result = await query('SELECT * FROM domains WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findBySlug(slug: string): Promise<Domain | null> {
    const result = await query('SELECT * FROM domains WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  }

  async findByDomain(domain: string): Promise<Domain | null> {
    const result = await query('SELECT * FROM domains WHERE domain = $1', [domain]);
    return result.rows[0] || null;
  }

  async create(data: {
    name: string;
    slug: string;
    domain: string;
    description?: string;
    logo_url?: string;
    settings?: Record<string, any>;
  }): Promise<Domain> {
    const result = await query(
      `INSERT INTO domains (name, slug, domain, description, logo_url, settings)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.name,
        data.slug,
        data.domain,
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
      domain?: string;
      description?: string;
      logo_url?: string;
      is_active?: boolean;
      settings?: Record<string, any>;
    }
  ): Promise<Domain> {
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
    if (data.domain !== undefined) {
      fields.push(`domain = $${paramCount++}`);
      values.push(data.domain);
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
      `UPDATE domains SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Domain not found');
    }

    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    const result = await query('DELETE FROM domains WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new Error('Domain not found');
    }
  }

  async getDomainStats(domainId: string): Promise<{
    total_tenants: number;
    active_tenants: number;
    total_users: number;
    total_roles: number;
    total_permissions: number;
  }> {
    const result = await query(
      `SELECT
        (SELECT COUNT(*) FROM tenants WHERE domain_id = $1) as total_tenants,
        (SELECT COUNT(*) FROM tenants WHERE domain_id = $1 AND is_active = true) as active_tenants,
        (SELECT COUNT(DISTINCT utr.user_id) FROM user_tenant_roles utr
         JOIN tenants t ON utr.tenant_id = t.id
         WHERE t.domain_id = $1) as total_users,
        (SELECT COUNT(*) FROM roles WHERE domain_id = $1) as total_roles,
        (SELECT COUNT(*) FROM permissions WHERE domain_id = $1) as total_permissions`,
      [domainId]
    );
    return result.rows[0];
  }
}

export default new DomainService();
