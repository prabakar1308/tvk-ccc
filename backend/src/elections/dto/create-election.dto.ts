import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateElectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  nameTa?: string;

  @IsString()
  @IsNotEmpty()
  year: string;

  @IsString()
  @IsOptional()
  type?: string; // ASSEMBLY, PARLIAMENTARY, LOCAL_BODY, BY_ELECTION

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;

  @IsString()
  @IsOptional()
  status?: string; // UPCOMING, ACTIVE, COMPLETED

  @IsString()
  @IsOptional()
  description?: string;
}

