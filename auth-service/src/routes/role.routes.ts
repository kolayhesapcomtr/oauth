import { Router } from 'express';
import { body, param } from 'express-validator';
import roleController from '../controllers/role.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All role routes require authentication
router.use(authenticate);

// List roles (optionally filtered by domain_id)
router.get('/', roleController.list);

// Get role by ID
router.get('/:id', validate([param('id').isUUID()]), roleController.getById);

// Get role permissions
router.get('/:id/permissions', validate([param('id').isUUID()]), roleController.getPermissions);

// Create role
router.post(
  '/',
  validate([
    body('domain_id').isUUID(),
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('slug').trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/),
    body('description').optional().trim(),
    body('is_system').optional().isBoolean(),
  ]),
  roleController.create
);

// Update role
router.put(
  '/:id',
  validate([
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('slug').optional().trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/),
    body('description').optional().trim(),
    body('is_active').optional().isBoolean(),
  ]),
  roleController.update
);

// Delete role
router.delete('/:id', validate([param('id').isUUID()]), roleController.delete);

// Assign permissions to role (replace all)
router.post(
  '/:id/permissions',
  validate([
    param('id').isUUID(),
    body('permission_ids').isArray(),
    body('permission_ids.*').isUUID(),
  ]),
  roleController.assignPermissions
);

// Add single permission to role
router.post(
  '/:id/permissions/add',
  validate([
    param('id').isUUID(),
    body('permission_id').isUUID(),
  ]),
  roleController.addPermission
);

// Remove permission from role
router.delete(
  '/:id/permissions/:permission_id',
  validate([
    param('id').isUUID(),
    param('permission_id').isUUID(),
  ]),
  roleController.removePermission
);

export default router;
