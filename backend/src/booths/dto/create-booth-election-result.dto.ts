export class CreateBoothElectionResultDto {
  electionYear: string;
  electionName: string;
  totalVotesPolled: number;
  tvkVotes: number;
  tvkPercentage?: number;
  topParty1Name?: string;
  topParty1Votes?: number;
  topParty2Name?: string;
  topParty2Votes?: number;
  winnerPartyName?: string;
  margin?: number;
  notes?: string;
}

