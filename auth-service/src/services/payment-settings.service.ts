import { query } from '../config/database';
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY || 'default-encryption-key-please-change-in-production';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

export interface PaymentProvider {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
  supports_subscriptions: boolean;
  supports_sub_merchant: boolean;
  required_credentials: any;
  setup_instructions?: string;
  documentation_url?: string;
}

export interface PaymentSettings {
  id: string;
  organization_id: string;
  payment_provider_id: string;
  credentials: any;
  is_active: boolean;
  is_live_mode: boolean;
  commission_type: string;
  commission_percentage: number;
  commission_fixed_amount: number;
  test_credentials?: any;
  setup_completed_at?: Date;
  last_verified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export class PaymentSettingsService {
  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Get all available payment providers
   */
  async getProviders(filters?: { is_active?: boolean }): Promise<PaymentProvider[]> {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters?.is_active !== undefined) {
      conditions.push('is_active = $1');
      values.push(filters.is_active);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT * FROM payment_providers ${whereClause} ORDER BY id`,
      values
    );

    return result.rows;
  }

  /**
   * Get provider by ID
   */
  async getProvider(providerId: string): Promise<PaymentProvider | null> {
    const result = await query(
      'SELECT * FROM payment_providers WHERE id = $1',
      [providerId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get organization payment settings
   */
  async getOrganizationSettings(organizationId: string): Promise<PaymentSettings[]> {
    const result = await query(
      'SELECT * FROM organization_payment_settings WHERE organization_id = $1 ORDER BY created_at DESC',
      [organizationId]
    );

    // Decrypt credentials
    return result.rows.map((row) => ({
      ...row,
      credentials: row.credentials ? JSON.parse(this.decrypt(JSON.stringify(row.credentials))) : {},
      test_credentials: row.test_credentials ? JSON.parse(this.decrypt(JSON.stringify(row.test_credentials))) : {},
    }));
  }

  /**
   * Get settings by ID
   */
  async getSettingsById(settingsId: string): Promise<PaymentSettings | null> {
    const result = await query(
      'SELECT * FROM organization_payment_settings WHERE id = $1',
      [settingsId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      credentials: row.credentials ? JSON.parse(this.decrypt(JSON.stringify(row.credentials))) : {},
      test_credentials: row.test_credentials ? JSON.parse(this.decrypt(JSON.stringify(row.test_credentials))) : {},
    };
  }

  /**
   * Create payment settings
   */
  async createSettings(data: {
    organization_id: string;
    payment_provider_id: string;
    credentials: any;
    is_live_mode?: boolean;
    commission_percentage?: number;
    commission_type?: string;
    test_credentials?: any;
  }): Promise<PaymentSettings> {
    // Encrypt credentials
    const encryptedCredentials = this.encrypt(JSON.stringify(data.credentials));
    const encryptedTestCredentials = data.test_credentials
      ? this.encrypt(JSON.stringify(data.test_credentials))
      : null;

    const result = await query(
      `INSERT INTO organization_payment_settings (
        organization_id, payment_provider_id, credentials,
        is_live_mode, commission_type, commission_percentage,
        test_credentials, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.organization_id,
        data.payment_provider_id,
        encryptedCredentials,
        data.is_live_mode || false,
        data.commission_type || 'percentage',
        data.commission_percentage || 10.00,
        encryptedTestCredentials,
        true,
      ]
    );

    const row = result.rows[0];
    return {
      ...row,
      credentials: data.credentials,
      test_credentials: data.test_credentials,
    };
  }

  /**
   * Update payment settings
   */
  async updateSettings(settingsId: string, updates: Partial<PaymentSettings>): Promise<PaymentSettings> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Handle credential updates
    if (updates.credentials) {
      fields.push(`credentials = $${paramIndex}`);
      values.push(this.encrypt(JSON.stringify(updates.credentials)));
      paramIndex++;
    }

    if (updates.test_credentials) {
      fields.push(`test_credentials = $${paramIndex}`);
      values.push(this.encrypt(JSON.stringify(updates.test_credentials)));
      paramIndex++;
    }

    // Handle other fields
    const simpleFields = ['is_active', 'is_live_mode', 'commission_type', 'commission_percentage', 'commission_fixed_amount'];
    simpleFields.forEach((field) => {
      if (updates[field as keyof PaymentSettings] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(updates[field as keyof PaymentSettings]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      const existing = await this.getSettingsById(settingsId);
      if (!existing) throw new Error('Settings not found');
      return existing;
    }

    values.push(settingsId);

    const result = await query(
      `UPDATE organization_payment_settings
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Settings not found');
    }

    const row = result.rows[0];
    return {
      ...row,
      credentials: row.credentials ? JSON.parse(this.decrypt(JSON.stringify(row.credentials))) : {},
      test_credentials: row.test_credentials ? JSON.parse(this.decrypt(JSON.stringify(row.test_credentials))) : {},
    };
  }

  /**
   * Delete payment settings
   */
  async deleteSettings(settingsId: string): Promise<void> {
    const result = await query(
      'DELETE FROM organization_payment_settings WHERE id = $1 RETURNING id',
      [settingsId]
    );

    if (result.rows.length === 0) {
      throw new Error('Settings not found');
    }
  }

  /**
   * Mark settings as verified
   */
  async markAsVerified(settingsId: string): Promise<void> {
    await query(
      `UPDATE organization_payment_settings
       SET last_verified_at = CURRENT_TIMESTAMP, setup_completed_at = COALESCE(setup_completed_at, CURRENT_TIMESTAMP)
       WHERE id = $1`,
      [settingsId]
    );
  }

  /**
   * Get active settings for organization
   */
  async getActiveSettings(organizationId: string, providerId?: string): Promise<PaymentSettings | null> {
    const conditions = ['organization_id = $1', 'is_active = true'];
    const values: any[] = [organizationId];

    if (providerId) {
      conditions.push('payment_provider_id = $2');
      values.push(providerId);
    }

    const result = await query(
      `SELECT * FROM organization_payment_settings
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT 1`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      credentials: row.credentials ? JSON.parse(this.decrypt(JSON.stringify(row.credentials))) : {},
      test_credentials: row.test_credentials ? JSON.parse(this.decrypt(JSON.stringify(row.test_credentials))) : {},
    };
  }
}

export default new PaymentSettingsService();
