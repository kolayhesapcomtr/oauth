import { Request, Response } from 'express';
import domainService from '../services/domain.service';
import organizationService from '../services/organization.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class DomainController {
  async list(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organization_id;

      const domains = await domainService.list(organizationId);
      res.json({ domains });
    } catch (error: any) {
      console.error('List domains error:', error);
      res.status(500).json({ error: 'Failed to list domains' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const domain = await domainService.findById(id);

      if (!domain) {
        return res.status(404).json({ error: 'Domain not found' });
      }

      res.json({ domain });
    } catch (error: any) {
      console.error('Get domain error:', error);
      res.status(500).json({ error: 'Failed to get domain' });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const domain = await domainService.findById(id);

      if (!domain) {
        return res.status(404).json({ error: 'Domain not found' });
      }

      const stats = await domainService.getDomainStats(id);
      res.json({ domain, stats });
    } catch (error: any) {
      console.error('Get domain stats error:', error);
      res.status(500).json({ error: 'Failed to get domain stats' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const { name, slug, domain, description, logo_url, settings } = req.body;

      // Get organization ID from authenticated user
      const organizationId = authReq.user?.organization_id;
      if (!organizationId) {
        return res.status(403).json({ error: 'Organization ID required' });
      }

      // Check domain limit for organization
      const limitCheck = await organizationService.checkLimit(organizationId, 'domains');
      if (!limitCheck.allowed) {
        return res.status(403).json({
          error: limitCheck.message,
          limit: {
            current: limitCheck.current,
            max: limitCheck.max,
            type: 'domains'
          },
          upgrade_required: true
        });
      }

      // Check if domain or slug already exists
      const existingDomain = await domainService.findBySlug(slug);
      if (existingDomain) {
        return res.status(409).json({ error: 'Domain slug already exists' });
      }

      const existingUrl = await domainService.findByDomain(domain);
      if (existingUrl) {
        return res.status(409).json({ error: 'Domain URL already exists' });
      }

      const newDomain = await domainService.create({
        organization_id: organizationId,
        name,
        slug,
        domain,
        description,
        logo_url,
        settings,
      });

      res.status(201).json({
        message: 'Domain created successfully',
        domain: newDomain,
      });
    } catch (error: any) {
      console.error('Create domain error:', error);
      res.status(500).json({ error: 'Failed to create domain' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, slug, domain, description, logo_url, is_active, settings } = req.body;

      // Check if domain exists
      const existingDomain = await domainService.findById(id);
      if (!existingDomain) {
        return res.status(404).json({ error: 'Domain not found' });
      }

      // Check for slug conflicts
      if (slug && slug !== existingDomain.slug) {
        const slugConflict = await domainService.findBySlug(slug);
        if (slugConflict) {
          return res.status(409).json({ error: 'Domain slug already exists' });
        }
      }

      // Check for domain URL conflicts
      if (domain && domain !== existingDomain.domain) {
        const domainConflict = await domainService.findByDomain(domain);
        if (domainConflict) {
          return res.status(409).json({ error: 'Domain URL already exists' });
        }
      }

      const updatedDomain = await domainService.update(id, {
        name,
        slug,
        domain,
        description,
        logo_url,
        is_active,
        settings,
      });

      res.json({
        message: 'Domain updated successfully',
        domain: updatedDomain,
      });
    } catch (error: any) {
      console.error('Update domain error:', error);
      res.status(500).json({ error: error.message || 'Failed to update domain' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if domain exists
      const domain = await domainService.findById(id);
      if (!domain) {
        return res.status(404).json({ error: 'Domain not found' });
      }

      await domainService.delete(id);

      res.json({
        message: 'Domain deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete domain error:', error);
      res.status(500).json({ error: 'Failed to delete domain' });
    }
  }

  async getByOrganization(req: Request, res: Response) {
    try {
      const { organizationId } = req.params;
      const domains = await domainService.getByOrganization(organizationId);
      res.json({ domains });
    } catch (error: any) {
      console.error('Get organization domains error:', error);
      res.status(500).json({ error: 'Failed to get organization domains' });
    }
  }
}

export default new DomainController();
