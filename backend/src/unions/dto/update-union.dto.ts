import { PartialType } from '@nestjs/swagger';
import { CreateUnionDto } from './create-union.dto';

export class UpdateUnionDto extends PartialType(CreateUnionDto) {}
