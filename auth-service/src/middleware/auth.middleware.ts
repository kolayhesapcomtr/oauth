import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    is_super_admin?: boolean;
    organization_id?: string;
  };
}

/**
 * Authenticate JWT token
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Attach user info to request
    (req as AuthRequest).user = {
      id: decoded.userId,
      email: decoded.email,
      is_super_admin: decoded.is_super_admin,
      organization_id: decoded.organization_id
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

/**
 * Check if user is super admin
 */
export const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user is super admin
    const result = await pool.query(
      'SELECT is_super_admin FROM users WHERE id = $1',
      [authReq.user.id]
    );

    if (result.rows.length === 0 || !result.rows[0].is_super_admin) {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};

/**
 * Check if user belongs to organization
 */
export const requireOrganizationAccess = (organizationIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Super admins have access to all organizations
      if (authReq.user.is_super_admin) {
        return next();
      }

      const organizationId = req.params[organizationIdParam];

      // Check if user belongs to this organization
      if (authReq.user.organization_id !== organizationId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this organization'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

/**
 * Rate limiting middleware (checks organization API limits)
 */
export const checkOrganizationRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user?.organization_id) {
      // Skip rate limiting for non-organization requests
      return next();
    }

    // Get organization's current API usage
    const result = await pool.query(
      `SELECT
         o.max_api_calls_per_month,
         COUNT(aul.id) as current_calls
       FROM organizations o
       LEFT JOIN api_usage_log aul ON aul.organization_id = o.id
         AND EXTRACT(YEAR FROM aul.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND EXTRACT(MONTH FROM aul.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
       WHERE o.id = $1
       GROUP BY o.id, o.max_api_calls_per_month`,
      [authReq.user.organization_id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Organization not found'
      });
    }

    const { max_api_calls_per_month, current_calls } = result.rows[0];

    // -1 means unlimited
    if (max_api_calls_per_month !== -1 && current_calls >= max_api_calls_per_month) {
      return res.status(429).json({
        success: false,
        message: 'API rate limit exceeded for this month',
        limit: max_api_calls_per_month,
        current: current_calls
      });
    }

    next();
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Don't block requests if rate limit check fails
    next();
  }
};
