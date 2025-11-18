import { Request, Response, NextFunction } from 'express';
import organizationService from '../services/organization.service';
import { AuthRequest } from './auth.middleware';

/**
 * Middleware to track API usage for billing and analytics
 */
export const trackApiUsage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  const authReq = req as AuthRequest;

  // Store original res.json to intercept response
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    const responseTime = Date.now() - startTime;

    // Log usage asynchronously (don't block response)
    if (authReq.user?.organization_id) {
      setImmediate(async () => {
        try {
          await organizationService.logApiUsage({
            organization_id: authReq.user!.organization_id!,
            user_id: authReq.user!.id,
            endpoint: req.path,
            method: req.method,
            status_code: res.statusCode,
            response_time_ms: responseTime,
            ip_address: req.ip || req.socket.remoteAddress,
            user_agent: req.get('user-agent')
          });
        } catch (error) {
          console.error('Failed to log API usage:', error);
          // Don't throw error - usage logging should not affect API responses
        }
      });
    }

    return originalJson(body);
  };

  next();
};

/**
 * Middleware to add usage info to response headers
 */
export const addUsageHeaders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user?.organization_id) {
      return next();
    }

    const limitCheck = await organizationService.checkLimit(
      authReq.user.organization_id,
      'api_calls'
    );

    res.setHeader('X-RateLimit-Limit', limitCheck.max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limitCheck.max - limitCheck.current).toString());
    res.setHeader('X-RateLimit-Used', limitCheck.current.toString());

    next();
  } catch (error) {
    // Don't block requests if header setting fails
    next();
  }
};
