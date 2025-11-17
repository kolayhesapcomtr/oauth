import { Router } from 'express';
import { body, param } from 'express-validator';
import domainController from '../controllers/domain.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All domain routes require authentication
router.use(authenticate);

// List all domains
router.get('/', domainController.list);

// Get domain by ID
router.get('/:id', validate([param('id').isUUID()]), domainController.getById);

// Get domain stats
router.get('/:id/stats', validate([param('id').isUUID()]), domainController.getStats);

// Create domain
router.post(
  '/',
  validate([
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('slug').trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/),
    body('domain').trim().isLength({ min: 1, max: 255 }),
    body('description').optional().trim(),
    body('logo_url').optional().isURL(),
    body('settings').optional().isObject(),
  ]),
  domainController.create
);

// Update domain
router.put(
  '/:id',
  validate([
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('slug').optional().trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/),
    body('domain').optional().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().trim(),
    body('logo_url').optional().isURL(),
    body('is_active').optional().isBoolean(),
    body('settings').optional().isObject(),
  ]),
  domainController.update
);

// Delete domain
router.delete('/:id', validate([param('id').isUUID()]), domainController.delete);

export default router;
