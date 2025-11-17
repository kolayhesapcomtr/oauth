import express from 'express';
import analyticsController from '../controllers/analytics.controller';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authenticateToken);

// Usage reports
router.get('/usage/monthly', analyticsController.getMonthlyUsage);
router.get('/usage/trend', analyticsController.getUsageTrend);
router.get('/overage', analyticsController.calculateOverage);

// API usage analytics
router.get('/api-usage/breakdown', analyticsController.getApiUsageBreakdown);
router.get('/api-usage/by-user', analyticsController.getApiUsageByUser);
router.get('/api-usage/daily', analyticsController.getDailyUsage);
router.get('/api-usage/hourly-pattern', analyticsController.getHourlyPattern);

// Error and performance analytics
router.get('/errors', analyticsController.getErrorStats);
router.get('/performance/slowest', analyticsController.getSlowestEndpoints);

// Audit log
router.get('/events', analyticsController.getOrganizationEvents);

// Platform statistics (super admin only)
router.get('/platform', requireSuperAdmin, analyticsController.getPlatformStats);

export default router;
