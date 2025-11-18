import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create transporter
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'OAuth Platform'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
    } catch (error) {
      console.error('Email send error:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send welcome email to new organization
   */
  async sendOrganizationWelcome(data: {
    email: string;
    organizationName: string;
    plan: string;
    trialEndsAt?: Date;
  }): Promise<void> {
    const { email, organizationName, plan, trialEndsAt } = data;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #4F46E5; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to OAuth Platform!</h1>
            </div>
            <div class="content">
              <h2>Hello ${organizationName}!</h2>
              <p>Your organization has been successfully created. You're all set to start building amazing SaaS applications with our authentication platform.</p>

              <div class="info-box">
                <h3>Your Plan: ${plan.toUpperCase()}</h3>
                ${trialEndsAt ? `<p><strong>Trial Period:</strong> Your ${plan} plan trial ends on ${trialEndsAt.toLocaleDateString()}</p>` : ''}
                <p>You can now:</p>
                <ul>
                  <li>Create domains for your applications</li>
                  <li>Add tenants and users</li>
                  <li>Configure roles and permissions</li>
                  <li>Monitor usage and analytics</li>
                </ul>
              </div>

              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Get Started</a>
              </center>

              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} OAuth Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Welcome to OAuth Platform - ${organizationName}`,
      html,
    });
  }

  /**
   * Send plan upgrade notification
   */
  async sendPlanUpgrade(data: {
    email: string;
    organizationName: string;
    oldPlan: string;
    newPlan: string;
  }): Promise<void> {
    const { email, organizationName, oldPlan, newPlan } = data;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .upgrade-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .plan { font-size: 24px; font-weight: bold; color: #4F46E5; }
            .arrow { font-size: 30px; color: #10B981; margin: 0 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Plan Upgraded!</h1>
            </div>
            <div class="content">
              <h2>Congratulations, ${organizationName}!</h2>
              <p>Your subscription plan has been successfully upgraded.</p>

              <div class="upgrade-box">
                <span class="plan">${oldPlan.toUpperCase()}</span>
                <span class="arrow">→</span>
                <span class="plan">${newPlan.toUpperCase()}</span>
              </div>

              <p>You now have access to enhanced features and higher limits. Check your dashboard to explore all the new capabilities.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} OAuth Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Plan Upgraded to ${newPlan.toUpperCase()} - ${organizationName}`,
      html,
    });
  }

  /**
   * Send usage limit warning
   */
  async sendUsageLimitWarning(data: {
    email: string;
    organizationName: string;
    limitType: 'domains' | 'tenants' | 'users' | 'api_calls';
    currentUsage: number;
    limit: number;
    percentage: number;
  }): Promise<void> {
    const { email, organizationName, limitType, currentUsage, limit, percentage } = data;

    const limitNames = {
      domains: 'Domains',
      tenants: 'Tenants',
      users: 'Users',
      api_calls: 'API Calls',
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #F59E0B; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .warning-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; }
            .progress-bar { width: 100%; height: 30px; background: #E5E7EB; border-radius: 15px; overflow: hidden; margin: 10px 0; }
            .progress-fill { height: 100%; background: ${percentage >= 90 ? '#EF4444' : '#F59E0B'}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Usage Limit Warning</h1>
            </div>
            <div class="content">
              <h2>Hello ${organizationName},</h2>
              <p>You're approaching your ${limitNames[limitType]} limit for your current plan.</p>

              <div class="warning-box">
                <h3>${limitNames[limitType]} Usage</h3>
                <p><strong>${currentUsage}</strong> of <strong>${limit}</strong> used</p>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${percentage}%">
                    ${percentage}%
                  </div>
                </div>
              </div>

              <p>${percentage >= 90 ? 'You\'ve reached 90% of your limit!' : 'You\'re getting close to your limit.'} Consider upgrading your plan to avoid service interruption.</p>

              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/billing" class="button">Upgrade Plan</a>
              </center>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} OAuth Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Usage Warning: ${limitNames[limitType]} at ${percentage}% - ${organizationName}`,
      html,
    });
  }

  /**
   * Send trial expiry reminder
   */
  async sendTrialExpiryReminder(data: {
    email: string;
    organizationName: string;
    daysRemaining: number;
  }): Promise<void> {
    const { email, organizationName, daysRemaining } = data;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #EF4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .countdown { background: white; padding: 30px; text-align: center; border-radius: 8px; margin: 20px 0; }
            .days { font-size: 48px; font-weight: bold; color: #EF4444; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Trial Ending Soon</h1>
            </div>
            <div class="content">
              <h2>Hello ${organizationName},</h2>
              <p>Your trial period is ending soon. Don't lose access to your authentication platform!</p>

              <div class="countdown">
                <div class="days">${daysRemaining}</div>
                <p>day${daysRemaining !== 1 ? 's' : ''} remaining</p>
              </div>

              <p>Upgrade now to continue using all features without interruption.</p>

              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/billing" class="button">Upgrade Now</a>
              </center>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} OAuth Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Trial Ending in ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} - ${organizationName}`,
      html,
    });
  }

  /**
   * Send monthly usage report
   */
  async sendMonthlyUsageReport(data: {
    email: string;
    organizationName: string;
    month: string;
    usage: {
      domains: number;
      tenants: number;
      users: number;
      apiCalls: number;
    };
    limits: {
      domains: number;
      tenants: number;
      users: number;
      apiCalls: number;
    };
  }): Promise<void> {
    const { email, organizationName, month, usage, limits } = data;

    const calculatePercentage = (current: number, max: number) => {
      if (max === -1) return 0;
      return max === 0 ? 0 : Math.round((current / max) * 100);
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .metric { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .metric-name { font-weight: bold; color: #666; }
            .metric-value { font-size: 24px; font-weight: bold; color: #4F46E5; }
            .progress-bar { width: 100%; height: 8px; background: #E5E7EB; border-radius: 4px; overflow: hidden; margin: 5px 0; }
            .progress-fill { height: 100%; background: #4F46E5; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Monthly Usage Report</h1>
              <p>${month}</p>
            </div>
            <div class="content">
              <h2>Hello ${organizationName},</h2>
              <p>Here's your usage summary for ${month}:</p>

              <div class="metric">
                <div class="metric-name">Domains</div>
                <div class="metric-value">${usage.domains} / ${limits.domains === -1 ? '∞' : limits.domains}</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${calculatePercentage(usage.domains, limits.domains)}%"></div>
                </div>
              </div>

              <div class="metric">
                <div class="metric-name">Tenants</div>
                <div class="metric-value">${usage.tenants} / ${limits.tenants === -1 ? '∞' : limits.tenants}</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${calculatePercentage(usage.tenants, limits.tenants)}%"></div>
                </div>
              </div>

              <div class="metric">
                <div class="metric-name">Users</div>
                <div class="metric-value">${usage.users} / ${limits.users === -1 ? '∞' : limits.users}</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${calculatePercentage(usage.users, limits.users)}%"></div>
                </div>
              </div>

              <div class="metric">
                <div class="metric-name">API Calls</div>
                <div class="metric-value">${usage.apiCalls.toLocaleString()} / ${limits.apiCalls === -1 ? '∞' : limits.apiCalls.toLocaleString()}</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${calculatePercentage(usage.apiCalls, limits.apiCalls)}%"></div>
                </div>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} OAuth Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Monthly Usage Report - ${month} - ${organizationName}`,
      html,
    });
  }
}

export default new EmailService();
