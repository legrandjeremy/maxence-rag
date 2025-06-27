import type { RaceTableEntry, CompetitionRequest } from '@uci-tech/uci-competition-request'

export interface FormCompetitionRequest extends CompetitionRequest {
    agreeToTerms?: boolean;
    confirmInformationCorrect?: boolean;
    raceFormat: {
      riderCategory: string[];
      class: string;
      raceType: string;
      startDate: string;
      endDate: string;
      numberOfStages: number;
      raceTable: RaceTableEntry[];
    };
    defactoSameInfos?: boolean;
    invoiceSameInfos?: boolean;
    bankShareData?: boolean;
    bankAgreeToTerms?: boolean;
    bankConfirmInformationCorrect?: boolean;
  }