import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { validatePasswordStrength } from '../utils/password';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, first_name, last_name } = req.body;

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
      }

      const user = await authService.register({
        email,
        password,
        first_name,
        last_name,
      });

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;

      res.status(201).json({
        message: 'User registered successfully',
        user: userWithoutPassword,
      });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }
      console.error('Register error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password, domain } = req.body;

      const result = await authService.login(email, password, domain);

      // Remove password hash from user
      const { password_hash, ...userWithoutPassword } = result.user;

      // Group contexts by domain for easier frontend handling
      const contextsByDomain: Record<string, any> = {};
      result.contexts.forEach((ctx) => {
        if (!contextsByDomain[ctx.domain_id]) {
          contextsByDomain[ctx.domain_id] = {
            domain_id: ctx.domain_id,
            domain_name: ctx.domain_name,
            domain_slug: ctx.domain_slug,
            domain_url: ctx.domain_url,
            tenants: [],
          };
        }

        // Check if tenant already added
        if (!contextsByDomain[ctx.domain_id].tenants.find((t: any) => t.tenant_id === ctx.tenant_id)) {
          contextsByDomain[ctx.domain_id].tenants.push({
            tenant_id: ctx.tenant_id,
            tenant_name: ctx.tenant_name,
            tenant_slug: ctx.tenant_slug,
            role: ctx.role_name,
            role_slug: ctx.role_slug,
          });
        }
      });

      res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        available_contexts: Object.values(contextsByDomain),
        token: result.token,
        refresh_token: result.refreshToken,
        needs_context_selection: !result.token, // true if multiple contexts
      });
    } catch (error: any) {
      if (error.message.includes('Invalid credentials') || error.message.includes('no access')) {
        return res.status(401).json({ error: error.message });
      }
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async selectContext(req: AuthRequest, res: Response) {
    try {
      const { domain_id, tenant_id } = req.body;
      const userId = req.user!.id;

      const result = await authService.selectContext(userId, domain_id, tenant_id);

      res.json({
        message: 'Context selected',
        token: result.token,
        refresh_token: result.refreshToken,
      });
    } catch (error: any) {
      if (error.message.includes('does not have access')) {
        return res.status(403).json({ error: error.message });
      }
      console.error('Select context error:', error);
      res.status(500).json({ error: 'Failed to select context' });
    }
  }

  async switchContext(req: AuthRequest, res: Response) {
    try {
      const { tenant_id } = req.body;
      const userId = req.user!.id;

      const result = await authService.switchContext(userId, tenant_id);

      res.json({
        message: 'Context switched',
        token: result.token,
      });
    } catch (error: any) {
      if (error.message.includes('does not have access')) {
        return res.status(403).json({ error: error.message });
      }
      console.error('Switch context error:', error);
      res.status(500).json({ error: 'Failed to switch context' });
    }
  }

  async getMyContexts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      // Return contexts from token
      res.json({
        contexts: req.user!.contexts,
        current_context: req.user!.current_context,
      });
    } catch (error) {
      console.error('Get contexts error:', error);
      res.status(500).json({ error: 'Failed to get contexts' });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      const result = await authService.refreshAccessToken(refresh_token);

      res.json({
        message: 'Token refreshed',
        token: result.token,
      });
    } catch (error: any) {
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return res.status(401).json({ error: error.message });
      }
      console.error('Refresh token error:', error);
      res.status(500).json({ error: 'Failed to refresh token' });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { refresh_token } = req.body;

      if (refresh_token) {
        await authService.logout(refresh_token);
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  async me(req: AuthRequest, res: Response) {
    try {
      res.json({
        user: {
          id: req.user!.id,
          email: req.user!.email,
        },
        contexts: req.user!.contexts,
        current_context: req.user!.current_context,
      });
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  }

  // Email Verification
  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.params;

      await authService.verifyEmail(token);

      res.json({ message: 'Email verified successfully' });
    } catch (error: any) {
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Verify email error:', error);
      res.status(500).json({ error: 'Failed to verify email' });
    }
  }

  async resendVerification(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      await authService.resendVerificationEmail(userId);

      res.json({ message: 'Verification email sent successfully' });
    } catch (error: any) {
      if (error.message.includes('already verified')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Resend verification error:', error);
      res.status(500).json({ error: 'Failed to resend verification email' });
    }
  }

  // Password Reset
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      await authService.forgotPassword(email);

      // Always return success even if email doesn't exist (security best practice)
      res.json({ message: 'If the email exists, a password reset link has been sent' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
      }

      await authService.resetPassword(token, password);

      res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }

  async changePassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { current_password, new_password } = req.body;

      // Validate password strength
      const passwordValidation = validatePasswordStrength(new_password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
      }

      await authService.changePassword(userId, current_password, new_password);

      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      if (error.message.includes('Invalid') || error.message.includes('Incorrect')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
}

export default new AuthController();
