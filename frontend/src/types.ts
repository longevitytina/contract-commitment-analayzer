export type CommitmentStatus = "past" | "current" | "future";

export type CompanyListResponse = {
  companies: string[];
};

export type CommitmentSummary = {
  id: number;
  name: string;
  service: string;
  met: boolean;
  checkin_count: number;
  total_committed: number;
  total_actual: number;
  total_shortfall: number;
};

export type CompanyCommitmentsResponse = {
  company: string;
  commitments: CommitmentSummary[];
};

export type CommitmentCheckin = {
  start: string;
  end: string;
  status: CommitmentStatus;
  committed_amount: number;
  actual_amount: number;
  shortfall: number;
  surplus: number;
  met: boolean;
};

export type CommitmentDetail = {
  id: number;
  name: string;
  company: string;
  service: string;
  met: boolean;
  total_committed: number;
  total_actual: number;
  total_shortfall: number;
  checkins: CommitmentCheckin[];
};

export type CommitmentDetailResponse = {
  company: string;
  commitment: CommitmentDetail;
};

