import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { CadreLevel } from '@prisma/client';

export class AssignWingMemberDto {
  @IsUUID()
  @IsNotEmpty()
  cadreId: string;

  @IsString()
  @IsNotEmpty()
  role: string; // 'COORDINATOR' | 'CO_COORDINATOR'

  @IsEnum(CadreLevel)
  @IsNotEmpty()
  level: CadreLevel;

  @IsUUID()
  @IsOptional()
  districtId?: string;

  @IsUUID()
  @IsOptional()
  unionId?: string;
}
