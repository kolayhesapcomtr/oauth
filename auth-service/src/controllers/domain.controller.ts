import { Request, Response } from 'express';
import domainService from '../services/domain.service';
import { AuthRequest } from '../middleware/auth.middleware';

class DomainController {
  /**
   * Create new domain
   * POST /api/domains
   */
  async createDomain(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const { name, domain, description, logo_url, settings } = req.body;

      if (!name || !domain) {
        return res.status(400).json({
          success: false,
          message: 'Name and domain are required'
        });
      }

      // Validate domain format
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid domain format'
        });
      }

      const newDomain = await domainService.createDomain({
        organization_id: authReq.user!.organization_id!,
        name,
        domain,
        description,
        logo_url,
        settings
      });

      res.status(201).json({
        success: true,
        message: 'Domain created successfully',
        data: newDomain
      });
    } catch (error: any) {
      console.error('Create domain error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create domain'
      });
    }
  }

  /**
   * Get domain by ID
   * GET /api/domains/:id
   */
  async getDomain(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const domain = await domainService.getDomainById(id);

      if (!domain) {
        return res.status(404).json({
          success: false,
          message: 'Domain not found'
        });
      }

      res.json({
        success: true,
        data: domain
      });
    } catch (error: any) {
      console.error('Get domain error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get domain'
      });
    }
  }

  /**
   * Get domains for organization
   * GET /api/domains
   */
  async getDomains(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organization_id!;

      const domains = await domainService.getDomainsByOrganization(organizationId);

      res.json({
        success: true,
        data: domains
      });
    } catch (error: any) {
      console.error('Get domains error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get domains'
      });
    }
  }

  /**
   * Update domain
   * PUT /api/domains/:id
   */
  async updateDomain(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, logo_url, settings } = req.body;

      const domain = await domainService.updateDomain(id, {
        name,
        description,
        logo_url,
        settings
      });

      res.json({
        success: true,
        message: 'Domain updated successfully',
        data: domain
      });
    } catch (error: any) {
      console.error('Update domain error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update domain'
      });
    }
  }

  /**
   * Delete domain
   * DELETE /api/domains/:id
   */
  async deleteDomain(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await domainService.deleteDomain(id);

      res.json({
        success: true,
        message: 'Domain deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete domain error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete domain'
      });
    }
  }

  /**
   * Get domain statistics
   * GET /api/domains/:id/stats
   */
  async getDomainStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const stats = await domainService.getDomainStats(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Get domain stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get domain statistics'
      });
    }
  }
}

export default new DomainController();
