import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { action: 'asc' }
      ]
    });
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    // Remove existing
    await this.prisma.rolePermission.deleteMany({
      where: { roleId }
    });

    // Create new
    if (permissionIds.length > 0) {
      const data = permissionIds.map(permissionId => ({
        roleId,
        permissionId
      }));
      await this.prisma.rolePermission.createMany({ data });
    }

    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
  }

  async assignRoleToCadre(cadreIds: string[], roleId: string | null) {
    const targetRoleId = (!roleId || roleId === 'remove') ? null : roleId;

    if (targetRoleId) {
      const role = await this.prisma.role.findUnique({ where: { id: targetRoleId } });
      if (!role) throw new NotFoundException('Role not found');
    }

    const defaultPassword = 'admin123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    for (const cadreId of cadreIds) {
      const cadre = await this.prisma.cadre.findUnique({ where: { id: cadreId } });
      if (!cadre) continue;

      const existingUser = await this.prisma.user.findUnique({ where: { cadreId } });

      // If Cadre already has a user account, update the role
      if (existingUser) {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { roleId: targetRoleId }
        });
      } else if (targetRoleId) {
        // Otherwise create a user account for the cadre ONLY if assigning a role
        const loginId = cadre.memberId || cadre.phone || cadre.id;
        await this.prisma.user.create({
          data: {
            userId: loginId,
            passwordHash,
            roleId: targetRoleId,
            cadreId: cadre.id,
          }
        });
      }
    }

    return { success: true, message: (!roleId || roleId === 'remove') ? 'Roles unassigned successfully' : 'Roles assigned successfully' };
  }
}
