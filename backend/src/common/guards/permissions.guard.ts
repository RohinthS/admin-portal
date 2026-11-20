import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PERMISSION_CHECK_KEY, RequiredPermission } from '../decorators/permissions.decorator';
import { RolePermission, RolePermissionDocument } from '../../schemas/role.schema';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(RolePermission.name)
    private readonly rolePermissionModel: Model<RolePermissionDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSION_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    // Superadmin bypasses all checks
    if (user.user_type === 'admin' || user.is_superadmin) {
      return true;
    }

    const { page, action } = requiredPermission;
    const roleId = user.role_id;
    const companyId = user.company_id;

    if (!roleId || !companyId) {
      throw new ForbiddenException('User does not have an assigned role or active company');
    }

    const permissionDoc = await this.rolePermissionModel.findOne({
      role_id: new Types.ObjectId(roleId),
      company_id: new Types.ObjectId(companyId),
      permission_page: page,
    });

    if (!permissionDoc) {
      throw new ForbiddenException(`Access denied: No permission configured for ${page}`);
    }

    // Check actions array or raw string format (e.g., 'V$$A$$E$$D')
    const hasPermission =
      (permissionDoc.actions && permissionDoc.actions.includes(action)) ||
      (permissionDoc.permission_action && permissionDoc.permission_action.split('$$').includes(action));

    if (!hasPermission) {
      throw new ForbiddenException(`Permission denied: You cannot perform action '${action}' on '${page}'`);
    }

    return true;
  }
}
