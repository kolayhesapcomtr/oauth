import { Request, Response } from 'express';
import tenantSubscriptionPlanService from '../services/tenant-subscription-plan.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class TenantSubscriptionPlanController {
  /**
   * List tenant subscription plans
   */
  async list(req: AuthRequest, res: Response) {
    try {
      const { organization_id, domain_id, is_active } = req.query;

      // Use organization_id from auth if not provided
      const orgId = (organization_id as string) || req.user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ error: 'organization_id is required' });
      }

      const plans = await tenantSubscriptionPlanService.list({
        organization_id: orgId,
        domain_id: domain_id as string,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
      });

      res.json({ data: plans });
    } catch (error: any) {
      console.error('List tenant subscription plans error:', error);
      res.status(500).json({ error: 'Failed to list tenant subscription plans' });
    }
  }

  /**
   * List public plans (for tenant signup)
   */
  async listPublic(req: Request, res: Response) {
    try {
      const { organization_id, domain_id } = req.query;

      if (!organization_id) {
        return res.status(400).json({ error: 'organization_id is required' });
      }

      const plans = await tenantSubscriptionPlanService.listPublic({
        organization_id: organization_id as string,
        domain_id: domain_id as string,
      });

      res.json({ data: plans });
    } catch (error: any) {
      console.error('List public plans error:', error);
      res.status(500).json({ error: 'Failed to list public plans' });
    }
  }

  /**
   * Get plan by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const plan = await tenantSubscriptionPlanService.getById(id);

      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      res.json({ data: plan });
    } catch (error: any) {
      console.error('Get plan by ID error:', error);
      res.status(500).json({ error: 'Failed to get plan' });
    }
  }

  /**
   * Create new plan
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const planData = req.body;
      const createdBy = req.user?.id;

      // Validate organization_id matches user's organization
      if (req.user?.organization_id && planData.organization_id !== req.user.organization_id) {
        if (!req.user.is_super_admin) {
          return res.status(403).json({ error: 'Cannot create plan for another organization' });
        }
      }

      const plan = await tenantSubscriptionPlanService.create(planData, createdBy);

      res.status(201).json({
        message: 'Tenant subscription plan created successfully',
        data: plan,
      });
    } catch (error: any) {
      console.error('Create plan error:', error);

      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to create plan' });
    }
  }

  /**
   * Update plan
   */
  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check ownership
      const existingPlan = await tenantSubscriptionPlanService.getById(id);
      if (!existingPlan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      if (req.user?.organization_id !== existingPlan.organization_id && !req.user?.is_super_admin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const plan = await tenantSubscriptionPlanService.update(id, updates);

      res.json({
        message: 'Plan updated successfully',
        data: plan,
      });
    } catch (error: any) {
      console.error('Update plan error:', error);

      if (error.message === 'Plan not found') {
        return res.status(404).json({ error: error.message });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to update plan' });
    }
  }

  /**
   * Delete plan
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Check ownership
      const existingPlan = await tenantSubscriptionPlanService.getById(id);
      if (!existingPlan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      if (req.user?.organization_id !== existingPlan.organization_id && !req.user?.is_super_admin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if plan has active tenants
      const tenants = await tenantSubscriptionPlanService.getPlanTenants(id);
      if (tenants.length > 0) {
        return res.status(400).json({
          error: `Cannot delete plan with ${tenants.length} active tenant(s). Please migrate tenants to another plan first.`,
        });
      }

      await tenantSubscriptionPlanService.delete(id);

      res.json({ message: 'Plan deleted successfully' });
    } catch (error: any) {
      console.error('Delete plan error:', error);

      if (error.message === 'Plan not found') {
        return res.status(404).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to delete plan' });
    }
  }

  /**
   * Get tenants subscribed to this plan
   */
  async getPlanTenants(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const tenants = await tenantSubscriptionPlanService.getPlanTenants(id);

      res.json({ data: tenants });
    } catch (error: any) {
      console.error('Get plan tenants error:', error);
      res.status(500).json({ error: 'Failed to get plan tenants' });
    }
  }

  /**
   * Clone a plan
   */
  async clone(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, slug } = req.body;

      // Check ownership
      const existingPlan = await tenantSubscriptionPlanService.getById(id);
      if (!existingPlan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      if (req.user?.organization_id !== existingPlan.organization_id && !req.user?.is_super_admin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const newPlan = await tenantSubscriptionPlanService.clone(id, name, slug, req.user?.id);

      res.status(201).json({
        message: 'Plan cloned successfully',
        data: newPlan,
      });
    } catch (error: any) {
      console.error('Clone plan error:', error);

      if (error.message === 'Plan not found') {
        return res.status(404).json({ error: error.message });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to clone plan' });
    }
  }
}

export default new TenantSubscriptionPlanController();
