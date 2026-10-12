import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    if (!user.permissions) {
      throw new ForbiddenException('User has no permissions assigned. Please log out and log back in.');
    }

    // Check if the user has ALL required permissions
    const hasPermission = requiredPermissions.every((permission) => 
      user.permissions.includes(permission)
    );
    
    if (!hasPermission) {
       throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
