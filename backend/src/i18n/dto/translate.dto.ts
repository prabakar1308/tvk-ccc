import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TranslateDto {
  @ApiProperty({ description: 'Text to translate' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Target language code, e.g. "ta" or "en"' })
  @IsString()
  target: string;

  @ApiPropertyOptional({ description: 'Source language code, e.g. "en" or "ta"' })
  @IsString()
  @IsOptional()
  source?: string;
}

