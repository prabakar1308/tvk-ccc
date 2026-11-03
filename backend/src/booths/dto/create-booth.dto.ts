export class CreateBoothDto {
  name: string;
  boothNo: string;
  area?: string;
  maleCount?: number;
  femaleCount?: number;
  thirdGenderCount?: number;
  totalCount?: number;
  unionId?: string;
  panchayatId?: string;
  villageIds?: string[];
  kilaiIds?: string[];
  agentIds?: string[];
}
