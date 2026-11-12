export class BulkImportElectionResultItemDto {
  boothNo: string;
  dmkVotes?: number;
  aiadmkVotes?: number;
  tvkVotes?: number;
  totalVotesPolled?: number;
}

export class BulkUpdateBoothElectionResultsDto {
  electionId?: string;
  electionYear: string;
  electionName: string;
  results: BulkImportElectionResultItemDto[];
}

