import { IsString, IsOptional, IsEnum, IsInt, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PanchayatType } from '@prisma/client';

export class CreatePanchayatDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  nameTa: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ enum: PanchayatType, default: PanchayatType.VILLAGE_PANCHAYAT })
  @IsEnum(PanchayatType)
  @IsOptional()
  type?: PanchayatType;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  wardNumber?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  centerLat?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  centerLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  boundary?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  unionId: string;
}
