import express from 'express';
import organizationRoutes from './organization.routes';
import analyticsRoutes from './analytics.routes';
import authRoutes from './auth.routes';
import domainRoutes from './domain.routes';
import tenantRoutes from './tenant.routes';
import roleRoutes from './role.routes';
import permissionRoutes from './permission.routes';
import userManagementRoutes from './user-management.routes';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Organization routes (SaaS Platform Layer)
router.use('/organizations', organizationRoutes);

// Auth routes
router.use('/auth', authRoutes);

// Management routes
router.use('/domains', domainRoutes);
router.use('/tenants', tenantRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/user-management', userManagementRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

export default router;
