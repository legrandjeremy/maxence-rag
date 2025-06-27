export interface Race {
  id: number;
  name: string;
  quota_confirmed: number;
  quota_substitute: number;
  eligibilty_criteria: {
      min_age?: string;
      max_age?: string;
      uci_id_guests_exclude_quota?: [string];
      ranking?: {
        min_points?: string;
      }
  };
}

export interface Competition {
  id: number;
  name: string;
  quota_confirmed: number;
  quota_substitute: number;
  default_eligibilty_criteria: {
      min_age?: string;
      max_age?: string;
      uci_id_guests_exclude_quota?: [string];
      ranking?: {
        min_points?: string;
      }
  };
}

