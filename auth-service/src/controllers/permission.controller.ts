import { Request, Response } from 'express';
import permissionService from '../services/permission.service';

export class PermissionController {
  async list(req: Request, res: Response) {
    try {
      const { domain_id, resource } = req.query;

      let permissions;
      if (domain_id && resource) {
        permissions = await permissionService.listByResource(
          domain_id as string,
          resource as string
        );
      } else if (domain_id) {
        permissions = await permissionService.list(domain_id as string);
      } else {
        permissions = await permissionService.list();
      }

      res.json({ permissions });
    } catch (error: any) {
      console.error('List permissions error:', error);
      res.status(500).json({ error: 'Failed to list permissions' });
    }
  }

  async getResources(req: Request, res: Response) {
    try {
      const { domain_id } = req.params;
      const resources = await permissionService.getResources(domain_id);
      res.json({ resources });
    } catch (error: any) {
      console.error('Get resources error:', error);
      res.status(500).json({ error: 'Failed to get resources' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const permission = await permissionService.findById(id);

      if (!permission) {
        return res.status(404).json({ error: 'Permission not found' });
      }

      res.json({ permission });
    } catch (error: any) {
      console.error('Get permission error:', error);
      res.status(500).json({ error: 'Failed to get permission' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { domain_id, name, slug, resource, action, description } = req.body;

      // Check if slug already exists in domain
      const existing = await permissionService.findBySlug(domain_id, slug);
      if (existing) {
        return res.status(409).json({ error: 'Permission slug already exists in this domain' });
      }

      const permission = await permissionService.create({
        domain_id,
        name,
        slug,
        resource,
        action,
        description,
      });

      res.status(201).json({
        message: 'Permission created successfully',
        permission,
      });
    } catch (error: any) {
      console.error('Create permission error:', error);
      res.status(500).json({ error: 'Failed to create permission' });
    }
  }

  async bulkCreate(req: Request, res: Response) {
    try {
      const { domain_id, permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: 'permissions must be an array' });
      }

      const createdPermissions = await permissionService.bulkCreate(domain_id, permissions);

      res.status(201).json({
        message: `${createdPermissions.length} permissions created successfully`,
        permissions: createdPermissions,
      });
    } catch (error: any) {
      console.error('Bulk create permissions error:', error);
      res.status(500).json({ error: 'Failed to create permissions' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, slug, resource, action, description } = req.body;

      const permission = await permissionService.update(id, {
        name,
        slug,
        resource,
        action,
        description,
      });

      res.json({
        message: 'Permission updated successfully',
        permission,
      });
    } catch (error: any) {
      if (error.message === 'Permission not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Update permission error:', error);
      res.status(500).json({ error: 'Failed to update permission' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await permissionService.delete(id);
      res.json({ message: 'Permission deleted successfully' });
    } catch (error: any) {
      if (error.message === 'Permission not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Delete permission error:', error);
      res.status(500).json({ error: 'Failed to delete permission' });
    }
  }
}

export default new PermissionController();
