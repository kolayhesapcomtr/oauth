import { Router } from 'express';
import { body, param } from 'express-validator';
import paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * GET /payment/providers
 * List all available payment providers
 */
router.get('/providers', paymentController.listProviders);

/**
 * GET /payment/providers/:id
 * Get payment provider details
 */
router.get(
  '/providers/:id',
  validate([param('id').notEmpty()]),
  paymentController.getProvider
);

/**
 * GET /payment/settings
 * Get organization's payment settings
 */
router.get('/settings', paymentController.getOrganizationSettings);

/**
 * POST /payment/settings
 * Setup payment provider for organization
 */
router.post(
  '/settings',
  validate([
    body('payment_provider_id').notEmpty(),
    body('credentials').isObject(),
    body('is_live_mode').optional().isBoolean(),
    body('commission_percentage').optional().isDecimal(),
  ]),
  paymentController.setupPaymentProvider
);

/**
 * PUT /payment/settings/:id
 * Update payment settings
 */
router.put(
  '/settings/:id',
  validate([
    param('id').isUUID(),
    body('credentials').optional().isObject(),
    body('is_live_mode').optional().isBoolean(),
    body('is_active').optional().isBoolean(),
    body('commission_percentage').optional().isDecimal(),
  ]),
  paymentController.updatePaymentSettings
);

/**
 * DELETE /payment/settings/:id
 * Delete payment settings
 */
router.delete(
  '/settings/:id',
  validate([param('id').isUUID()]),
  paymentController.deletePaymentSettings
);

/**
 * POST /payment/settings/:id/verify
 * Verify payment provider credentials
 */
router.post(
  '/settings/:id/verify',
  validate([param('id').isUUID()]),
  paymentController.verifyCredentials
);

/**
 * POST /payment/create-payment
 * Create a payment for tenant subscription
 */
router.post(
  '/create-payment',
  validate([
    body('tenant_id').isUUID(),
    body('subscription_plan_id').isUUID(),
    body('amount').isDecimal(),
    body('payer_email').isEmail(),
    body('payer_name').notEmpty(),
    body('callback_url').optional().isURL(),
  ]),
  paymentController.createPayment
);

/**
 * POST /payment/webhook/:provider
 * Webhook endpoint for payment providers
 * Public endpoint - no auth required
 */
router.post(
  '/webhook/:provider',
  validate([param('provider').notEmpty()]),
  paymentController.handleWebhook
);

/**
 * GET /payment/transactions
 * Get payment transactions for organization
 */
router.get('/transactions', paymentController.getTransactions);

/**
 * GET /payment/transactions/:id
 * Get specific payment transaction
 */
router.get(
  '/transactions/:id',
  validate([param('id').isUUID()]),
  paymentController.getTransaction
);

/**
 * POST /payment/transactions/:id/refund
 * Refund a payment
 */
router.post(
  '/transactions/:id/refund',
  validate([
    param('id').isUUID(),
    body('reason').optional().trim(),
    body('amount').optional().isDecimal(),
  ]),
  paymentController.refundPayment
);

/**
 * GET /payment/commissions
 * Get platform commissions for organization
 */
router.get('/commissions', paymentController.getCommissions);

export default router;
