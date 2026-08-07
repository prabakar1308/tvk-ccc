import { PartialType } from '@nestjs/swagger';
import { CreateKilaiDto } from './create-kilai.dto';

export class UpdateKilaiDto extends PartialType(CreateKilaiDto) {}
