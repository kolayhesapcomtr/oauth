import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Register
router.post(
  '/register',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('first_name').optional().trim().isLength({ min: 1, max: 100 }),
    body('last_name').optional().trim().isLength({ min: 1, max: 100 }),
  ]),
  authController.register
);

// Login
router.post(
  '/login',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    body('domain').optional().isString(),
  ]),
  authController.login
);

// Select context (after login with multiple contexts)
router.post(
  '/select-context',
  authenticate,
  validate([
    body('domain_id').isUUID(),
    body('tenant_id').isUUID(),
  ]),
  authController.selectContext
);

// Switch context (change tenant within same session)
router.post(
  '/switch-context',
  authenticate,
  validate([
    body('tenant_id').isUUID(),
  ]),
  authController.switchContext
);

// Get my contexts
router.get('/my-contexts', authenticate, authController.getMyContexts);

// Refresh token
router.post(
  '/refresh',
  validate([
    body('refresh_token').notEmpty(),
  ]),
  authController.refreshToken
);

// Logout
router.post('/logout', authController.logout);

// Get current user info
router.get('/me', authenticate, authController.me);

export default router;
