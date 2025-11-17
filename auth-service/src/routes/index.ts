import express from 'express';
import organizationRoutes from './organization.routes';
import domainRoutes from './domain.routes';
import analyticsRoutes from './analytics.routes';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Organization routes
router.use('/organizations', organizationRoutes);

// Domain routes
router.use('/domains', domainRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

export default router;
