import pool from '../config/database';

class AnalyticsService {
  /**
   * Get monthly usage report for organization
   */
  async getMonthlyUsageReport(organizationId: string, year: number, month: number) {
    const result = await pool.query(
      `SELECT * FROM organization_usage
       WHERE organization_id = $1 AND year = $2 AND month = $3`,
      [organizationId, year, month]
    );

    if (result.rows.length === 0) {
      return {
        organization_id: organizationId,
        year,
        month,
        total_domains: 0,
        total_tenants: 0,
        total_users: 0,
        total_api_calls: 0,
        total_storage_gb: 0,
        overage_users: 0,
        overage_api_calls: 0,
        overage_storage_gb: 0,
        overage_charge: 0
      };
    }

    return result.rows[0];
  }

  /**
   * Get usage trend (last N months)
   */
  async getUsageTrend(organizationId: string, months: number = 6) {
    const result = await pool.query(
      `SELECT
         year,
         month,
         total_domains,
         total_tenants,
         total_users,
         total_api_calls,
         total_storage_gb,
         overage_charge
       FROM organization_usage
       WHERE organization_id = $1
       ORDER BY year DESC, month DESC
       LIMIT $2`,
      [organizationId, months]
    );

    return result.rows.reverse(); // Oldest first for charts
  }

  /**
   * Get API usage breakdown by endpoint
   */
  async getApiUsageBreakdown(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const result = await pool.query(
      `SELECT
         endpoint,
         method,
         COUNT(*) as total_calls,
         AVG(response_time_ms)::INTEGER as avg_response_time,
         COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
         COUNT(CASE WHEN status_code < 400 THEN 1 END) as success_count
       FROM api_usage_log
       WHERE organization_id = $1
         AND created_at >= $2
         AND created_at <= $3
       GROUP BY endpoint, method
       ORDER BY total_calls DESC
       LIMIT 50`,
      [organizationId, startDate, endDate]
    );

    return result.rows;
  }

  /**
   * Get API usage by user
   */
  async getApiUsageByUser(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const result = await pool.query(
      `SELECT
         u.id,
         u.email,
         u.full_name,
         COUNT(aul.id) as total_calls,
         AVG(aul.response_time_ms)::INTEGER as avg_response_time
       FROM api_usage_log aul
       JOIN users u ON aul.user_id = u.id
       WHERE aul.organization_id = $1
         AND aul.created_at >= $2
         AND aul.created_at <= $3
       GROUP BY u.id, u.email, u.full_name
       ORDER BY total_calls DESC
       LIMIT 50`,
      [organizationId, startDate, endDate]
    );

    return result.rows;
  }

  /**
   * Get hourly API usage pattern
   */
  async getHourlyPattern(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const result = await pool.query(
      `SELECT
         EXTRACT(HOUR FROM created_at) as hour,
         COUNT(*) as total_calls,
         AVG(response_time_ms)::INTEGER as avg_response_time
       FROM api_usage_log
       WHERE organization_id = $1
         AND created_at >= $2
         AND created_at <= $3
       GROUP BY EXTRACT(HOUR FROM created_at)
       ORDER BY hour`,
      [organizationId, startDate, endDate]
    );

    return result.rows;
  }

  /**
   * Get daily API usage for a date range
   */
  async getDailyUsage(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const result = await pool.query(
      `SELECT
         DATE(created_at) as date,
         COUNT(*) as total_calls,
         AVG(response_time_ms)::INTEGER as avg_response_time,
         COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
         COUNT(CASE WHEN status_code < 400 THEN 1 END) as success_count
       FROM api_usage_log
       WHERE organization_id = $1
         AND created_at >= $2
         AND created_at <= $3
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [organizationId, startDate, endDate]
    );

    return result.rows;
  }

  /**
   * Get error rate statistics
   */
  async getErrorStats(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const result = await pool.query(
      `SELECT
         status_code,
         COUNT(*) as count,
         endpoint,
         method
       FROM api_usage_log
       WHERE organization_id = $1
         AND created_at >= $2
         AND created_at <= $3
         AND status_code >= 400
       GROUP BY status_code, endpoint, method
       ORDER BY count DESC
       LIMIT 50`,
      [organizationId, startDate, endDate]
    );

    return result.rows;
  }

  /**
   * Get slowest endpoints
   */
  async getSlowestEndpoints(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ) {
    const result = await pool.query(
      `SELECT
         endpoint,
         method,
         AVG(response_time_ms)::INTEGER as avg_response_time,
         MAX(response_time_ms) as max_response_time,
         COUNT(*) as total_calls
       FROM api_usage_log
       WHERE organization_id = $1
         AND created_at >= $2
         AND created_at <= $3
       GROUP BY endpoint, method
       ORDER BY avg_response_time DESC
       LIMIT $4`,
      [organizationId, startDate, endDate, limit]
    );

    return result.rows;
  }

  /**
   * Get organization events (audit log)
   */
  async getOrganizationEvents(
    organizationId: string,
    limit: number = 100,
    offset: number = 0
  ) {
    const result = await pool.query(
      `SELECT
         oe.*,
         u.email as actor_email,
         u.full_name as actor_name
       FROM organization_events oe
       LEFT JOIN users u ON oe.actor_user_id = u.id
       WHERE oe.organization_id = $1
       ORDER BY oe.created_at DESC
       LIMIT $2 OFFSET $3`,
      [organizationId, limit, offset]
    );

    return result.rows;
  }

  /**
   * Calculate overage for current month
   */
  async calculateOverage(organizationId: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Get organization limits
    const orgResult = await pool.query(
      `SELECT
         max_users,
         max_api_calls_per_month,
         max_storage_gb,
         plan
       FROM organizations
       WHERE id = $1`,
      [organizationId]
    );

    if (orgResult.rows.length === 0) {
      throw new Error('Organization not found');
    }

    const org = orgResult.rows[0];

    // Get current usage
    const usageResult = await pool.query(
      `SELECT * FROM organization_usage
       WHERE organization_id = $1 AND year = $2 AND month = $3`,
      [organizationId, year, month]
    );

    const usage = usageResult.rows[0] || {
      total_users: 0,
      total_api_calls: 0,
      total_storage_gb: 0
    };

    // Calculate overage
    const overage = {
      users: org.max_users !== -1 ? Math.max(0, usage.total_users - org.max_users) : 0,
      api_calls: org.max_api_calls_per_month !== -1 ? Math.max(0, usage.total_api_calls - org.max_api_calls_per_month) : 0,
      storage_gb: org.max_storage_gb !== -1 ? Math.max(0, usage.total_storage_gb - org.max_storage_gb) : 0
    };

    // Calculate charges (example pricing)
    const overageCharge = {
      users: overage.users * 5, // $5 per extra user
      api_calls: Math.floor(overage.api_calls / 1000) * 1, // $1 per 1000 extra calls
      storage_gb: overage.storage_gb * 2 // $2 per extra GB
    };

    const totalOverageCharge = overageCharge.users + overageCharge.api_calls + overageCharge.storage_gb;

    // Update organization_usage table
    await pool.query(
      `INSERT INTO organization_usage
       (organization_id, year, month, overage_users, overage_api_calls, overage_storage_gb, overage_charge)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (organization_id, year, month)
       DO UPDATE SET
         overage_users = EXCLUDED.overage_users,
         overage_api_calls = EXCLUDED.overage_api_calls,
         overage_storage_gb = EXCLUDED.overage_storage_gb,
         overage_charge = EXCLUDED.overage_charge,
         updated_at = CURRENT_TIMESTAMP`,
      [organizationId, year, month, overage.users, overage.api_calls, overage.storage_gb, totalOverageCharge]
    );

    return {
      overage,
      overage_charge: overageCharge,
      total_overage_charge: totalOverageCharge
    };
  }

  /**
   * Get platform-wide statistics (super admin only)
   */
  async getPlatformStats() {
    const totalOrgsResult = await pool.query(
      'SELECT COUNT(*) as count FROM organizations WHERE is_active = true'
    );

    const totalDomainsResult = await pool.query(
      'SELECT COUNT(*) as count FROM domains WHERE is_active = true'
    );

    const totalTenantsResult = await pool.query(
      'SELECT COUNT(*) as count FROM tenants WHERE is_active = true'
    );

    const totalUsersResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE is_active = true'
    );

    const apiCallsTodayResult = await pool.query(
      `SELECT COUNT(*) as count FROM api_usage_log
       WHERE DATE(created_at) = CURRENT_DATE`
    );

    const planDistributionResult = await pool.query(
      `SELECT plan, COUNT(*) as count
       FROM organizations
       WHERE is_active = true
       GROUP BY plan
       ORDER BY count DESC`
    );

    const revenueResult = await pool.query(
      `SELECT
         SUM(total) as total_revenue,
         COUNT(*) as total_invoices
       FROM invoices
       WHERE status = 'paid'`
    );

    return {
      total_organizations: parseInt(totalOrgsResult.rows[0].count),
      total_domains: parseInt(totalDomainsResult.rows[0].count),
      total_tenants: parseInt(totalTenantsResult.rows[0].count),
      total_users: parseInt(totalUsersResult.rows[0].count),
      api_calls_today: parseInt(apiCallsTodayResult.rows[0].count),
      plan_distribution: planDistributionResult.rows,
      revenue: {
        total: parseFloat(revenueResult.rows[0].total_revenue || 0),
        invoices: parseInt(revenueResult.rows[0].total_invoices || 0)
      }
    };
  }
}

export default new AnalyticsService();
