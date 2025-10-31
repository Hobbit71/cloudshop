import { Response } from 'express';
import { AdminRequest, CreateUserRequest, UpdateUserRequest } from '../types';
import { userService } from '../services/user.service';
import { auditService } from '../services/audit.service';

export class UserController {
  async createUser(req: AdminRequest, res: Response): Promise<void> {
    const data: CreateUserRequest = req.body;
    const user = req.user;

    const newUser = await userService.createUser(data);

    // Log audit
    await auditService.createAuditLog({
      user_id: user?.id,
      action: 'create',
      resource_type: 'user',
      resource_id: newUser.id,
      details: { email: newUser.email, role: newUser.role },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'User created successfully',
      data: newUser,
    });
  }

  async getUsers(req: AdminRequest, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await userService.findAll(page, limit);

    res.json({
      message: 'Users retrieved successfully',
      data: result.users,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  }

  async getUser(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const user = await userService.findById(id);

    if (!user) {
      res.status(404).json({
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
          statusCode: 404,
        },
      });
      return;
    }

    res.json({
      message: 'User retrieved successfully',
      data: user,
    });
  }

  async updateUser(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const updates: UpdateUserRequest = req.body;
    const user = req.user;

    const updatedUser = await userService.updateUser(id, updates);

    // Log audit
    await auditService.createAuditLog({
      user_id: user?.id,
      action: 'update',
      resource_type: 'user',
      resource_id: id,
      details: updates,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    res.json({
      message: 'User updated successfully',
      data: updatedUser,
    });
  }

  async deleteUser(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const user = req.user;

    await userService.deleteUser(id);

    // Log audit
    await auditService.createAuditLog({
      user_id: user?.id,
      action: 'delete',
      resource_type: 'user',
      resource_id: id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    res.json({
      message: 'User deleted successfully',
    });
  }
}

export const userController = new UserController();

