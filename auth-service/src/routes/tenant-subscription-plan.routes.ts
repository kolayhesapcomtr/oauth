import { Router } from 'express';
import { body, param, query } from 'express-validator';
import tenantSubscriptionPlanController from '../controllers/tenant-subscription-plan.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * GET /tenant-subscription-plans
 * List all tenant subscription plans for an organization
 * Query params: organization_id, domain_id, is_active
 */
router.get(
  '/',
  validate([
    query('organization_id').optional().isUUID(),
    query('domain_id').optional().isUUID(),
    query('is_active').optional().isBoolean(),
  ]),
  tenantSubscriptionPlanController.list
);

/**
 * GET /tenant-subscription-plans/public
 * List public plans (for tenant signup page)
 * Query params: organization_id, domain_id
 */
router.get(
  '/public',
  validate([
    query('organization_id').optional().isUUID(),
    query('domain_id').optional().isUUID(),
  ]),
  tenantSubscriptionPlanController.listPublic
);

/**
 * GET /tenant-subscription-plans/:id
 * Get a specific tenant subscription plan
 */
router.get(
  '/:id',
  validate([param('id').isUUID()]),
  tenantSubscriptionPlanController.getById
);

/**
 * POST /tenant-subscription-plans
 * Create a new tenant subscription plan
 */
router.post(
  '/',
  validate([
    body('organization_id').isUUID(),
    body('domain_id').optional().isUUID(),
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('slug').trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim(),
    body('monthly_price').optional().isDecimal(),
    body('yearly_price').optional().isDecimal(),
    body('currency').optional().isLength({ min: 3, max: 3 }),
    body('max_users').optional().isInt({ min: -1 }),
    body('max_storage_gb').optional().isDecimal(),
    body('max_api_calls_per_month').optional().isInt({ min: -1 }),
    body('max_custom_fields').optional().isInt({ min: 0 }),
    body('features').optional().isObject(),
    body('has_trial').optional().isBoolean(),
    body('trial_days').optional().isInt({ min: 0 }),
    body('display_order').optional().isInt(),
    body('is_active').optional().isBoolean(),
    body('is_public').optional().isBoolean(),
  ]),
  tenantSubscriptionPlanController.create
);

/**
 * PUT /tenant-subscription-plans/:id
 * Update a tenant subscription plan
 */
router.put(
  '/:id',
  validate([
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('slug').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim(),
    body('monthly_price').optional().isDecimal(),
    body('yearly_price').optional().isDecimal(),
    body('currency').optional().isLength({ min: 3, max: 3 }),
    body('max_users').optional().isInt({ min: -1 }),
    body('max_storage_gb').optional().isDecimal(),
    body('max_api_calls_per_month').optional().isInt({ min: -1 }),
    body('max_custom_fields').optional().isInt({ min: 0 }),
    body('features').optional().isObject(),
    body('has_trial').optional().isBoolean(),
    body('trial_days').optional().isInt({ min: 0 }),
    body('display_order').optional().isInt(),
    body('is_active').optional().isBoolean(),
    body('is_public').optional().isBoolean(),
  ]),
  tenantSubscriptionPlanController.update
);

/**
 * DELETE /tenant-subscription-plans/:id
 * Delete a tenant subscription plan
 */
router.delete(
  '/:id',
  validate([param('id').isUUID()]),
  tenantSubscriptionPlanController.delete
);

/**
 * GET /tenant-subscription-plans/:id/tenants
 * Get all tenants subscribed to this plan
 */
router.get(
  '/:id/tenants',
  validate([param('id').isUUID()]),
  tenantSubscriptionPlanController.getPlanTenants
);

/**
 * POST /tenant-subscription-plans/:id/clone
 * Clone a plan (useful for creating variations)
 */
router.post(
  '/:id/clone',
  validate([
    param('id').isUUID(),
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('slug').trim().isLength({ min: 1, max: 100 }),
  ]),
  tenantSubscriptionPlanController.clone
);

export default router;
