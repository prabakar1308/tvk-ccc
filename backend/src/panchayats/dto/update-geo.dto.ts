import { IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePanchayatGeoDto {
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
}
