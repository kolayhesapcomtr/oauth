import { Request, Response, NextFunction } from 'express';
import organizationService from '../services/organization.service';
import { AuthRequest } from './auth.middleware';

/**
 * Middleware to check if organization can add more domains
 */
export const checkDomainLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user?.organization_id) {
      return res.status(403).json({
        success: false,
        message: 'Organization ID required'
      });
    }

    // Super admins bypass limits
    if (authReq.user.is_super_admin) {
      return next();
    }

    const limitCheck = await organizationService.checkLimit(
      authReq.user.organization_id,
      'domains'
    );

    if (!limitCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: limitCheck.message,
        limit: {
          current: limitCheck.current,
          max: limitCheck.max,
          type: 'domains'
        },
        upgrade_required: true
      });
    }

    next();
  } catch (error: any) {
    console.error('Domain limit check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check domain limit'
    });
  }
};

/**
 * Middleware to check if organization can add more tenants
 */
export const checkTenantLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user?.organization_id) {
      return res.status(403).json({
        success: false,
        message: 'Organization ID required'
      });
    }

    // Super admins bypass limits
    if (authReq.user.is_super_admin) {
      return next();
    }

    const limitCheck = await organizationService.checkLimit(
      authReq.user.organization_id,
      'tenants'
    );

    if (!limitCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: limitCheck.message,
        limit: {
          current: limitCheck.current,
          max: limitCheck.max,
          type: 'tenants'
        },
        upgrade_required: true
      });
    }

    next();
  } catch (error: any) {
    console.error('Tenant limit check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check tenant limit'
    });
  }
};

/**
 * Middleware to check if organization can add more users
 */
export const checkUserLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user?.organization_id) {
      return res.status(403).json({
        success: false,
        message: 'Organization ID required'
      });
    }

    // Super admins bypass limits
    if (authReq.user.is_super_admin) {
      return next();
    }

    const limitCheck = await organizationService.checkLimit(
      authReq.user.organization_id,
      'users'
    );

    if (!limitCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: limitCheck.message,
        limit: {
          current: limitCheck.current,
          max: limitCheck.max,
          type: 'users'
        },
        upgrade_required: true
      });
    }

    next();
  } catch (error: any) {
    console.error('User limit check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check user limit'
    });
  }
};

/**
 * Middleware to check feature access based on plan
 */
export const checkFeatureAccess = (featureName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user?.organization_id) {
        return res.status(403).json({
          success: false,
          message: 'Organization ID required'
        });
      }

      // Super admins have access to all features
      if (authReq.user.is_super_admin) {
        return next();
      }

      const organization = await organizationService.getOrganizationById(
        authReq.user.organization_id
      );

      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      const hasFeature = organization.features[featureName] === true;

      if (!hasFeature) {
        return res.status(403).json({
          success: false,
          message: `Feature '${featureName}' not available in your current plan`,
          feature: featureName,
          current_plan: organization.plan,
          upgrade_required: true
        });
      }

      next();
    } catch (error: any) {
      console.error('Feature access check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check feature access'
      });
    }
  };
};

/**
 * Middleware to check if organization subscription is active
 */
export const checkSubscriptionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user?.organization_id) {
      return res.status(403).json({
        success: false,
        message: 'Organization ID required'
      });
    }

    // Super admins bypass subscription checks
    if (authReq.user.is_super_admin) {
      return next();
    }

    const organization = await organizationService.getOrganizationById(
      authReq.user.organization_id
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check if subscription is active
    if (organization.status === 'suspended' || organization.status === 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Organization subscription is not active',
        status: organization.status,
        action_required: 'Please update your subscription to continue'
      });
    }

    // Check if trial has expired
    if (organization.status === 'trial' && organization.trial_ends_at) {
      const now = new Date();
      const trialEnd = new Date(organization.trial_ends_at);

      if (now > trialEnd) {
        return res.status(403).json({
          success: false,
          message: 'Trial period has expired',
          trial_ended: organization.trial_ends_at,
          action_required: 'Please upgrade to a paid plan to continue'
        });
      }
    }

    // Check if subscription has expired
    if (organization.subscription_ends_at) {
      const now = new Date();
      const subEnd = new Date(organization.subscription_ends_at);

      if (now > subEnd) {
        return res.status(403).json({
          success: false,
          message: 'Subscription has expired',
          subscription_ended: organization.subscription_ends_at,
          action_required: 'Please renew your subscription to continue'
        });
      }
    }

    next();
  } catch (error: any) {
    console.error('Subscription status check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check subscription status'
    });
  }
};

/**
 * Combined middleware: Check subscription + specific limit
 */
export const enforceLimit = (limitType: 'domains' | 'tenants' | 'users') => {
  return [
    checkSubscriptionStatus,
    limitType === 'domains' ? checkDomainLimit :
    limitType === 'tenants' ? checkTenantLimit :
    checkUserLimit
  ];
};

/**
 * Combined middleware: Check subscription + feature access
 */
export const enforceFeature = (featureName: string) => {
  return [
    checkSubscriptionStatus,
    checkFeatureAccess(featureName)
  ];
};
