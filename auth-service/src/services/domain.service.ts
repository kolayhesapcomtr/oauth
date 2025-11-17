import pool from '../config/database';

export interface Domain {
  id: string;
  organization_id: string;
  name: string;
  domain: string;
  description?: string;
  logo_url?: string;
  settings: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDomainInput {
  organization_id: string;
  name: string;
  domain: string;
  description?: string;
  logo_url?: string;
  settings?: Record<string, any>;
}

class DomainService {
  /**
   * Create a new domain
   */
  async createDomain(data: CreateDomainInput): Promise<Domain> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if domain already exists
      const domainCheck = await client.query(
        'SELECT id FROM domains WHERE domain = $1',
        [data.domain]
      );

      if (domainCheck.rows.length > 0) {
        throw new Error('Domain already exists');
      }

      // Create domain
      const result = await client.query(
        `INSERT INTO domains (organization_id, name, domain, description, logo_url, settings)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.organization_id,
          data.name,
          data.domain,
          data.description,
          data.logo_url,
          JSON.stringify(data.settings || {})
        ]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get domain by ID
   */
  async getDomainById(domainId: string): Promise<Domain | null> {
    const result = await pool.query(
      'SELECT * FROM domains WHERE id = $1 AND is_active = true',
      [domainId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get domains by organization
   */
  async getDomainsByOrganization(organizationId: string) {
    const result = await pool.query(
      `SELECT
         d.*,
         (SELECT COUNT(*) FROM tenants WHERE domain_id = d.id AND is_active = true) as tenant_count
       FROM domains d
       WHERE d.organization_id = $1 AND d.is_active = true
       ORDER BY d.created_at DESC`,
      [organizationId]
    );

    return result.rows;
  }

  /**
   * Update domain
   */
  async updateDomain(
    domainId: string,
    data: Partial<CreateDomainInput>
  ): Promise<Domain> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.logo_url !== undefined) {
      fields.push(`logo_url = $${paramCount++}`);
      values.push(data.logo_url);
    }
    if (data.settings !== undefined) {
      fields.push(`settings = $${paramCount++}`);
      values.push(JSON.stringify(data.settings));
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(domainId);

    const result = await pool.query(
      `UPDATE domains SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Domain not found');
    }

    return result.rows[0];
  }

  /**
   * Delete domain (soft delete)
   */
  async deleteDomain(domainId: string): Promise<void> {
    await pool.query(
      'UPDATE domains SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [domainId]
    );
  }

  /**
   * Get domain statistics
   */
  async getDomainStats(domainId: string) {
    const tenantsResult = await pool.query(
      'SELECT COUNT(*) as count FROM tenants WHERE domain_id = $1 AND is_active = true',
      [domainId]
    );

    const usersResult = await pool.query(
      `SELECT COUNT(DISTINCT utr.user_id) as count
       FROM user_tenant_roles utr
       JOIN tenants t ON utr.tenant_id = t.id
       WHERE t.domain_id = $1 AND t.is_active = true AND utr.is_active = true`,
      [domainId]
    );

    return {
      total_tenants: parseInt(tenantsResult.rows[0].count),
      total_users: parseInt(usersResult.rows[0].count)
    };
  }
}

export default new DomainService();
