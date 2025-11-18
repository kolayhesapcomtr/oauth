import { Request, Response } from 'express';
import subscriptionPlanService from '../services/subscription-plan.service';

export class SubscriptionPlanController {
  /**
   * List all platform subscription plans
   */
  async list(req: Request, res: Response) {
    try {
      const { is_visible, is_custom } = req.query;

      const plans = await subscriptionPlanService.list({
        is_visible: is_visible === 'true' ? true : is_visible === 'false' ? false : undefined,
        is_custom: is_custom === 'true' ? true : is_custom === 'false' ? false : undefined,
      });

      res.json({ data: plans });
    } catch (error: any) {
      console.error('List subscription plans error:', error);
      res.status(500).json({ error: 'Failed to list subscription plans' });
    }
  }

  /**
   * Get plan by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const plan = await subscriptionPlanService.getById(id);

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
   * Get plan features
   */
  async getFeatures(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const plan = await subscriptionPlanService.getById(id);

      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      res.json({ data: plan.features });
    } catch (error: any) {
      console.error('Get plan features error:', error);
      res.status(500).json({ error: 'Failed to get plan features' });
    }
  }

  /**
   * Create new plan (super admin only)
   */
  async create(req: Request, res: Response) {
    try {
      const planData = req.body;

      const plan = await subscriptionPlanService.create(planData);

      res.status(201).json({
        message: 'Subscription plan created successfully',
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
   * Update plan (super admin only)
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const plan = await subscriptionPlanService.update(id, updates);

      res.json({
        message: 'Plan updated successfully',
        data: plan,
      });
    } catch (error: any) {
      console.error('Update plan error:', error);

      if (error.message === 'Plan not found') {
        return res.status(404).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to update plan' });
    }
  }

  /**
   * Delete plan (super admin only)
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if any organizations are using this plan
      const organizationsCount = await subscriptionPlanService.getOrganizationsCount(id);

      if (organizationsCount > 0) {
        return res.status(400).json({
          error: `Cannot delete plan with ${organizationsCount} organization(s). Please migrate organizations to another plan first.`,
        });
      }

      await subscriptionPlanService.delete(id);

      res.json({ message: 'Plan deleted successfully' });
    } catch (error: any) {
      console.error('Delete plan error:', error);

      if (error.message === 'Plan not found') {
        return res.status(404).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to delete plan' });
    }
  }
}

export default new SubscriptionPlanController();
