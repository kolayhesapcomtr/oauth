import { Router } from 'express';
import { body, param } from 'express-validator';
import tenantController from '../controllers/tenant.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All tenant routes require authentication
router.use(authenticate);

// List tenants (optionally filtered by domain_id)
router.get('/', tenantController.list);

// Get tenant by ID
router.get('/:id', validate([param('id').isUUID()]), tenantController.getById);

// Get tenant stats
router.get('/:id/stats', validate([param('id').isUUID()]), tenantController.getStats);

// Get tenant users
router.get('/:id/users', validate([param('id').isUUID()]), tenantController.getUsers);

// Create tenant
router.post(
  '/',
  validate([
    body('domain_id').isUUID(),
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('slug').trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/),
    body('description').optional().trim(),
    body('logo_url').optional().isURL(),
    body('settings').optional().isObject(),
  ]),
  tenantController.create
);

// Update tenant
router.put(
  '/:id',
  validate([
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('slug').optional().trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/),
    body('description').optional().trim(),
    body('logo_url').optional().isURL(),
    body('is_active').optional().isBoolean(),
    body('settings').optional().isObject(),
  ]),
  tenantController.update
);

// Delete tenant
router.delete('/:id', validate([param('id').isUUID()]), tenantController.delete);

export default router;
