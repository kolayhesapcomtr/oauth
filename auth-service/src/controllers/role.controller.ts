import { Request, Response } from 'express';
import roleService from '../services/role.service';

export class RoleController {
  async list(req: Request, res: Response) {
    try {
      const { domain_id } = req.query;
      const roles = await roleService.list(domain_id as string);
      res.json({ roles });
    } catch (error: any) {
      console.error('List roles error:', error);
      res.status(500).json({ error: 'Failed to list roles' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const role = await roleService.findById(id);

      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      res.json({ role });
    } catch (error: any) {
      console.error('Get role error:', error);
      res.status(500).json({ error: 'Failed to get role' });
    }
  }

  async getPermissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const role = await roleService.findById(id);

      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      const permissions = await roleService.getRolePermissions(id);
      res.json({ role, permissions });
    } catch (error: any) {
      console.error('Get role permissions error:', error);
      res.status(500).json({ error: 'Failed to get role permissions' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { domain_id, name, slug, description, is_system } = req.body;

      // Check if slug already exists in domain
      const existing = await roleService.findBySlug(domain_id, slug);
      if (existing) {
        return res.status(409).json({ error: 'Role slug already exists in this domain' });
      }

      const role = await roleService.create({
        domain_id,
        name,
        slug,
        description,
        is_system,
      });

      res.status(201).json({
        message: 'Role created successfully',
        role,
      });
    } catch (error: any) {
      console.error('Create role error:', error);
      res.status(500).json({ error: 'Failed to create role' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, slug, description, is_active } = req.body;

      const role = await roleService.update(id, {
        name,
        slug,
        description,
        is_active,
      });

      res.json({
        message: 'Role updated successfully',
        role,
      });
    } catch (error: any) {
      if (error.message.includes('system role')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'Role not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Update role error:', error);
      res.status(500).json({ error: 'Failed to update role' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await roleService.delete(id);
      res.json({ message: 'Role deleted successfully' });
    } catch (error: any) {
      if (error.message.includes('system role')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'Role not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Delete role error:', error);
      res.status(500).json({ error: 'Failed to delete role' });
    }
  }

  async assignPermissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { permission_ids } = req.body;

      if (!Array.isArray(permission_ids)) {
        return res.status(400).json({ error: 'permission_ids must be an array' });
      }

      await roleService.assignPermissions(id, permission_ids);

      res.json({ message: 'Permissions assigned successfully' });
    } catch (error: any) {
      console.error('Assign permissions error:', error);
      res.status(500).json({ error: 'Failed to assign permissions' });
    }
  }

  async addPermission(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { permission_id } = req.body;

      await roleService.addPermission(id, permission_id);

      res.json({ message: 'Permission added successfully' });
    } catch (error: any) {
      console.error('Add permission error:', error);
      res.status(500).json({ error: 'Failed to add permission' });
    }
  }

  async removePermission(req: Request, res: Response) {
    try {
      const { id, permission_id } = req.params;

      await roleService.removePermission(id, permission_id);

      res.json({ message: 'Permission removed successfully' });
    } catch (error: any) {
      console.error('Remove permission error:', error);
      res.status(500).json({ error: 'Failed to remove permission' });
    }
  }
}

export default new RoleController();
