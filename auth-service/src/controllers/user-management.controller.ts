import { Request, Response } from 'express';
import userManagementService from '../services/user-management.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class UserManagementController {
  async listUsers(req: Request, res: Response) {
    try {
      const { domain_id, tenant_id, organization_id, is_active, search } = req.query;

      const users = await userManagementService.getAllUsers({
        domain_id: domain_id as string,
        tenant_id: tenant_id as string,
        organization_id: organization_id as string,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
        search: search as string,
      });

      res.json({ users });
    } catch (error: any) {
      console.error('List users error:', error);
      res.status(500).json({ error: 'Failed to list users' });
    }
  }

  async getUserAccess(req: Request, res: Response) {
    try {
      const { user_id } = req.params;
      const access = await userManagementService.getUserAccess(user_id);
      res.json({ access });
    } catch (error: any) {
      console.error('Get user access error:', error);
      res.status(500).json({ error: 'Failed to get user access' });
    }
  }

  async assignUserToTenant(req: AuthRequest, res: Response) {
    try {
      const { user_id, tenant_id, role_id } = req.body;
      const invitedBy = req.user?.id;

      const assignment = await userManagementService.assignUserToTenant(
        user_id,
        tenant_id,
        role_id,
        invitedBy
      );

      res.status(201).json({
        message: 'User assigned to tenant successfully',
        assignment,
      });
    } catch (error: any) {
      console.error('Assign user to tenant error:', error);
      res.status(500).json({ error: 'Failed to assign user to tenant' });
    }
  }

  async removeUserFromTenant(req: Request, res: Response) {
    try {
      const { user_id, tenant_id } = req.body;

      await userManagementService.removeUserFromTenant(user_id, tenant_id);

      res.json({ message: 'User removed from tenant successfully' });
    } catch (error: any) {
      console.error('Remove user from tenant error:', error);
      res.status(500).json({ error: 'Failed to remove user from tenant' });
    }
  }

  async updateUserRole(req: Request, res: Response) {
    try {
      const { user_id, tenant_id, role_id } = req.body;

      const assignment = await userManagementService.updateUserRole(
        user_id,
        tenant_id,
        role_id
      );

      res.json({
        message: 'User role updated successfully',
        assignment,
      });
    } catch (error: any) {
      if (error.message === 'User not found in tenant') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Update user role error:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }

  async deactivateUser(req: Request, res: Response) {
    try {
      const { user_id, tenant_id } = req.body;

      await userManagementService.deactivateUserInTenant(user_id, tenant_id);

      res.json({ message: 'User deactivated successfully' });
    } catch (error: any) {
      console.error('Deactivate user error:', error);
      res.status(500).json({ error: 'Failed to deactivate user' });
    }
  }

  async reactivateUser(req: Request, res: Response) {
    try {
      const { user_id, tenant_id } = req.body;

      await userManagementService.reactivateUserInTenant(user_id, tenant_id);

      res.json({ message: 'User reactivated successfully' });
    } catch (error: any) {
      console.error('Reactivate user error:', error);
      res.status(500).json({ error: 'Failed to reactivate user' });
    }
  }

  // Invitation endpoints
  async createInvitation(req: AuthRequest, res: Response) {
    try {
      const { tenant_id, role_id, email, expires_in_days } = req.body;
      const invitedBy = req.user?.id;

      if (!invitedBy) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const invitation = await userManagementService.createInvitation({
        tenant_id,
        role_id,
        email,
        invited_by: invitedBy,
        expires_in_days,
      });

      res.status(201).json({
        message: 'Invitation created successfully',
        invitation,
      });
    } catch (error: any) {
      console.error('Create invitation error:', error);
      res.status(500).json({ error: 'Failed to create invitation' });
    }
  }

  async getInvitation(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const invitation = await userManagementService.getInvitation(token);

      if (!invitation) {
        return res.status(404).json({ error: 'Invalid or expired invitation' });
      }

      res.json({ invitation });
    } catch (error: any) {
      console.error('Get invitation error:', error);
      res.status(500).json({ error: 'Failed to get invitation' });
    }
  }

  async acceptInvitation(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { email, password, first_name, last_name } = req.body;

      const result = await userManagementService.acceptInvitation(token, {
        email,
        password,
        first_name,
        last_name,
      });

      res.json({
        message: 'Invitation accepted successfully',
        user: {
          id: result.user.id,
          email: result.user.email,
          first_name: result.user.first_name,
          last_name: result.user.last_name,
        },
      });
    } catch (error: any) {
      if (error.message.includes('invitation') || error.message.includes('Email')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Accept invitation error:', error);
      res.status(500).json({ error: 'Failed to accept invitation' });
    }
  }

  async listInvitations(req: Request, res: Response) {
    try {
      const { tenant_id } = req.params;
      const invitations = await userManagementService.listInvitations(tenant_id);
      res.json({ invitations });
    } catch (error: any) {
      console.error('List invitations error:', error);
      res.status(500).json({ error: 'Failed to list invitations' });
    }
  }

  async cancelInvitation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await userManagementService.cancelInvitation(id);
      res.json({ message: 'Invitation cancelled successfully' });
    } catch (error: any) {
      console.error('Cancel invitation error:', error);
      res.status(500).json({ error: 'Failed to cancel invitation' });
    }
  }
}

export default new UserManagementController();
