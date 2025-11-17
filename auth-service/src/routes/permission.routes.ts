import { Router } from 'express';
import { body, param } from 'express-validator';
import permissionController from '../controllers/permission.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All permission routes require authentication
router.use(authenticate);

// List permissions (optionally filtered by domain_id and/or resource)
router.get('/', permissionController.list);

// Get resources for a domain
router.get('/domains/:domain_id/resources', validate([param('domain_id').isUUID()]), permissionController.getResources);

// Get permission by ID
router.get('/:id', validate([param('id').isUUID()]), permissionController.getById);

// Create permission
router.post(
  '/',
  validate([
    body('domain_id').isUUID(),
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('slug').trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/),
    body('resource').trim().isLength({ min: 1, max: 100 }),
    body('action').trim().isLength({ min: 1, max: 50 }),
    body('description').optional().trim(),
  ]),
  permissionController.create
);

// Bulk create permissions
router.post(
  '/bulk',
  validate([
    body('domain_id').isUUID(),
    body('permissions').isArray(),
    body('permissions.*.name').trim().isLength({ min: 1, max: 255 }),
    body('permissions.*.slug').trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/),
    body('permissions.*.resource').trim().isLength({ min: 1, max: 100 }),
    body('permissions.*.action').trim().isLength({ min: 1, max: 50 }),
    body('permissions.*.description').optional().trim(),
  ]),
  permissionController.bulkCreate
);

// Update permission
router.put(
  '/:id',
  validate([
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('slug').optional().trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/),
    body('resource').optional().trim().isLength({ min: 1, max: 100 }),
    body('action').optional().trim().isLength({ min: 1, max: 50 }),
    body('description').optional().trim(),
  ]),
  permissionController.update
);

// Delete permission
router.delete('/:id', validate([param('id').isUUID()]), permissionController.delete);

export default router;
