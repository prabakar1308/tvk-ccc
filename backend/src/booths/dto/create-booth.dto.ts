export class CreateBoothDto {
  name: string;
  boothNo: string;
  maleCount?: number;
  femaleCount?: number;
  thirdGenderCount?: number;
  totalCount?: number;
  kilaiIds?: string[];
  agentIds?: string[];
}
