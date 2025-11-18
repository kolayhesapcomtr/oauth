import * as crypto from 'crypto';

export interface PayTRCredentials {
  merchant_id: string;
  merchant_key: string;
  merchant_salt: string;
}

export interface PayTRPaymentRequest {
  amount: number;  // in smallest currency unit (kuruş)
  currency: string;
  merchant_oid: string;  // Order ID
  payer_email: string;
  payer_name: string;
  payer_phone: string;
  callback_url: string;
  success_url: string;
  fail_url: string;
  items?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

export interface PayTRPaymentResponse {
  status: string;
  payment_url?: string;
  token?: string;
  error_message?: string;
}

export class PayTRService {
  private baseUrl: string = 'https://www.paytr.com';

  constructor(private isLiveMode: boolean = false) {
    // PayTR uses same URL for both test and live, credentials determine the mode
  }

  /**
   * Generate PayTR hash token
   */
  private generatePaymentToken(
    credentials: PayTRCredentials,
    merchantOid: string,
    email: string,
    amount: number,
    userBasket: string,
    noInstallment: number = 0,
    maxInstallment: number = 0,
    userIp: string = '127.0.0.1'
  ): string {
    const hashStr =
      credentials.merchant_id +
      userIp +
      merchantOid +
      email +
      amount.toString() +
      userBasket +
      noInstallment.toString() +
      maxInstallment.toString() +
      credentials.currency || 'TL' +
      (this.isLiveMode ? '1' : '0') +  // test_mode
      credentials.merchant_salt;

    return crypto
      .createHmac('sha256', credentials.merchant_key)
      .update(hashStr)
      .digest('base64');
  }

  /**
   * Test API credentials
   */
  async testCredentials(credentials: PayTRCredentials): Promise<boolean> {
    try {
      // PayTR doesn't have a test endpoint, we just validate format
      return !!(
        credentials.merchant_id &&
        credentials.merchant_key &&
        credentials.merchant_salt
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Create payment iframe token
   */
  async createPayment(
    credentials: PayTRCredentials,
    paymentRequest: PayTRPaymentRequest,
    userIp: string = '127.0.0.1'
  ): Promise<PayTRPaymentResponse> {
    try {
      // Prepare user basket
      const userBasket = this.prepareUserBasket(paymentRequest);

      // Generate payment token
      const paytrToken = this.generatePaymentToken(
        credentials,
        paymentRequest.merchant_oid,
        paymentRequest.payer_email,
        paymentRequest.amount / 100,  // Convert to lira
        userBasket,
        0,  // no_installment
        0,  // max_installment
        userIp
      );

      // Prepare form data
      const formData = new URLSearchParams({
        merchant_id: credentials.merchant_id,
        merchant_oid: paymentRequest.merchant_oid,
        email: paymentRequest.payer_email,
        payment_amount: (paymentRequest.amount / 100 * 100).toString(),  // Kuruş cinsinden
        user_basket: userBasket,
        paytr_token: paytrToken,
        user_name: paymentRequest.payer_name,
        user_address: 'Adres',  // Required by PayTR
        user_phone: paymentRequest.payer_phone || '5555555555',
        merchant_ok_url: paymentRequest.success_url,
        merchant_fail_url: paymentRequest.fail_url,
        user_ip: userIp,
        timeout_limit: '30',
        debug_on: this.isLiveMode ? '0' : '1',
        test_mode: this.isLiveMode ? '0' : '1',
        no_installment: '0',
        max_installment: '0',
        currency: paymentRequest.currency || 'TL',
        lang: 'tr',
      });

      // Make request to PayTR
      const response = await fetch(`${this.baseUrl}/odeme/api/get-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await response.json();

      if (result.status === 'success') {
        return {
          status: 'success',
          token: result.token,
          payment_url: `${this.baseUrl}/odeme/guvenli/${result.token}`,
        };
      } else {
        return {
          status: 'failure',
          error_message: result.reason || 'Payment initialization failed',
        };
      }
    } catch (error: any) {
      console.error('PayTR create payment error:', error);
      return {
        status: 'failure',
        error_message: error.message || 'Failed to create payment',
      };
    }
  }

  /**
   * Prepare user basket for PayTR
   */
  private prepareUserBasket(paymentRequest: PayTRPaymentRequest): string {
    if (paymentRequest.items && paymentRequest.items.length > 0) {
      const basketItems = paymentRequest.items.map((item) => [
        item.name,
        (item.price / 100).toFixed(2),  // Convert to lira
        item.quantity.toString(),
      ]);

      return Buffer.from(JSON.stringify(basketItems)).toString('base64');
    }

    // Default basket item
    const defaultBasket = [
      ['Abonelik', (paymentRequest.amount / 100).toFixed(2), '1'],
    ];

    return Buffer.from(JSON.stringify(defaultBasket)).toString('base64');
  }

  /**
   * Verify callback (webhook) from PayTR
   */
  verifyCallback(
    credentials: PayTRCredentials,
    merchantOid: string,
    status: string,
    totalAmount: number,
    receivedHash: string
  ): boolean {
    const hash =
      merchantOid +
      credentials.merchant_salt +
      status +
      totalAmount.toString();

    const calculatedHash = crypto
      .createHmac('sha256', credentials.merchant_key)
      .update(hash)
      .digest('base64');

    return calculatedHash === receivedHash;
  }

  /**
   * Parse callback data
   */
  parseCallback(body: any): {
    merchant_oid: string;
    status: string;
    total_amount: number;
    hash: string;
    failed_reason_code?: string;
    failed_reason_msg?: string;
    test_mode: string;
    payment_type: string;
    payment_amount: number;
    currency: string;
  } {
    return {
      merchant_oid: body.merchant_oid,
      status: body.status,
      total_amount: parseFloat(body.total_amount || '0'),
      hash: body.hash,
      failed_reason_code: body.failed_reason_code,
      failed_reason_msg: body.failed_reason_msg,
      test_mode: body.test_mode,
      payment_type: body.payment_type,
      payment_amount: parseFloat(body.payment_amount || '0'),
      currency: body.currency,
    };
  }

  /**
   * Create refund
   */
  async createRefund(
    credentials: PayTRCredentials,
    merchantOid: string,
    amount: number,  // in kuruş
    reason?: string
  ): Promise<any> {
    try {
      const refundAmount = (amount / 100).toString();  // Convert to lira

      const hashStr =
        credentials.merchant_id +
        merchantOid +
        refundAmount +
        credentials.merchant_salt;

      const returnHash = crypto
        .createHmac('sha256', credentials.merchant_key)
        .update(hashStr)
        .digest('base64');

      const formData = new URLSearchParams({
        merchant_id: credentials.merchant_id,
        merchant_oid: merchantOid,
        return_amount: refundAmount,
        return_hash: returnHash,
        reason: reason || 'Müşteri talebi',
      });

      const response = await fetch(`${this.baseUrl}/odeme/iade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      return await response.json();
    } catch (error) {
      console.error('PayTR refund error:', error);
      throw new Error('Failed to create refund');
    }
  }
}

export default PayTRService;
