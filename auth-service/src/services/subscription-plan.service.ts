import { query } from '../config/database';

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
  features: any;
  stripe_monthly_price_id?: string;
  stripe_yearly_price_id?: string;
  display_order: number;
  is_visible: boolean;
  is_custom: boolean;
  created_at: Date;
  updated_at: Date;
}

export class SubscriptionPlanService {
  /**
   * List all subscription plans
   */
  async list(filters?: {
    is_visible?: boolean;
    is_custom?: boolean;
  }): Promise<SubscriptionPlan[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.is_visible !== undefined) {
      conditions.push(`is_visible = $${paramIndex}`);
      values.push(filters.is_visible);
      paramIndex++;
    }

    if (filters?.is_custom !== undefined) {
      conditions.push(`is_custom = $${paramIndex}`);
      values.push(filters.is_custom);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT * FROM subscription_plans ${whereClause} ORDER BY display_order ASC`,
      values
    );

    return result.rows;
  }

  /**
   * Get plan by ID
   */
  async getById(id: string): Promise<SubscriptionPlan | null> {
    const result = await query(
      'SELECT * FROM subscription_plans WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Create new plan
   */
  async create(planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    // Check if plan with this ID already exists
    const existing = await query(
      'SELECT id FROM subscription_plans WHERE id = $1',
      [planData.id]
    );

    if (existing.rows.length > 0) {
      throw new Error(`Plan with ID '${planData.id}' already exists`);
    }

    const result = await query(
      `INSERT INTO subscription_plans (
        id, name, description,
        monthly_price, yearly_price,
        max_domains, max_tenants, max_users, max_api_calls_per_month, max_storage_gb,
        features,
        stripe_monthly_price_id, stripe_yearly_price_id,
        display_order, is_visible, is_custom
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        planData.id,
        planData.name,
        planData.description || null,
        planData.monthly_price || null,
        planData.yearly_price || null,
        planData.max_domains || -1,
        planData.max_tenants || -1,
        planData.max_users || -1,
        planData.max_api_calls_per_month || -1,
        planData.max_storage_gb || -1,
        JSON.stringify(planData.features || {}),
        planData.stripe_monthly_price_id || null,
        planData.stripe_yearly_price_id || null,
        planData.display_order || 0,
        planData.is_visible !== undefined ? planData.is_visible : true,
        planData.is_custom !== undefined ? planData.is_custom : false,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update plan
   */
  async update(
    id: string,
    updates: Partial<SubscriptionPlan>
  ): Promise<SubscriptionPlan> {
    const existingPlan = await this.getById(id);
    if (!existingPlan) {
      throw new Error('Plan not found');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const updateableFields = [
      'name', 'description', 'monthly_price', 'yearly_price',
      'max_domains', 'max_tenants', 'max_users', 'max_api_calls_per_month', 'max_storage_gb',
      'features', 'stripe_monthly_price_id', 'stripe_yearly_price_id',
      'display_order', 'is_visible', 'is_custom',
    ];

    updateableFields.forEach((field) => {
      if (updates[field as keyof SubscriptionPlan] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        let value = updates[field as keyof SubscriptionPlan];

        // Stringify JSON fields
        if (field === 'features') {
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
      `UPDATE subscription_plans
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
      'DELETE FROM subscription_plans WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Plan not found');
    }
  }

  /**
   * Get count of organizations using this plan
   */
  async getOrganizationsCount(planId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM organizations WHERE plan = $1',
      [planId]
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * Get plan comparison (for pricing page)
   */
  async getComparison(): Promise<any> {
    const plans = await this.list({ is_visible: true, is_custom: false });

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      monthly_price: plan.monthly_price,
      yearly_price: plan.yearly_price,
      limits: {
        domains: plan.max_domains === -1 ? 'Sınırsız' : plan.max_domains,
        tenants: plan.max_tenants === -1 ? 'Sınırsız' : plan.max_tenants,
        users: plan.max_users === -1 ? 'Sınırsız' : plan.max_users,
        api_calls: plan.max_api_calls_per_month === -1 ? 'Sınırsız' : plan.max_api_calls_per_month,
        storage: plan.max_storage_gb === -1 ? 'Sınırsız' : `${plan.max_storage_gb} GB`,
      },
      features: plan.features,
    }));
  }
}

export default new SubscriptionPlanService();
