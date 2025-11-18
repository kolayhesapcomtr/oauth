import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import paymentSettingsService from '../services/payment-settings.service';
import { IyzicoService } from '../services/providers/iyzico.service';
import { PayTRService } from '../services/providers/paytr.service';
import { query } from '../config/database';

export class PaymentController {
  /**
   * List all available payment providers
   */
  async listProviders(req: Request, res: Response) {
    try {
      const providers = await paymentSettingsService.getProviders({ is_active: true });
      res.json({ data: providers });
    } catch (error: any) {
      console.error('List providers error:', error);
      res.status(500).json({ error: 'Failed to list payment providers' });
    }
  }

  /**
   * Get payment provider details
   */
  async getProvider(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const provider = await paymentSettingsService.getProvider(id);

      if (!provider) {
        return res.status(404).json({ error: 'Payment provider not found' });
      }

      res.json({ data: provider });
    } catch (error: any) {
      console.error('Get provider error:', error);
      res.status(500).json({ error: 'Failed to get payment provider' });
    }
  }

  /**
   * Get organization's payment settings
   */
  async getOrganizationSettings(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user?.organization_id;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const settings = await paymentSettingsService.getOrganizationSettings(organizationId);
      res.json({ data: settings });
    } catch (error: any) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Failed to get payment settings' });
    }
  }

  /**
   * Setup payment provider
   */
  async setupPaymentProvider(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user?.organization_id;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const { payment_provider_id, credentials, is_live_mode, commission_percentage, test_credentials } = req.body;

      if (!payment_provider_id || !credentials) {
        return res.status(400).json({ error: 'Payment provider ID and credentials are required' });
      }

      // Verify the provider exists
      const provider = await paymentSettingsService.getProvider(payment_provider_id);
      if (!provider) {
        return res.status(404).json({ error: 'Payment provider not found' });
      }

      const settings = await paymentSettingsService.createSettings({
        organization_id: organizationId,
        payment_provider_id,
        credentials,
        is_live_mode: is_live_mode || false,
        commission_percentage: commission_percentage || 10.00,
        test_credentials,
      });

      res.status(201).json({
        message: 'Payment provider setup successfully',
        data: settings,
      });
    } catch (error: any) {
      console.error('Setup provider error:', error);
      res.status(500).json({ error: error.message || 'Failed to setup payment provider' });
    }
  }

  /**
   * Update payment settings
   */
  async updatePaymentSettings(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const settings = await paymentSettingsService.updateSettings(id, updates);

      res.json({
        message: 'Payment settings updated successfully',
        data: settings,
      });
    } catch (error: any) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: error.message || 'Failed to update payment settings' });
    }
  }

  /**
   * Delete payment settings
   */
  async deletePaymentSettings(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await paymentSettingsService.deleteSettings(id);

      res.json({ message: 'Payment settings deleted successfully' });
    } catch (error: any) {
      console.error('Delete settings error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete payment settings' });
    }
  }

  /**
   * Verify payment credentials
   */
  async verifyCredentials(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const settings = await paymentSettingsService.getSettingsById(id);
      if (!settings) {
        return res.status(404).json({ error: 'Payment settings not found' });
      }

      const credentials = settings.is_live_mode ? settings.credentials : settings.test_credentials;
      if (!credentials) {
        return res.status(400).json({ error: 'No credentials found for current mode' });
      }

      let isValid = false;

      // Test credentials with provider
      if (settings.payment_provider_id === 'iyzico') {
        const iyzicoService = new IyzicoService(settings.is_live_mode);
        isValid = await iyzicoService.testCredentials(credentials);
      } else if (settings.payment_provider_id === 'paytr') {
        const paytrService = new PayTRService(settings.is_live_mode);
        isValid = await paytrService.testCredentials(credentials);
      } else {
        return res.status(400).json({ error: 'Provider does not support credential verification' });
      }

      if (isValid) {
        await paymentSettingsService.markAsVerified(id);
        res.json({
          success: true,
          message: 'Credentials verified successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Invalid credentials - verification failed',
        });
      }
    } catch (error: any) {
      console.error('Verify credentials error:', error);
      res.status(500).json({ error: error.message || 'Failed to verify credentials' });
    }
  }

  /**
   * Create payment
   */
  async createPayment(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user?.organization_id;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const {
        tenant_id,
        amount,
        currency = 'TRY',
        payer_email,
        payer_name,
        callback_url,
        description,
      } = req.body;

      if (!tenant_id || !amount || !payer_email || !payer_name || !callback_url) {
        return res.status(400).json({ error: 'Missing required payment fields' });
      }

      // Get active payment settings for organization
      const settings = await paymentSettingsService.getActiveSettings(organizationId);
      if (!settings) {
        return res.status(400).json({ error: 'No active payment provider configured' });
      }

      const credentials = settings.is_live_mode ? settings.credentials : settings.test_credentials;

      // Create payment record in database first
      const paymentResult = await query(
        `INSERT INTO tenant_payments (
          tenant_id, organization_id, amount, currency,
          payment_provider_id, payer_email, payer_name,
          status, platform_commission, organization_net_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          tenant_id,
          organizationId,
          amount,
          currency,
          settings.payment_provider_id,
          payer_email,
          payer_name,
          'pending',
          Math.round(amount * (settings.commission_percentage / 100)),
          amount - Math.round(amount * (settings.commission_percentage / 100)),
        ]
      );

      const payment = paymentResult.rows[0];

      let providerResponse;

      // Create payment with provider
      if (settings.payment_provider_id === 'iyzico') {
        const iyzicoService = new IyzicoService(settings.is_live_mode);
        providerResponse = await iyzicoService.createCheckoutForm(
          credentials,
          {
            amount,
            currency,
            conversation_id: payment.id,
            payer_email,
            payer_name,
            callback_url,
          },
          settings.commission_percentage
        );
      } else if (settings.payment_provider_id === 'paytr') {
        const paytrService = new PayTRService(settings.is_live_mode);
        providerResponse = await paytrService.createPayment(
          credentials,
          {
            amount,
            currency,
            merchant_oid: payment.id,
            payer_email,
            payer_name,
            callback_url,
            description: description || 'Subscription Payment',
          },
          req.ip || '127.0.0.1'
        );
      } else {
        return res.status(400).json({ error: 'Unsupported payment provider' });
      }

      if (providerResponse.status === 'success') {
        // Update payment with provider details
        await query(
          'UPDATE tenant_payments SET provider_payment_id = $1 WHERE id = $2',
          [providerResponse.payment_id, payment.id]
        );

        res.status(201).json({
          message: 'Payment created successfully',
          data: {
            payment_id: payment.id,
            payment_url: providerResponse.payment_url,
            token: providerResponse.token,
          },
        });
      } else {
        // Mark payment as failed
        await query(
          'UPDATE tenant_payments SET status = $1, failure_reason = $2, failed_at = CURRENT_TIMESTAMP WHERE id = $3',
          ['failed', providerResponse.error_message, payment.id]
        );

        res.status(400).json({
          error: providerResponse.error_message || 'Failed to create payment',
        });
      }
    } catch (error: any) {
      console.error('Create payment error:', error);
      res.status(500).json({ error: error.message || 'Failed to create payment' });
    }
  }

  /**
   * Handle webhook from payment provider
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      const { provider } = req.params;

      // Log webhook
      await query(
        'INSERT INTO payment_webhooks (payment_provider_id, payload) VALUES ($1, $2)',
        [provider, req.body]
      );

      if (provider === 'iyzico') {
        const { token } = req.body;
        if (!token) {
          return res.status(400).json({ error: 'Token required' });
        }

        // Find payment by token
        const paymentResult = await query(
          'SELECT * FROM tenant_payments WHERE provider_payment_id = $1',
          [token]
        );

        if (paymentResult.rows.length === 0) {
          return res.status(404).json({ error: 'Payment not found' });
        }

        const payment = paymentResult.rows[0];

        // Get organization settings to retrieve payment
        const settings = await paymentSettingsService.getActiveSettings(
          payment.organization_id,
          provider
        );

        if (!settings) {
          return res.status(400).json({ error: 'Payment settings not found' });
        }

        const iyzicoService = new IyzicoService(settings.is_live_mode);
        const result = await iyzicoService.retrieveCheckoutForm(settings.credentials, token);

        if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
          // Update payment status
          await query(
            `UPDATE tenant_payments
             SET status = $1, paid_at = CURRENT_TIMESTAMP,
                 card_last_4 = $2, card_brand = $3, payment_method = $4
             WHERE id = $5`,
            ['completed', result.cardFamily, result.cardType, 'credit_card', payment.id]
          );

          // Create commission record
          await query(
            `INSERT INTO platform_commissions (
              organization_id, payment_id, commission_amount, commission_rate
            ) VALUES ($1, $2, $3, $4)`,
            [payment.organization_id, payment.id, payment.platform_commission, settings.commission_percentage]
          );
        } else {
          await query(
            'UPDATE tenant_payments SET status = $1, failure_reason = $2, failed_at = CURRENT_TIMESTAMP WHERE id = $3',
            ['failed', result.errorMessage || 'Payment failed', payment.id]
          );
        }
      } else if (provider === 'paytr') {
        const { merchant_oid, status, total_amount, hash } = req.body;

        if (!merchant_oid) {
          return res.status(400).json({ error: 'merchant_oid required' });
        }

        const paymentResult = await query(
          'SELECT * FROM tenant_payments WHERE id = $1',
          [merchant_oid]
        );

        if (paymentResult.rows.length === 0) {
          return res.status(404).json({ error: 'Payment not found' });
        }

        const payment = paymentResult.rows[0];

        const settings = await paymentSettingsService.getActiveSettings(
          payment.organization_id,
          provider
        );

        if (!settings) {
          return res.status(400).json({ error: 'Payment settings not found' });
        }

        const paytrService = new PayTRService(settings.is_live_mode);
        const isValid = paytrService.verifyCallback(
          settings.credentials,
          merchant_oid,
          status,
          parseInt(total_amount),
          hash
        );

        if (!isValid) {
          return res.status(400).json({ error: 'Invalid webhook signature' });
        }

        if (status === 'success') {
          await query(
            'UPDATE tenant_payments SET status = $1, paid_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['completed', payment.id]
          );

          await query(
            `INSERT INTO platform_commissions (
              organization_id, payment_id, commission_amount, commission_rate
            ) VALUES ($1, $2, $3, $4)`,
            [payment.organization_id, payment.id, payment.platform_commission, settings.commission_percentage]
          );
        } else {
          await query(
            'UPDATE tenant_payments SET status = $1, failed_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['failed', payment.id]
          );
        }
      }

      // Mark webhook as processed
      await query(
        'UPDATE payment_webhooks SET processed = true WHERE payment_provider_id = $1 ORDER BY created_at DESC LIMIT 1',
        [provider]
      );

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Handle webhook error:', error);
      res.status(500).json({ error: 'Failed to handle webhook' });
    }
  }

  /**
   * Get transactions
   */
  async getTransactions(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user?.organization_id;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const result = await query(
        `SELECT
          tp.*,
          t.name as tenant_name
         FROM tenant_payments tp
         LEFT JOIN tenants t ON tp.tenant_id = t.id
         WHERE tp.organization_id = $1
         ORDER BY tp.created_at DESC`,
        [organizationId]
      );

      res.json({ data: result.rows });
    } catch (error: any) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to get transactions' });
    }
  }

  /**
   * Get single transaction
   */
  async getTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await query(
        `SELECT
          tp.*,
          t.name as tenant_name,
          o.name as organization_name
         FROM tenant_payments tp
         LEFT JOIN tenants t ON tp.tenant_id = t.id
         LEFT JOIN organizations o ON tp.organization_id = o.id
         WHERE tp.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({ data: result.rows[0] });
    } catch (error: any) {
      console.error('Get transaction error:', error);
      res.status(500).json({ error: 'Failed to get transaction' });
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Get payment details
      const paymentResult = await query(
        'SELECT * FROM tenant_payments WHERE id = $1',
        [id]
      );

      if (paymentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      const payment = paymentResult.rows[0];

      if (payment.status !== 'completed') {
        return res.status(400).json({ error: 'Only completed payments can be refunded' });
      }

      if (payment.status === 'refunded') {
        return res.status(400).json({ error: 'Payment already refunded' });
      }

      // Get organization settings
      const settings = await paymentSettingsService.getActiveSettings(
        payment.organization_id,
        payment.payment_provider_id
      );

      if (!settings) {
        return res.status(400).json({ error: 'Payment settings not found' });
      }

      const credentials = settings.is_live_mode ? settings.credentials : settings.test_credentials;

      // Process refund with provider
      let refundResult;

      if (payment.payment_provider_id === 'iyzico') {
        const iyzicoService = new IyzicoService(settings.is_live_mode);
        refundResult = await iyzicoService.createRefund(
          credentials,
          payment.provider_payment_id,
          payment.amount,
          reason
        );
      } else if (payment.payment_provider_id === 'paytr') {
        const paytrService = new PayTRService(settings.is_live_mode);
        refundResult = await paytrService.createRefund(
          credentials,
          payment.id,
          payment.amount,
          reason
        );
      } else {
        return res.status(400).json({ error: 'Refund not supported for this provider' });
      }

      if (refundResult.status === 'success') {
        // Update payment status
        await query(
          'UPDATE tenant_payments SET status = $1, refunded_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['refunded', id]
        );

        // Delete commission record
        await query(
          'DELETE FROM platform_commissions WHERE payment_id = $1',
          [id]
        );

        res.json({
          message: 'Payment refunded successfully',
          data: { id, refund_id: refundResult.refundId },
        });
      } else {
        res.status(400).json({
          error: refundResult.errorMessage || 'Refund failed',
        });
      }
    } catch (error: any) {
      console.error('Refund payment error:', error);
      res.status(500).json({ error: error.message || 'Failed to refund payment' });
    }
  }

  /**
   * Get commissions
   */
  async getCommissions(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user?.organization_id;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const result = await query(
        `SELECT
          pc.*,
          tp.amount as payment_amount,
          tp.payer_name,
          tp.payer_email,
          tp.paid_at
         FROM platform_commissions pc
         JOIN tenant_payments tp ON pc.payment_id = tp.id
         WHERE pc.organization_id = $1
         ORDER BY pc.created_at DESC`,
        [organizationId]
      );

      // Calculate summary
      const totalCommission = result.rows.reduce(
        (sum, row) => sum + parseFloat(row.commission_amount),
        0
      );

      res.json({
        data: result.rows,
        summary: {
          total_commission: totalCommission,
          total_count: result.rows.length,
        },
      });
    } catch (error: any) {
      console.error('Get commissions error:', error);
      res.status(500).json({ error: 'Failed to get commissions' });
    }
  }
}

export default new PaymentController();
