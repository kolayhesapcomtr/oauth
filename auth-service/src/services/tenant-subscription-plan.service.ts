import { query } from '../config/database';

export interface TenantSubscriptionPlan {
  id: string;
  organization_id: string;
  domain_id?: string;
  name: string;
  slug: string;
  description?: string;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  max_users: number;
  max_storage_gb: number;
  max_api_calls_per_month: number;
  max_custom_fields: number;
  features: any;
  has_trial: boolean;
  trial_days: number;
  display_order: number;
  is_active: boolean;
  is_public: boolean;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export class TenantSubscriptionPlanService {
  /**
   * List tenant subscription plans
   */
  async list(filters: {
    organization_id: string;
    domain_id?: string;
    is_active?: boolean;
  }): Promise<TenantSubscriptionPlan[]> {
    const conditions: string[] = ['organization_id = $1'];
    const values: any[] = [filters.organization_id];
    let paramIndex = 2;

    if (filters.domain_id) {
      conditions.push(`(domain_id = $${paramIndex} OR domain_id IS NULL)`);
      values.push(filters.domain_id);
      paramIndex++;
    }

    if (filters.is_active !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      values.push(filters.is_active);
      paramIndex++;
    }

    const result = await query(
      `SELECT * FROM tenant_subscription_plans
       WHERE ${conditions.join(' AND ')}
       ORDER BY display_order ASC, created_at DESC`,
      values
    );

    return result.rows;
  }

  /**
   * List public plans (for tenant signup)
   */
  async listPublic(filters: {
    organization_id: string;
    domain_id?: string;
  }): Promise<TenantSubscriptionPlan[]> {
    const conditions: string[] = [
      'organization_id = $1',
      'is_active = true',
      'is_public = true',
    ];
    const values: any[] = [filters.organization_id];

    if (filters.domain_id) {
      conditions.push('(domain_id = $2 OR domain_id IS NULL)');
      values.push(filters.domain_id);
    }

    const result = await query(
      `SELECT * FROM tenant_subscription_plans
       WHERE ${conditions.join(' AND ')}
       ORDER BY display_order ASC, monthly_price ASC`,
      values
    );

    return result.rows;
  }

  /**
   * Get plan by ID
   */
  async getById(id: string): Promise<TenantSubscriptionPlan | null> {
    const result = await query(
      'SELECT * FROM tenant_subscription_plans WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Create new plan
   */
  async create(
    planData: Partial<TenantSubscriptionPlan>,
    createdBy?: string
  ): Promise<TenantSubscriptionPlan> {
    // Check if slug already exists for this organization
    const existing = await query(
      'SELECT id FROM tenant_subscription_plans WHERE organization_id = $1 AND slug = $2',
      [planData.organization_id, planData.slug]
    );

    if (existing.rows.length > 0) {
      throw new Error(`Plan with slug '${planData.slug}' already exists for this organization`);
    }

    const result = await query(
      `INSERT INTO tenant_subscription_plans (
        organization_id, domain_id, name, slug, description,
        monthly_price, yearly_price, currency,
        max_users, max_storage_gb, max_api_calls_per_month, max_custom_fields,
        features, has_trial, trial_days,
        display_order, is_active, is_public, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        planData.organization_id,
        planData.domain_id || null,
        planData.name,
        planData.slug,
        planData.description || null,
        planData.monthly_price || 0,
        planData.yearly_price || 0,
        planData.currency || 'USD',
        planData.max_users || 10,
        planData.max_storage_gb || 1,
        planData.max_api_calls_per_month || 10000,
        planData.max_custom_fields || 5,
        JSON.stringify(planData.features || {}),
        planData.has_trial || false,
        planData.trial_days || 0,
        planData.display_order || 0,
        planData.is_active !== undefined ? planData.is_active : true,
        planData.is_public !== undefined ? planData.is_public : true,
        JSON.stringify(planData.metadata || {}),
      ]
    );

    return result.rows[0];
  }

  /**
   * Update plan
   */
  async update(
    id: string,
    updates: Partial<TenantSubscriptionPlan>
  ): Promise<TenantSubscriptionPlan> {
    const existingPlan = await this.getById(id);
    if (!existingPlan) {
      throw new Error('Plan not found');
    }

    // If slug is being updated, check for conflicts
    if (updates.slug && updates.slug !== existingPlan.slug) {
      const existing = await query(
        'SELECT id FROM tenant_subscription_plans WHERE organization_id = $1 AND slug = $2 AND id != $3',
        [existingPlan.organization_id, updates.slug, id]
      );

      if (existing.rows.length > 0) {
        throw new Error(`Plan with slug '${updates.slug}' already exists for this organization`);
      }
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const updateableFields = [
      'name', 'slug', 'description', 'monthly_price', 'yearly_price', 'currency',
      'max_users', 'max_storage_gb', 'max_api_calls_per_month', 'max_custom_fields',
      'features', 'has_trial', 'trial_days', 'display_order', 'is_active', 'is_public',
      'metadata', 'domain_id',
    ];

    updateableFields.forEach((field) => {
      if (updates[field as keyof TenantSubscriptionPlan] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        let value = updates[field as keyof TenantSubscriptionPlan];

        // Stringify JSON fields
        if (field === 'features' || field === 'metadata') {
          value = JSON.stringify(value);
        }

        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return existingPlan;
    }

    values.push(id);

    const result = await query(
      `UPDATE tenant_subscription_plans
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete plan
   */
  async delete(id: string): Promise<void> {
    const result = await query(
      'DELETE FROM tenant_subscription_plans WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Plan not found');
    }
  }

  /**
   * Get tenants subscribed to this plan
   */
  async getPlanTenants(planId: string): Promise<any[]> {
    const result = await query(
      `SELECT
        t.id, t.name, t.slug, t.subscription_status,
        t.subscription_starts_at, t.subscription_ends_at,
        d.name as domain_name,
        (SELECT COUNT(*) FROM user_tenant_roles WHERE tenant_id = t.id AND is_active = true) as active_users
       FROM tenants t
       LEFT JOIN domains d ON t.domain_id = d.id
       WHERE t.subscription_plan_id = $1
       ORDER BY t.created_at DESC`,
      [planId]
    );

    return result.rows;
  }

  /**
   * Clone a plan
   */
  async clone(
    planId: string,
    newName: string,
    newSlug: string,
    createdBy?: string
  ): Promise<TenantSubscriptionPlan> {
    const existingPlan = await this.getById(planId);
    if (!existingPlan) {
      throw new Error('Plan not found');
    }

    // Check if new slug already exists
    const slugExists = await query(
      'SELECT id FROM tenant_subscription_plans WHERE organization_id = $1 AND slug = $2',
      [existingPlan.organization_id, newSlug]
    );

    if (slugExists.rows.length > 0) {
      throw new Error(`Plan with slug '${newSlug}' already exists for this organization`);
    }

    // Create new plan with same properties but different name/slug
    return this.create({
      organization_id: existingPlan.organization_id,
      domain_id: existingPlan.domain_id,
      name: newName,
      slug: newSlug,
      description: existingPlan.description,
      monthly_price: existingPlan.monthly_price,
      yearly_price: existingPlan.yearly_price,
      currency: existingPlan.currency,
      max_users: existingPlan.max_users,
      max_storage_gb: existingPlan.max_storage_gb,
      max_api_calls_per_month: existingPlan.max_api_calls_per_month,
      max_custom_fields: existingPlan.max_custom_fields,
      features: existingPlan.features,
      has_trial: existingPlan.has_trial,
      trial_days: existingPlan.trial_days,
      display_order: existingPlan.display_order + 1,
      is_active: true,
      is_public: existingPlan.is_public,
      metadata: { cloned_from: planId },
    }, createdBy);
  }

  /**
   * Get plan statistics
   */
  async getPlanStats(planId: string): Promise<any> {
    const result = await query(
      `SELECT
        COUNT(*) as total_tenants,
        COUNT(CASE WHEN t.subscription_status = 'active' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN t.subscription_status = 'trial' THEN 1 END) as trial_subscriptions,
        SUM((SELECT COUNT(*) FROM user_tenant_roles WHERE tenant_id = t.id AND is_active = true)) as total_users
       FROM tenants t
       WHERE t.subscription_plan_id = $1`,
      [planId]
    );

    return result.rows[0];
  }
}

export default new TenantSubscriptionPlanService();
