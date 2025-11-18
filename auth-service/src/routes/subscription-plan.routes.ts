import { Router } from 'express';
import { param } from 'express-validator';
import subscriptionPlanController from '../controllers/subscription-plan.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

/**
 * GET /subscription-plans
 * List all platform subscription plans (public endpoint)
 * These are the plans that organizations subscribe to
 */
router.get('/', subscriptionPlanController.list);

/**
 * GET /subscription-plans/:id
 * Get a specific subscription plan
 */
router.get(
  '/:id',
  validate([param('id').notEmpty()]),
  subscriptionPlanController.getById
);

/**
 * GET /subscription-plans/:id/features
 * Get feature comparison
 */
router.get(
  '/:id/features',
  validate([param('id').notEmpty()]),
  subscriptionPlanController.getFeatures
);

/**
 * Protected routes (super admin only)
 */
router.use(authenticate, requireSuperAdmin);

/**
 * POST /subscription-plans
 * Create a new platform subscription plan (super admin only)
 */
router.post('/', subscriptionPlanController.create);

/**
 * PUT /subscription-plans/:id
 * Update a subscription plan (super admin only)
 */
router.put(
  '/:id',
  validate([param('id').notEmpty()]),
  subscriptionPlanController.update
);

/**
 * DELETE /subscription-plans/:id
 * Delete a subscription plan (super admin only)
 */
router.delete(
  '/:id',
  validate([param('id').notEmpty()]),
  subscriptionPlanController.delete
);

export default router;
