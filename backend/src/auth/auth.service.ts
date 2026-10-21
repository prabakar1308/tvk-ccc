import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(
    userId: string,
    pass: string,
    role?: string,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { userId } });
    if (existing) {
      throw new BadRequestException('User already exists');
    }
    const roleToAssign = role || 'CADRE';
    let roleId: string | undefined;
    
    const dbRole = await this.prisma.role.findUnique({ where: { name: roleToAssign } });
    if (dbRole) {
      roleId = dbRole.id;
    }

    const passwordHash = await bcrypt.hash(pass, 10);
    const user = await this.prisma.user.create({
      data: {
        userId,
        passwordHash,
        ...(roleId && { roleId }),
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async validateUser(userId: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ 
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        },
        cadre: true
      }
    });
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const permissions = user.role?.permissions?.map((rp: any) => rp.permission.action) || [];
    const payload = {
      userId: user.userId,
      sub: user.id,
      role: user.role?.name || null,
      unionId: user.cadre?.unionId || null,
      permissions,
      name: user.cadre?.name || user.userId,
      photoUrl: user.cadre?.photoUrl || null,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getMe(userIdFromToken: string) {
    let user = await this.prisma.user.findUnique({
      where: { id: userIdFromToken },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        cadre: {
          include: {
            district: true,
            union: true,
            homeKilai: true,
            wing: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Fallback: If cadre is not directly linked via cadreId, attempt to link by phone or memberId
    if (!user.cadre) {
      const matchedCadre = await this.prisma.cadre.findFirst({
        where: {
          OR: [
            { phone: user.userId },
            { memberId: user.userId },
          ],
        },
        include: {
          district: true,
          union: true,
          homeKilai: true,
          wing: true,
        },
      });

      if (matchedCadre) {
        try {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { cadreId: matchedCadre.id },
          });
          user = { ...user, cadreId: matchedCadre.id, cadre: matchedCadre };
        } catch {
          user = { ...user, cadre: matchedCadre };
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async changePassword(
    userIdFromToken: string,
    dto: { currentPassword?: string; newPassword?: string },
  ) {
    const { currentPassword, newPassword } = dto;

    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Current password and new password are required');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userIdFromToken },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }
}
