import pool from '../config/database';
import { PoolClient } from 'pg';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  company_name?: string;
  contact_phone?: string;
  plan: string;
  status: string;
  max_domains: number;
  max_tenants: number;
  max_users: number;
  max_api_calls_per_month: number;
  max_storage_gb: number;
  features: Record<string, any>;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  billing_email?: string;
  trial_ends_at?: Date;
  subscription_starts_at?: Date;
  subscription_ends_at?: Date;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  owner_email: string;
  company_name?: string;
  contact_phone?: string;
  billing_email?: string;
  plan?: string;
  metadata?: Record<string, any>;
}

export interface UpdateOrganizationInput {
  name?: string;
  company_name?: string;
  contact_phone?: string;
  billing_email?: string;
  metadata?: Record<string, any>;
}

export interface OrganizationUsage {
  current_domains: number;
  current_tenants: number;
  current_users: number;
  current_api_calls: number;
  max_domains: number;
  max_tenants: number;
  max_users: number;
  max_api_calls_per_month: number;
  domains_percentage: number;
  tenants_percentage: number;
  users_percentage: number;
  api_calls_percentage: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  monthly_price?: number;
  yearly_price?: number;
  max_domains: number;
  max_tenants: number;
  max_users: number;
  max_api_calls_per_month: number;
  max_storage_gb: number;
  features: Record<string, any>;
  stripe_monthly_price_id?: string;
  stripe_yearly_price_id?: string;
}

class OrganizationService {
  /**
   * Create a new organization (signup/onboarding)
   */
  async createOrganization(data: CreateOrganizationInput): Promise<Organization> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if slug already exists
      const slugCheck = await client.query(
        'SELECT id FROM organizations WHERE slug = $1',
        [data.slug]
      );

      if (slugCheck.rows.length > 0) {
        throw new Error('Organization slug already exists');
      }

      // Get plan details
      const plan = data.plan || 'trial';
      const planResult = await client.query(
        'SELECT * FROM subscription_plans WHERE id = $1',
        [plan]
      );

      if (planResult.rows.length === 0) {
        throw new Error('Invalid plan');
      }

      const planDetails = planResult.rows[0];

      // Set trial end date (14 days from now for trial plans)
      const trialEndsAt = plan === 'trial'
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        : null;

      // Create organization
      const result = await client.query(
        `INSERT INTO organizations (
          name, slug, owner_email, company_name, contact_phone,
          billing_email, plan, status,
          max_domains, max_tenants, max_users, max_api_calls_per_month, max_storage_gb,
          features, trial_ends_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          data.name,
          data.slug,
          data.owner_email,
          data.company_name,
          data.contact_phone,
          data.billing_email || data.owner_email,
          plan,
          plan === 'trial' ? 'trial' : 'active',
          planDetails.max_domains,
          planDetails.max_tenants,
          planDetails.max_users,
          planDetails.max_api_calls_per_month,
          planDetails.max_storage_gb,
          planDetails.features,
          trialEndsAt,
          JSON.stringify(data.metadata || {})
        ]
      );

      const organization = result.rows[0];

      // Log event
      await client.query(
        `INSERT INTO organization_events (organization_id, event_type, actor_type, metadata)
         VALUES ($1, $2, $3, $4)`,
        [
          organization.id,
          'organization.created',
          'system',
          JSON.stringify({ plan, trial_ends_at: trialEndsAt })
        ]
      );

      // Initialize usage tracking for current month
      await this.initializeMonthlyUsage(organization.id, client);

      await client.query('COMMIT');
      return organization;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(organizationId: string): Promise<Organization | null> {
    const result = await pool.query(
      'SELECT * FROM organizations WHERE id = $1 AND is_active = true',
      [organizationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get organization by slug
   */
  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    const result = await pool.query(
      'SELECT * FROM organizations WHERE slug = $1 AND is_active = true',
      [slug]
    );

    return result.rows[0] || null;
  }

  /**
   * Update organization
   */
  async updateOrganization(
    organizationId: string,
    data: UpdateOrganizationInput
  ): Promise<Organization> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.company_name !== undefined) {
      fields.push(`company_name = $${paramCount++}`);
      values.push(data.company_name);
    }
    if (data.contact_phone !== undefined) {
      fields.push(`contact_phone = $${paramCount++}`);
      values.push(data.contact_phone);
    }
    if (data.billing_email !== undefined) {
      fields.push(`billing_email = $${paramCount++}`);
      values.push(data.billing_email);
    }
    if (data.metadata !== undefined) {
      fields.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(data.metadata));
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(organizationId);

    const result = await pool.query(
      `UPDATE organizations SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Organization not found');
    }

    return result.rows[0];
  }

  /**
   * Get organization usage and limits
   */
  async getOrganizationUsage(organizationId: string): Promise<OrganizationUsage> {
    const result = await pool.query(
      'SELECT * FROM v_organization_overview WHERE id = $1',
      [organizationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Organization not found');
    }

    const org = result.rows[0];

    // Get current month's API calls
    const apiCallsResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM api_usage_log
       WHERE organization_id = $1
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)`,
      [organizationId]
    );

    const currentApiCalls = parseInt(apiCallsResult.rows[0].count);

    const calculatePercentage = (current: number, max: number) => {
      if (max === -1) return 0; // Unlimited
      return max === 0 ? 0 : Math.round((current / max) * 100);
    };

    return {
      current_domains: org.current_domains,
      current_tenants: org.current_tenants,
      current_users: org.current_users,
      current_api_calls: currentApiCalls,
      max_domains: org.max_domains,
      max_tenants: org.max_tenants,
      max_users: org.max_users,
      max_api_calls_per_month: org.max_api_calls_per_month,
      domains_percentage: calculatePercentage(org.current_domains, org.max_domains),
      tenants_percentage: calculatePercentage(org.current_tenants, org.max_tenants),
      users_percentage: calculatePercentage(org.current_users, org.max_users),
      api_calls_percentage: calculatePercentage(currentApiCalls, org.max_api_calls_per_month)
    };
  }

  /**
   * Check if organization can add more of a resource
   */
  async checkLimit(
    organizationId: string,
    limitType: 'domains' | 'tenants' | 'users' | 'api_calls'
  ): Promise<{ allowed: boolean; current: number; max: number; message?: string }> {
    const usage = await this.getOrganizationUsage(organizationId);

    let current: number;
    let max: number;

    switch (limitType) {
      case 'domains':
        current = usage.current_domains;
        max = usage.max_domains;
        break;
      case 'tenants':
        current = usage.current_tenants;
        max = usage.max_tenants;
        break;
      case 'users':
        current = usage.current_users;
        max = usage.max_users;
        break;
      case 'api_calls':
        current = usage.current_api_calls;
        max = usage.max_api_calls_per_month;
        break;
    }

    // -1 means unlimited (enterprise)
    if (max === -1) {
      return { allowed: true, current, max };
    }

    const allowed = current < max;

    return {
      allowed,
      current,
      max,
      message: allowed
        ? undefined
        : `${limitType} limit reached. Current: ${current}, Max: ${max}. Please upgrade your plan.`
    };
  }

  /**
   * Change organization plan
   */
  async changePlan(
    organizationId: string,
    newPlanId: string,
    actorUserId?: string
  ): Promise<Organization> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get new plan details
      const planResult = await client.query(
        'SELECT * FROM subscription_plans WHERE id = $1',
        [newPlanId]
      );

      if (planResult.rows.length === 0) {
        throw new Error('Invalid plan');
      }

      const plan = planResult.rows[0];

      // Get current organization
      const orgResult = await client.query(
        'SELECT * FROM organizations WHERE id = $1',
        [organizationId]
      );

      if (orgResult.rows.length === 0) {
        throw new Error('Organization not found');
      }

      const currentOrg = orgResult.rows[0];

      // Update organization with new plan limits
      const updateResult = await client.query(
        `UPDATE organizations
         SET plan = $1,
             status = $2,
             max_domains = $3,
             max_tenants = $4,
             max_users = $5,
             max_api_calls_per_month = $6,
             max_storage_gb = $7,
             features = $8,
             subscription_starts_at = CASE
               WHEN subscription_starts_at IS NULL THEN CURRENT_TIMESTAMP
               ELSE subscription_starts_at
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $9
         RETURNING *`,
        [
          newPlanId,
          newPlanId === 'trial' ? 'trial' : 'active',
          plan.max_domains,
          plan.max_tenants,
          plan.max_users,
          plan.max_api_calls_per_month,
          plan.max_storage_gb,
          plan.features,
          organizationId
        ]
      );

      // Log event
      await client.query(
        `INSERT INTO organization_events (organization_id, event_type, actor_user_id, actor_type, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          organizationId,
          'plan.changed',
          actorUserId,
          actorUserId ? 'user' : 'system',
          JSON.stringify({
            old_plan: currentOrg.plan,
            new_plan: newPlanId,
            old_limits: {
              domains: currentOrg.max_domains,
              tenants: currentOrg.max_tenants,
              users: currentOrg.max_users
            },
            new_limits: {
              domains: plan.max_domains,
              tenants: plan.max_tenants,
              users: plan.max_users
            }
          })
        ]
      );

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all subscription plans
   */
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    const result = await pool.query(
      `SELECT * FROM subscription_plans
       WHERE is_visible = true
       ORDER BY display_order ASC`
    );

    return result.rows;
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(organizationId: string) {
    const usage = await this.getOrganizationUsage(organizationId);

    // Get monthly API calls trend (last 6 months)
    const apiTrendResult = await pool.query(
      `SELECT
         year,
         month,
         total_api_calls,
         total_users,
         total_domains,
         total_tenants
       FROM organization_usage
       WHERE organization_id = $1
       ORDER BY year DESC, month DESC
       LIMIT 6`,
      [organizationId]
    );

    // Get recent events
    const eventsResult = await pool.query(
      `SELECT * FROM organization_events
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [organizationId]
    );

    // Get active domains
    const domainsResult = await pool.query(
      `SELECT id, name, domain, is_active, created_at
       FROM domains
       WHERE organization_id = $1 AND is_active = true`,
      [organizationId]
    );

    return {
      usage,
      monthly_trend: apiTrendResult.rows,
      recent_events: eventsResult.rows,
      domains: domainsResult.rows
    };
  }

  /**
   * List all organizations (for super admin)
   */
  async listOrganizations(filters?: {
    status?: string;
    plan?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions: string[] = ['is_active = true'];
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(filters.status);
    }

    if (filters?.plan) {
      conditions.push(`plan = $${paramCount++}`);
      values.push(filters.plan);
    }

    if (filters?.search) {
      conditions.push(`(name ILIKE $${paramCount} OR slug ILIKE $${paramCount} OR owner_email ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM organizations WHERE ${conditions.join(' AND ')}`,
      values
    );

    const result = await pool.query(
      `SELECT * FROM v_organization_overview
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, limit, offset]
    );

    return {
      organizations: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  }

  /**
   * Deactivate organization
   */
  async deactivateOrganization(organizationId: string, actorUserId?: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        'UPDATE organizations SET is_active = false, status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['suspended', organizationId]
      );

      // Log event
      await client.query(
        `INSERT INTO organization_events (organization_id, event_type, actor_user_id, actor_type, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          organizationId,
          'organization.deactivated',
          actorUserId,
          actorUserId ? 'user' : 'system',
          JSON.stringify({ reason: 'manual_deactivation' })
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reactivate organization
   */
  async reactivateOrganization(organizationId: string, actorUserId?: string): Promise<Organization> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        'UPDATE organizations SET is_active = true, status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        ['active', organizationId]
      );

      if (result.rows.length === 0) {
        throw new Error('Organization not found');
      }

      // Log event
      await client.query(
        `INSERT INTO organization_events (organization_id, event_type, actor_user_id, actor_type, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          organizationId,
          'organization.reactivated',
          actorUserId,
          actorUserId ? 'user' : 'system',
          JSON.stringify({})
        ]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Log API usage
   */
  async logApiUsage(data: {
    organization_id: string;
    user_id?: string;
    endpoint: string;
    method: string;
    status_code: number;
    response_time_ms: number;
    domain_id?: string;
    tenant_id?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    await pool.query(
      `INSERT INTO api_usage_log
       (organization_id, user_id, endpoint, method, status_code, response_time_ms,
        domain_id, tenant_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        data.organization_id,
        data.user_id,
        data.endpoint,
        data.method,
        data.status_code,
        data.response_time_ms,
        data.domain_id,
        data.tenant_id,
        data.ip_address,
        data.user_agent
      ]
    );

    // Update monthly usage
    await this.updateMonthlyUsage(data.organization_id);
  }

  /**
   * Initialize monthly usage tracking
   */
  private async initializeMonthlyUsage(organizationId: string, client?: PoolClient): Promise<void> {
    const db = client || pool;

    await db.query(
      `SELECT update_monthly_usage($1)`,
      [organizationId]
    );
  }

  /**
   * Update monthly usage
   */
  private async updateMonthlyUsage(organizationId: string): Promise<void> {
    await pool.query(
      `SELECT update_monthly_usage($1)`,
      [organizationId]
    );
  }
}

export default new OrganizationService();
