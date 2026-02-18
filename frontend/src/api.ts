import type {
  CommitmentDetailResponse,
  CompanyCommitmentsResponse,
  CompanyListResponse,
} from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function endpoint(path: string): string {
  return `${API_BASE}${path}`;
}

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(endpoint(path));
  const data = await response.json();
  if (!response.ok) {
    const message =
      typeof data?.error === "string" ? data.error : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function getCompanies(): Promise<string[]> {
  const data = await requestJson<CompanyListResponse>("/api/companies");
  return data.companies;
}

export async function getCommitmentsForCompany(
  company: string
): Promise<CompanyCommitmentsResponse> {
  return requestJson<CompanyCommitmentsResponse>(
    `/api/companies/${encodeURIComponent(company)}/commitments`
  );
}

export async function getCommitmentDetail(
  company: string,
  commitmentId: number
): Promise<CommitmentDetailResponse> {
  return requestJson<CommitmentDetailResponse>(
    `/api/companies/${encodeURIComponent(company)}/commitments/${commitmentId}`
  );
}

