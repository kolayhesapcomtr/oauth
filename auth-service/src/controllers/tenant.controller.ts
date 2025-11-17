import { Request, Response } from 'express';
import tenantService from '../services/tenant.service';

export class TenantController {
  async list(req: Request, res: Response) {
    try {
      const { domain_id } = req.query;
      const tenants = await tenantService.list(domain_id as string);
      res.json({ tenants });
    } catch (error: any) {
      console.error('List tenants error:', error);
      res.status(500).json({ error: 'Failed to list tenants' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenant = await tenantService.findById(id);

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      res.json({ tenant });
    } catch (error: any) {
      console.error('Get tenant error:', error);
      res.status(500).json({ error: 'Failed to get tenant' });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenant = await tenantService.findById(id);

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const stats = await tenantService.getTenantStats(id);
      res.json({ tenant, stats });
    } catch (error: any) {
      console.error('Get tenant stats error:', error);
      res.status(500).json({ error: 'Failed to get tenant stats' });
    }
  }

  async getUsers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const users = await tenantService.getTenantUsers(id);
      res.json({ users });
    } catch (error: any) {
      console.error('Get tenant users error:', error);
      res.status(500).json({ error: 'Failed to get tenant users' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { domain_id, name, slug, description, logo_url, settings } = req.body;

      // Check if slug already exists in domain
      const existing = await tenantService.findBySlug(domain_id, slug);
      if (existing) {
        return res.status(409).json({ error: 'Tenant slug already exists in this domain' });
      }

      const tenant = await tenantService.create({
        domain_id,
        name,
        slug,
        description,
        logo_url,
        settings,
      });

      res.status(201).json({
        message: 'Tenant created successfully',
        tenant,
      });
    } catch (error: any) {
      console.error('Create tenant error:', error);
      res.status(500).json({ error: 'Failed to create tenant' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, slug, description, logo_url, is_active, settings } = req.body;

      const tenant = await tenantService.update(id, {
        name,
        slug,
        description,
        logo_url,
        is_active,
        settings,
      });

      res.json({
        message: 'Tenant updated successfully',
        tenant,
      });
    } catch (error: any) {
      if (error.message === 'Tenant not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Update tenant error:', error);
      res.status(500).json({ error: 'Failed to update tenant' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await tenantService.delete(id);
      res.json({ message: 'Tenant deleted successfully' });
    } catch (error: any) {
      if (error.message === 'Tenant not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Delete tenant error:', error);
      res.status(500).json({ error: 'Failed to delete tenant' });
    }
  }
}

export default new TenantController();
