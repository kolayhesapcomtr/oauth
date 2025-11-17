import { Router } from 'express';
import authRoutes from './auth.routes';
import domainRoutes from './domain.routes';
import tenantRoutes from './tenant.routes';
import roleRoutes from './role.routes';
import permissionRoutes from './permission.routes';
import userManagementRoutes from './user-management.routes';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Management routes
router.use('/domains', domainRoutes);
router.use('/tenants', tenantRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/user-management', userManagementRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'Multi-Tenant Auth Service',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      domains: '/api/domains',
      tenants: '/api/tenants',
      roles: '/api/roles',
      permissions: '/api/permissions',
      userManagement: '/api/user-management',
      health: '/api/health',
    },
  });
});

export default router;
