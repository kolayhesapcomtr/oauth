import * as crypto from 'crypto';

export interface IyzicoCredentials {
  api_key: string;
  secret_key: string;
  sub_merchant_key?: string;
}

export interface IyzicoPaymentRequest {
  amount: number;  // in smallest currency unit (kuruş for TRY)
  currency: string;
  conversation_id: string;
  payer_email: string;
  payer_name: string;
  payer_phone?: string;
  callback_url: string;
  items?: Array<{
    name: string;
    price: number;
  }>;
}

export interface IyzicoPaymentResponse {
  status: string;
  payment_id?: string;
  payment_url?: string;
  error_message?: string;
  token?: string;
}

export class IyzicoService {
  private baseUrl: string;

  constructor(private isLiveMode: boolean = false) {
    this.baseUrl = isLiveMode
      ? 'https://api.iyzipay.com'
      : 'https://sandbox-api.iyzipay.com';
  }

  /**
   * Generate iyzico authorization header
   */
  private generateAuthString(
    credentials: IyzicoCredentials,
    randomString: string,
    requestBody: string
  ): string {
    const dataToEncrypt = `${credentials.api_key}${randomString}${requestBody}`;
    const hash = crypto
      .createHmac('sha256', credentials.secret_key)
      .update(dataToEncrypt)
      .digest('base64');

    return `IYZWS ${credentials.api_key}:${hash}`;
  }

  /**
   * Make API request to iyzico
   */
  private async makeRequest(
    credentials: IyzicoCredentials,
    endpoint: string,
    body: any
  ): Promise<any> {
    const randomString = this.generateRandomString();
    const requestBody = JSON.stringify(body);

    const authString = this.generateAuthString(credentials, randomString, requestBody);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': authString,
      'x-iyzi-rnd': randomString,
      'x-iyzi-client-version': 'iyzipay-node-1.0.0',
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: requestBody,
      });

      return await response.json();
    } catch (error) {
      console.error('iyzico API error:', error);
      throw new Error('iyzico API request failed');
    }
  }

  /**
   * Generate random string for request
   */
  private generateRandomString(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Test API credentials
   */
  async testCredentials(credentials: IyzicoCredentials): Promise<boolean> {
    try {
      const response = await this.makeRequest(credentials, '/payment/test', {
        locale: 'tr',
        conversationId: 'test-' + Date.now(),
      });

      return response.status === 'success';
    } catch (error) {
      return false;
    }
  }

  /**
   * Create checkout form (3D Secure payment page)
   */
  async createCheckoutForm(
    credentials: IyzicoCredentials,
    paymentRequest: IyzicoPaymentRequest,
    platformCommissionRate: number = 0
  ): Promise<IyzicoPaymentResponse> {
    try {
      const body: any = {
        locale: 'tr',
        conversationId: paymentRequest.conversation_id,
        price: (paymentRequest.amount / 100).toFixed(2),  // Convert to lira
        paidPrice: (paymentRequest.amount / 100).toFixed(2),
        currency: paymentRequest.currency || 'TRY',
        basketId: paymentRequest.conversation_id,
        paymentGroup: 'SUBSCRIPTION',
        callbackUrl: paymentRequest.callback_url,
        enabledInstallments: [1],
        buyer: {
          id: crypto.randomBytes(8).toString('hex'),
          name: paymentRequest.payer_name.split(' ')[0] || 'Ad',
          surname: paymentRequest.payer_name.split(' ').slice(1).join(' ') || 'Soyad',
          email: paymentRequest.payer_email,
          identityNumber: '11111111111',  // Required by iyzico
          registrationAddress: 'Adres',
          city: 'İstanbul',
          country: 'Turkey',
          ip: '85.34.78.112',  // Should be real IP in production
        },
        shippingAddress: {
          contactName: paymentRequest.payer_name,
          city: 'İstanbul',
          country: 'Turkey',
          address: 'Adres',
        },
        billingAddress: {
          contactName: paymentRequest.payer_name,
          city: 'İstanbul',
          country: 'Turkey',
          address: 'Adres',
        },
        basketItems: paymentRequest.items?.map((item, index) => ({
          id: `item-${index}`,
          name: item.name,
          category1: 'Subscription',
          itemType: 'VIRTUAL',
          price: (item.price / 100).toFixed(2),
        })) || [
          {
            id: 'item-1',
            name: 'Subscription',
            category1: 'Subscription',
            itemType: 'VIRTUAL',
            price: (paymentRequest.amount / 100).toFixed(2),
          },
        ],
      };

      // Add sub merchant if provided (for platform commission)
      if (credentials.sub_merchant_key && platformCommissionRate > 0) {
        body.subMerchantKey = credentials.sub_merchant_key;
        body.subMerchantPrice = (
          paymentRequest.amount *
          (1 - platformCommissionRate / 100) /
          100
        ).toFixed(2);
      }

      const response = await this.makeRequest(credentials, '/payment/iyzipos/checkoutform/initialize/auth/ecom', body);

      if (response.status === 'success') {
        return {
          status: 'success',
          payment_id: response.paymentId,
          payment_url: response.paymentPageUrl,
          token: response.token,
        };
      } else {
        return {
          status: 'failure',
          error_message: response.errorMessage || 'Payment initialization failed',
        };
      }
    } catch (error: any) {
      console.error('iyzico create checkout error:', error);
      return {
        status: 'failure',
        error_message: error.message || 'Failed to create payment',
      };
    }
  }

  /**
   * Retrieve payment result after callback
   */
  async retrieveCheckoutForm(
    credentials: IyzicoCredentials,
    token: string
  ): Promise<any> {
    try {
      const response = await this.makeRequest(credentials, '/payment/iyzipos/checkoutform/auth/ecom/detail', {
        locale: 'tr',
        token,
      });

      return response;
    } catch (error) {
      console.error('iyzico retrieve checkout error:', error);
      throw new Error('Failed to retrieve payment');
    }
  }

  /**
   * Create refund
   */
  async createRefund(
    credentials: IyzicoCredentials,
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<any> {
    try {
      const body: any = {
        locale: 'tr',
        conversationId: 'refund-' + Date.now(),
        paymentTransactionId: paymentId,
        reason: reason || 'customer_request',
      };

      if (amount) {
        body.price = (amount / 100).toFixed(2);
      }

      const response = await this.makeRequest(credentials, '/payment/refund', body);

      return response;
    } catch (error) {
      console.error('iyzico refund error:', error);
      throw new Error('Failed to create refund');
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(
    credentials: IyzicoCredentials,
    paymentId: string,
    reason?: string
  ): Promise<any> {
    try {
      const response = await this.makeRequest(credentials, '/payment/cancel', {
        locale: 'tr',
        conversationId: 'cancel-' + Date.now(),
        paymentId,
        reason: reason || 'customer_request',
      });

      return response;
    } catch (error) {
      console.error('iyzico cancel error:', error);
      throw new Error('Failed to cancel payment');
    }
  }
}

export default IyzicoService;
