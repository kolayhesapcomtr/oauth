import { Router } from 'express';
import { body, param } from 'express-validator';
import userManagementController from '../controllers/user-management.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// List users
router.get('/users', authenticate, userManagementController.listUsers);

// Get user access (all tenants/roles for a user)
router.get('/users/:user_id/access', authenticate, validate([param('user_id').isUUID()]), userManagementController.getUserAccess);

// Assign user to tenant
router.post(
  '/users/assign',
  authenticate,
  validate([
    body('user_id').isUUID(),
    body('tenant_id').isUUID(),
    body('role_id').isUUID(),
  ]),
  userManagementController.assignUserToTenant
);

// Remove user from tenant
router.post(
  '/users/remove',
  authenticate,
  validate([
    body('user_id').isUUID(),
    body('tenant_id').isUUID(),
  ]),
  userManagementController.removeUserFromTenant
);

// Update user role in tenant
router.put(
  '/users/role',
  authenticate,
  validate([
    body('user_id').isUUID(),
    body('tenant_id').isUUID(),
    body('role_id').isUUID(),
  ]),
  userManagementController.updateUserRole
);

// Deactivate user in tenant
router.post(
  '/users/deactivate',
  authenticate,
  validate([
    body('user_id').isUUID(),
    body('tenant_id').isUUID(),
  ]),
  userManagementController.deactivateUser
);

// Reactivate user in tenant
router.post(
  '/users/reactivate',
  authenticate,
  validate([
    body('user_id').isUUID(),
    body('tenant_id').isUUID(),
  ]),
  userManagementController.reactivateUser
);

// Invitation endpoints
router.post(
  '/invitations',
  authenticate,
  validate([
    body('tenant_id').isUUID(),
    body('role_id').isUUID(),
    body('email').isEmail().normalizeEmail(),
    body('expires_in_days').optional().isInt({ min: 1, max: 30 }),
  ]),
  userManagementController.createInvitation
);

// Get invitation (public endpoint)
router.get('/invitations/:token', validate([param('token').isUUID()]), userManagementController.getInvitation);

// Accept invitation (public endpoint)
router.post(
  '/invitations/:token/accept',
  validate([
    param('token').isUUID(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('first_name').optional().trim().isLength({ min: 1, max: 100 }),
    body('last_name').optional().trim().isLength({ min: 1, max: 100 }),
  ]),
  userManagementController.acceptInvitation
);

// List invitations for a tenant
router.get('/tenants/:tenant_id/invitations', authenticate, validate([param('tenant_id').isUUID()]), userManagementController.listInvitations);

// Cancel invitation
router.delete('/invitations/:id', authenticate, validate([param('id').isUUID()]), userManagementController.cancelInvitation);

export default router;
