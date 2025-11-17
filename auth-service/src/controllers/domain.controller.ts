import { Request, Response } from 'express';
import domainService from '../services/domain.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class DomainController {
  async list(req: Request, res: Response) {
    try {
      const domains = await domainService.list();
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
      const { name, slug, domain, description, logo_url, settings } = req.body;

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
      if (error.message === 'Domain not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Update domain error:', error);
      res.status(500).json({ error: 'Failed to update domain' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await domainService.delete(id);
      res.json({ message: 'Domain deleted successfully' });
    } catch (error: any) {
      if (error.message === 'Domain not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Delete domain error:', error);
      res.status(500).json({ error: 'Failed to delete domain' });
    }
  }
}

export default new DomainController();
