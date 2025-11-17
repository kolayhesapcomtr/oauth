import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import userService from '../services/user.service';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    contexts: TokenPayload['contexts'];
    current_context?: TokenPayload['current_context'];
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    try {
      const payload = verifyToken(token);

      req.user = {
        id: payload.sub,
        email: payload.email,
        contexts: payload.contexts,
        current_context: payload.current_context,
      };

      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const requireContext = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.current_context) {
    return res.status(400).json({
      error: 'No context selected. Please select a domain and tenant first.',
    });
  }
  next();
};

export const requirePermission = (permissionSlug: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.current_context) {
        return res.status(400).json({ error: 'No context selected' });
      }

      const hasPermission = await userService.hasPermission(
        req.user.id,
        req.user.current_context.tenant_id,
        permissionSlug
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: `Permission denied. Required permission: ${permissionSlug}`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const requireRole = (roleSlug: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.current_context) {
      return res.status(400).json({ error: 'No context selected' });
    }

    // Find current tenant in contexts
    const currentDomain = req.user.contexts.find(
      (ctx) => ctx.domain_id === req.user!.current_context!.domain_id
    );

    if (!currentDomain) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const currentTenant = currentDomain.tenants.find(
      (t) => t.tenant_id === req.user!.current_context!.tenant_id
    );

    if (!currentTenant || !currentTenant.roles.includes(roleSlug)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roleSlug}`,
      });
    }

    next();
  };
};
