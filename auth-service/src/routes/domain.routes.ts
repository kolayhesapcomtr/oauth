import express from 'express';
import domainController from '../controllers/domain.controller';
import { authenticateToken, requireOrganizationAccess } from '../middleware/auth.middleware';
import { checkDomainLimit, checkSubscriptionStatus } from '../middleware/limit-enforcement.middleware';

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authenticateToken);

// Get all domains for current organization
router.get('/', domainController.getDomains);

// Create domain (with limit check)
router.post('/',
  checkSubscriptionStatus,
  checkDomainLimit,
  domainController.createDomain
);

// Get domain by ID
router.get('/:id', domainController.getDomain);

// Update domain
router.put('/:id', domainController.updateDomain);

// Delete domain
router.delete('/:id', domainController.deleteDomain);

// Get domain statistics
router.get('/:id/stats', domainController.getDomainStats);

export default router;
