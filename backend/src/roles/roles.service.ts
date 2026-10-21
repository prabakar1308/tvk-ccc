import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
        const mobileNumber = cadre.phone?.trim();
        const updateData: { roleId: string | null; userId?: string } = {
          roleId: targetRoleId,
        };

        // If existing user account has a different userId (e.g. memberId/voterId) and cadre has a mobile number,
        // update it to mobile number if there's no collision
        if (mobileNumber && existingUser.userId !== mobileNumber) {
          const conflicting = await this.prisma.user.findUnique({ where: { userId: mobileNumber } });
          if (!conflicting || conflicting.id === existingUser.id) {
            updateData.userId = mobileNumber;
          }
        }

        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: updateData,
        });
      } else if (targetRoleId) {
        // Otherwise create a user account for the cadre ONLY if assigning a role.
        // userId must be the mobile number, not the member ID/voter ID.
        const mobileNumber = cadre.phone?.trim();
        if (!mobileNumber) {
          throw new BadRequestException(
            `Cannot assign role to "${cadre.name}" (${cadre.memberId}): Cadre does not have a registered mobile number. A mobile number is required as the User ID.`
          );
        }

        const existingUserWithPhone = await this.prisma.user.findUnique({
          where: { userId: mobileNumber }
        });
        if (existingUserWithPhone) {
          throw new BadRequestException(
            `Cannot create user for "${cadre.name}": A user account with mobile number "${mobileNumber}" already exists.`
          );
        }

        await this.prisma.user.create({
          data: {
            userId: mobileNumber,
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
