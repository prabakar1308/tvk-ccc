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
}
