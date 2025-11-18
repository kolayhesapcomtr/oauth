import { query, getClient } from '../config/database';
import { Domain } from '../types';

export class DomainService {
  async list(organizationId?: string): Promise<Domain[]> {
    if (organizationId) {
      const result = await query(
        'SELECT * FROM domains WHERE organization_id = $1 ORDER BY created_at DESC',
        [organizationId]
      );
      return result.rows;
    }
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
    organization_id: string;
    name: string;
    slug: string;
    domain: string;
    description?: string;
    logo_url?: string;
    settings?: Record<string, any>;
  }): Promise<Domain> {
    const result = await query(
      `INSERT INTO domains (organization_id, name, slug, domain, description, logo_url, settings)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.organization_id,
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

  async getByOrganization(organizationId: string): Promise<Domain[]> {
    const result = await query(
      `SELECT d.*,
        (SELECT COUNT(*) FROM tenants WHERE domain_id = d.id AND is_active = true) as tenant_count
       FROM domains d
       WHERE d.organization_id = $1 AND d.is_active = true
       ORDER BY d.created_at DESC`,
      [organizationId]
    );
    return result.rows;
  }

  async countByOrganization(organizationId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM domains WHERE organization_id = $1 AND is_active = true',
      [organizationId]
    );
    return parseInt(result.rows[0].count);
  }

  // Callback URL Management
  async getCallbacks(domainId: string): Promise<any[]> {
    const result = await query(
      'SELECT id, domain_id, url, created_at FROM domain_callback_urls WHERE domain_id = $1 ORDER BY created_at DESC',
      [domainId]
    );
    return result.rows;
  }

  async addCallback(domainId: string, url: string): Promise<any> {
    const result = await query(
      'INSERT INTO domain_callback_urls (domain_id, url) VALUES ($1, $2) RETURNING *',
      [domainId, url]
    );
    return result.rows[0];
  }

  async deleteCallback(callbackId: string): Promise<void> {
    await query('DELETE FROM domain_callback_urls WHERE id = $1', [callbackId]);
  }

  // Client Secret Management
  async regenerateSecret(domainId: string): Promise<Domain> {
    const crypto = require('crypto');
    const newSecret = crypto.randomBytes(32).toString('hex');

    const result = await query(
      'UPDATE domains SET client_secret = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newSecret, domainId]
    );

    return result.rows[0];
  }

  // Usage Statistics (Last 7 days)
  async getUsageStats(domainId: string): Promise<any[]> {
    const result = await query(
      `SELECT
        DATE(created_at) as date,
        COUNT(*) as calls
       FROM api_usage_logs
       WHERE domain_id = $1
       AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [domainId]
    );

    // Fill in missing days with 0
    const stats: any[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const existing = result.rows.find(row => row.date.toISOString().split('T')[0] === dateStr);
      stats.push({
        date: dateStr,
        calls: existing ? parseInt(existing.calls) : 0
      });
    }

    return stats;
  }
}

export default new DomainService();
