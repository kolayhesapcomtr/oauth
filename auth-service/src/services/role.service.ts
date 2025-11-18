import { query, getClient } from '../config/database';
import { Role, Permission } from '../types';

export class RoleService {
  async list(domainId?: string): Promise<Role[]> {
    if (domainId) {
      const result = await query(
        'SELECT * FROM roles WHERE domain_id = $1 ORDER BY created_at DESC',
        [domainId]
      );
      return result.rows;
    }

    const result = await query('SELECT * FROM roles ORDER BY created_at DESC');
    return result.rows;
  }

  async findById(id: string): Promise<Role | null> {
    const result = await query('SELECT * FROM roles WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findBySlug(domainId: string, slug: string): Promise<Role | null> {
    const result = await query(
      'SELECT * FROM roles WHERE domain_id = $1 AND slug = $2',
      [domainId, slug]
    );
    return result.rows[0] || null;
  }

  async create(data: {
    domain_id: string;
    name: string;
    slug: string;
    description?: string;
    is_system?: boolean;
  }): Promise<Role> {
    const result = await query(
      `INSERT INTO roles (domain_id, name, slug, description, is_system)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.domain_id,
        data.name,
        data.slug,
        data.description || null,
        data.is_system || false,
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
      is_active?: boolean;
    }
  ): Promise<Role> {
    // Check if role is system role
    const role = await this.findById(id);
    if (!role) {
      throw new Error('Role not found');
    }

    if (role.is_system && (data.slug !== undefined || data.name !== undefined)) {
      throw new Error('Cannot modify name or slug of system roles');
    }

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
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.is_active);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const result = await query(
      `UPDATE roles SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    const role = await this.findById(id);
    if (!role) {
      throw new Error('Role not found');
    }

    if (role.is_system) {
      throw new Error('Cannot delete system roles');
    }

    const result = await query('DELETE FROM roles WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new Error('Role not found');
    }
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const result = await query(
      `SELECT p.* FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.resource, p.action`,
      [roleId]
    );
    return result.rows;
  }

  async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Remove existing permissions
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

      // Add new permissions
      if (permissionIds.length > 0) {
        const values = permissionIds.map((permId, index) =>
          `($1, $${index + 2})`
        ).join(', ');

        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`,
          [roleId, ...permissionIds]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async addPermission(roleId: string, permissionId: string): Promise<void> {
    await query(
      `INSERT INTO role_permissions (role_id, permission_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [roleId, permissionId]
    );
  }

  async removePermission(roleId: string, permissionId: string): Promise<void> {
    await query(
      'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
      [roleId, permissionId]
    );
  }
}

export default new RoleService();
