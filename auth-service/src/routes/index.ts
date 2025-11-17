import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

router.use('/auth', authRoutes);

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
      health: '/api/health',
    },
  });
});

export default router;
