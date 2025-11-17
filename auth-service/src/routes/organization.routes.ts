import express from 'express';
import organizationController from '../controllers/organization.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * PUBLIC ROUTES
 */

// Get all available plans (public for signup page)
router.get('/plans', organizationController.getAllPlans);

// Create organization (signup) - public endpoint
router.post('/', organizationController.createOrganization);

// Get organization by slug (for verification/public profile)
router.get('/slug/:slug', organizationController.getOrganizationBySlug);

/**
 * PROTECTED ROUTES (require authentication)
 */

// List all organizations (super admin only)
router.get('/', authenticateToken, organizationController.listOrganizations);

// Get organization by ID
router.get('/:id', authenticateToken, organizationController.getOrganization);

// Update organization
router.put('/:id', authenticateToken, organizationController.updateOrganization);

// Get organization usage and limits
router.get('/:id/usage', authenticateToken, organizationController.getOrganizationUsage);

// Check specific limit
router.get('/:id/check-limit/:limitType', authenticateToken, organizationController.checkLimit);

// Get organization statistics
router.get('/:id/stats', authenticateToken, organizationController.getOrganizationStats);

// Change organization plan
router.put('/:id/plan', authenticateToken, organizationController.changePlan);

// Deactivate organization
router.delete('/:id', authenticateToken, organizationController.deactivateOrganization);

// Reactivate organization
router.post('/:id/reactivate', authenticateToken, organizationController.reactivateOrganization);

// Log API usage (internal)
router.post('/:id/log-usage', organizationController.logApiUsage);

export default router;
