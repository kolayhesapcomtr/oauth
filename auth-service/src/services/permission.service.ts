import { query } from '../config/database';
import { Permission } from '../types';

export class PermissionService {
  async list(domainId?: string): Promise<Permission[]> {
    if (domainId) {
      const result = await query(
        'SELECT * FROM permissions WHERE domain_id = $1 ORDER BY resource, action',
        [domainId]
      );
      return result.rows;
    }

    const result = await query('SELECT * FROM permissions ORDER BY resource, action');
    return result.rows;
  }

  async listByResource(domainId: string, resource: string): Promise<Permission[]> {
    const result = await query(
      'SELECT * FROM permissions WHERE domain_id = $1 AND resource = $2 ORDER BY action',
      [domainId, resource]
    );
    return result.rows;
  }

  async findById(id: string): Promise<Permission | null> {
    const result = await query('SELECT * FROM permissions WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findBySlug(domainId: string, slug: string): Promise<Permission | null> {
    const result = await query(
      'SELECT * FROM permissions WHERE domain_id = $1 AND slug = $2',
      [domainId, slug]
    );
    return result.rows[0] || null;
  }

  async create(data: {
    domain_id: string;
    name: string;
    slug: string;
    resource: string;
    action: string;
    description?: string;
  }): Promise<Permission> {
    const result = await query(
      `INSERT INTO permissions (domain_id, name, slug, resource, action, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.domain_id,
        data.name,
        data.slug,
        data.resource,
        data.action,
        data.description || null,
      ]
    );
    return result.rows[0];
  }

  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      resource?: string;
      action?: string;
      description?: string;
    }
  ): Promise<Permission> {
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
    if (data.resource !== undefined) {
      fields.push(`resource = $${paramCount++}`);
      values.push(data.resource);
    }
    if (data.action !== undefined) {
      fields.push(`action = $${paramCount++}`);
      values.push(data.action);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const result = await query(
      `UPDATE permissions SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Permission not found');
    }

    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    const result = await query('DELETE FROM permissions WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new Error('Permission not found');
    }
  }

  async getResources(domainId: string): Promise<string[]> {
    const result = await query(
      'SELECT DISTINCT resource FROM permissions WHERE domain_id = $1 ORDER BY resource',
      [domainId]
    );
    return result.rows.map((row) => row.resource);
  }

  async bulkCreate(domainId: string, permissions: Array<{
    name: string;
    slug: string;
    resource: string;
    action: string;
    description?: string;
  }>): Promise<Permission[]> {
    if (permissions.length === 0) {
      return [];
    }

    const values: any[] = [];
    const placeholders: string[] = [];

    permissions.forEach((perm, index) => {
      const offset = index * 6;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
      );
      values.push(
        domainId,
        perm.name,
        perm.slug,
        perm.resource,
        perm.action,
        perm.description || null
      );
    });

    const result = await query(
      `INSERT INTO permissions (domain_id, name, slug, resource, action, description)
       VALUES ${placeholders.join(', ')}
       RETURNING *`,
      values
    );

    return result.rows;
  }
}

export default new PermissionService();
