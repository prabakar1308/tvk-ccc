import { PartialType } from '@nestjs/swagger';
import { CreatePanchayatDto } from './create-panchayat.dto';

export class UpdatePanchayatDto extends PartialType(CreatePanchayatDto) {}
