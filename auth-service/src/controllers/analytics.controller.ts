import { Request, Response } from 'express';
import analyticsService from '../services/analytics.service';
import { AuthRequest } from '../middleware/auth.middleware';

class AnalyticsController {
  /**
   * Get monthly usage report
   * GET /api/analytics/usage/monthly
   */
  async getMonthlyUsage(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const { year, month } = req.query;

      if (!year || !month) {
        return res.status(400).json({
          success: false,
          message: 'Year and month are required'
        });
      }

      const report = await analyticsService.getMonthlyUsageReport(
        authReq.user!.organization_id!,
        parseInt(year as string),
        parseInt(month as string)
      );

      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      console.error('Get monthly usage error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get monthly usage'
      });
    }
  }

  /**
   * Get usage trend
   * GET /api/analytics/usage/trend
   */
  async getUsageTrend(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const { months } = req.query;

      const trend = await analyticsService.getUsageTrend(
        authReq.user!.organization_id!,
        months ? parseInt(months as string) : 6
      );

      res.json({
        success: true,
        data: trend
      });
    } catch (error: any) {
      console.error('Get usage trend error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get usage trend'
      });
    }
  }

  /**
   * Get API usage breakdown
   * GET /api/analytics/api-usage/breakdown
   */
  async getApiUsageBreakdown(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'start_date and end_date are required'
        });
      }

      const breakdown = await analyticsService.getApiUsageBreakdown(
        authReq.user!.organization_id!,
        new Date(start_date as string),
        new Date(end_date as string)
      );

      res.json({
        success: true,
        data: breakdown
      });
    } catch (error: any) {
      console.error('Get API usage breakdown error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get API usage breakdown'
      });
    }
  }

  /**
   * Get API usage by user
   * GET /api/analytics/api-usage/by-user
   */
  async getApiUsageByUser(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'start_date and end_date are required'
        });
      }

      const usage = await analyticsService.getApiUsageByUser(
        authReq.user!.organization_id!,
        new Date(start_date as string),
        new Date(end_date as string)
      );

      res.json({
        success: true,
        data: usage
      });
    } catch (error: any) {
      console.error('Get API usage by user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get API usage by user'
      });
    }
  }

  /**
   * Get daily usage
   * GET /api/analytics/api-usage/daily
   */
  async getDailyUsage(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'start_date and end_date are required'
        });
      }

      const usage = await analyticsService.getDailyUsage(
        authReq.user!.organization_id!,
        new Date(start_date as string),
        new Date(end_date as string)
      );

      res.json({
        success: true,
        data: usage
      });
    } catch (error: any) {
      console.error('Get daily usage error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get daily usage'
      });
    }
  }

  /**
   * Get hourly pattern
   * GET /api/analytics/api-usage/hourly-pattern
   */
  async getHourlyPattern(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'start_date and end_date are required'
        });
      }

      const pattern = await analyticsService.getHourlyPattern(
        authReq.user!.organization_id!,
        new Date(start_date as string),
        new Date(end_date as string)
      );

      res.json({
        success: true,
        data: pattern
      });
    } catch (error: any) {
      console.error('Get hourly pattern error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get hourly pattern'
      });
    }
  }

  /**
   * Get error statistics
   * GET /api/analytics/errors
   */
  async getErrorStats(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'start_date and end_date are required'
        });
      }

      const stats = await analyticsService.getErrorStats(
        authReq.user!.organization_id!,
        new Date(start_date as string),
        new Date(end_date as string)
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Get error stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get error statistics'
      });
    }
  }

  /**
   * Get slowest endpoints
   * GET /api/analytics/performance/slowest
   */
  async getSlowestEndpoints(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const { start_date, end_date, limit } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'start_date and end_date are required'
        });
      }

      const slowest = await analyticsService.getSlowestEndpoints(
        authReq.user!.organization_id!,
        new Date(start_date as string),
        new Date(end_date as string),
        limit ? parseInt(limit as string) : 10
      );

      res.json({
        success: true,
        data: slowest
      });
    } catch (error: any) {
      console.error('Get slowest endpoints error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get slowest endpoints'
      });
    }
  }

  /**
   * Get organization events (audit log)
   * GET /api/analytics/events
   */
  async getOrganizationEvents(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const { limit, offset } = req.query;

      const events = await analyticsService.getOrganizationEvents(
        authReq.user!.organization_id!,
        limit ? parseInt(limit as string) : 100,
        offset ? parseInt(offset as string) : 0
      );

      res.json({
        success: true,
        data: events
      });
    } catch (error: any) {
      console.error('Get organization events error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get organization events'
      });
    }
  }

  /**
   * Calculate overage for current month
   * GET /api/analytics/overage
   */
  async calculateOverage(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;

      const overage = await analyticsService.calculateOverage(
        authReq.user!.organization_id!
      );

      res.json({
        success: true,
        data: overage
      });
    } catch (error: any) {
      console.error('Calculate overage error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate overage'
      });
    }
  }

  /**
   * Get platform-wide statistics (super admin only)
   * GET /api/analytics/platform
   */
  async getPlatformStats(req: Request, res: Response) {
    try {
      const stats = await analyticsService.getPlatformStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Get platform stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get platform statistics'
      });
    }
  }
}

export default new AnalyticsController();
