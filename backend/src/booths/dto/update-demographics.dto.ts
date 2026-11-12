export class BoothDemographicsItemDto {
  boothNo: string;
  maleCount?: number;
  femaleCount?: number;
  thirdGenderCount?: number;
  totalCount?: number;
}

export class BulkUpdateBoothDemographicsDto {
  demographics: BoothDemographicsItemDto[];
}

