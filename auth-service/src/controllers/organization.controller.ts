import { Request, Response } from 'express';
import organizationService from '../services/organization.service';

class OrganizationController {
  /**
   * Create new organization (signup)
   * POST /api/organizations
   */
  async createOrganization(req: Request, res: Response) {
    try {
      const { name, slug, owner_email, company_name, contact_phone, billing_email, plan, metadata } = req.body;

      // Validation
      if (!name || !slug || !owner_email) {
        return res.status(400).json({
          success: false,
          message: 'Name, slug, and owner_email are required'
        });
      }

      // Validate slug format (alphanumeric and hyphens only)
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({
          success: false,
          message: 'Slug must contain only lowercase letters, numbers, and hyphens'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(owner_email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      const organization = await organizationService.createOrganization({
        name,
        slug,
        owner_email,
        company_name,
        contact_phone,
        billing_email,
        plan,
        metadata
      });

      res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: organization
      });
    } catch (error: any) {
      console.error('Create organization error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create organization'
      });
    }
  }

  /**
   * Get organization by ID
   * GET /api/organizations/:id
   */
  async getOrganization(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const organization = await organizationService.getOrganizationById(id);

      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      res.json({
        success: true,
        data: organization
      });
    } catch (error: any) {
      console.error('Get organization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get organization'
      });
    }
  }

  /**
   * Get organization by slug
   * GET /api/organizations/slug/:slug
   */
  async getOrganizationBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;

      const organization = await organizationService.getOrganizationBySlug(slug);

      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      res.json({
        success: true,
        data: organization
      });
    } catch (error: any) {
      console.error('Get organization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get organization'
      });
    }
  }

  /**
   * Update organization
   * PUT /api/organizations/:id
   */
  async updateOrganization(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, company_name, contact_phone, billing_email, metadata } = req.body;

      const organization = await organizationService.updateOrganization(id, {
        name,
        company_name,
        contact_phone,
        billing_email,
        metadata
      });

      res.json({
        success: true,
        message: 'Organization updated successfully',
        data: organization
      });
    } catch (error: any) {
      console.error('Update organization error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update organization'
      });
    }
  }

  /**
   * Get organization usage and limits
   * GET /api/organizations/:id/usage
   */
  async getOrganizationUsage(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const usage = await organizationService.getOrganizationUsage(id);

      res.json({
        success: true,
        data: usage
      });
    } catch (error: any) {
      console.error('Get organization usage error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get organization usage'
      });
    }
  }

  /**
   * Check specific limit
   * GET /api/organizations/:id/check-limit/:limitType
   */
  async checkLimit(req: Request, res: Response) {
    try {
      const { id, limitType } = req.params;

      if (!['domains', 'tenants', 'users', 'api_calls'].includes(limitType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid limit type. Must be: domains, tenants, users, or api_calls'
        });
      }

      const result = await organizationService.checkLimit(
        id,
        limitType as 'domains' | 'tenants' | 'users' | 'api_calls'
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Check limit error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to check limit'
      });
    }
  }

  /**
   * Change organization plan
   * PUT /api/organizations/:id/plan
   */
  async changePlan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { plan_id } = req.body;
      const actorUserId = (req as any).user?.id;

      if (!plan_id) {
        return res.status(400).json({
          success: false,
          message: 'plan_id is required'
        });
      }

      const organization = await organizationService.changePlan(id, plan_id, actorUserId);

      res.json({
        success: true,
        message: 'Plan changed successfully',
        data: organization
      });
    } catch (error: any) {
      console.error('Change plan error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to change plan'
      });
    }
  }

  /**
   * Get all available plans
   * GET /api/organizations/plans
   */
  async getAllPlans(req: Request, res: Response) {
    try {
      const plans = await organizationService.getAllPlans();

      res.json({
        success: true,
        data: plans
      });
    } catch (error: any) {
      console.error('Get plans error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get plans'
      });
    }
  }

  /**
   * Get organization statistics
   * GET /api/organizations/:id/stats
   */
  async getOrganizationStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const stats = await organizationService.getOrganizationStats(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Get organization stats error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get organization stats'
      });
    }
  }

  /**
   * List all organizations (super admin only)
   * GET /api/organizations
   */
  async listOrganizations(req: Request, res: Response) {
    try {
      const { status, plan, search, limit, offset } = req.query;

      const result = await organizationService.listOrganizations({
        status: status as string,
        plan: plan as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json({
        success: true,
        data: result.organizations,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          pages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error: any) {
      console.error('List organizations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list organizations'
      });
    }
  }

  /**
   * Deactivate organization
   * DELETE /api/organizations/:id
   */
  async deactivateOrganization(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const actorUserId = (req as any).user?.id;

      await organizationService.deactivateOrganization(id, actorUserId);

      res.json({
        success: true,
        message: 'Organization deactivated successfully'
      });
    } catch (error: any) {
      console.error('Deactivate organization error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to deactivate organization'
      });
    }
  }

  /**
   * Reactivate organization
   * POST /api/organizations/:id/reactivate
   */
  async reactivateOrganization(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const actorUserId = (req as any).user?.id;

      const organization = await organizationService.reactivateOrganization(id, actorUserId);

      res.json({
        success: true,
        message: 'Organization reactivated successfully',
        data: organization
      });
    } catch (error: any) {
      console.error('Reactivate organization error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reactivate organization'
      });
    }
  }

  /**
   * Log API usage (internal use)
   * POST /api/organizations/:id/log-usage
   */
  async logApiUsage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        user_id,
        endpoint,
        method,
        status_code,
        response_time_ms,
        domain_id,
        tenant_id,
        ip_address,
        user_agent
      } = req.body;

      await organizationService.logApiUsage({
        organization_id: id,
        user_id,
        endpoint,
        method,
        status_code,
        response_time_ms,
        domain_id,
        tenant_id,
        ip_address,
        user_agent
      });

      res.json({
        success: true,
        message: 'API usage logged successfully'
      });
    } catch (error: any) {
      console.error('Log API usage error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to log API usage'
      });
    }
  }
}

export default new OrganizationController();
