import { Controller, Get, Put, Post, Param, Body, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('users:read') // Adjust as necessary
  async getRoles() {
    return this.rolesService.getRoles();
  }

  @Get('permissions')
  @RequirePermissions('users:read')
  async getPermissions() {
    return this.rolesService.getPermissions();
  }

  @Put(':id/permissions')
  @RequirePermissions('users:write')
  async updateRolePermissions(
    @Param('id') roleId: string, 
    @Body('permissionIds') permissionIds: string[]
  ) {
    return this.rolesService.updateRolePermissions(roleId, permissionIds);
  }

  @Post('assign')
  @RequirePermissions('users:write')
  async assignRoleToCadre(
    @Body('cadreIds') cadreIds: string[],
    @Body('roleId') roleId: string | null
  ) {
    return this.rolesService.assignRoleToCadre(cadreIds, roleId);
  }
}
