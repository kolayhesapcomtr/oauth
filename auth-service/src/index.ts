import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import pool from './config/database';
import { trackApiUsage, addUsageHeaders } from './middleware/usage-tracking.middleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Usage tracking and rate limiting
app.use(addUsageHeaders);
app.use(trackApiUsage);

// Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'OAuth Multi-Tenant SaaS Platform API',
    version: '1.0.0',
    description: 'Enterprise-grade multi-domain multi-tenant authentication and authorization system',
    endpoints: {
      health: '/api/health',
      organizations: '/api/organizations',
      domains: '/api/domains',
      analytics: '/api/analytics'
    },
    documentation: {
      swagger: '/api/docs',
      github: 'https://github.com/your-repo'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API URL: http://localhost:${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
