import { useEffect, useMemo, useState } from "react";

import {
  getCommitmentDetail,
  getCommitmentsForCompany,
  getCompanies,
} from "./api";
import type { CommitmentDetail, CommitmentSummary } from "./types";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatCurrency(amount: number): string {
  return moneyFormatter.format(amount);
}

function formatCheckinPeriod(start: string): string {
  const isoLikeValue = start.replace(" ", "T") + "Z";
  const parsed = new Date(isoLikeValue);
  if (Number.isNaN(parsed.getTime())) {
    return start;
  }
  return monthFormatter.format(parsed);
}

function getCheckinStartTimestamp(start: string): number {
  const isoLikeValue = start.replace(" ", "T") + "Z";
  const parsed = new Date(isoLikeValue);
  if (Number.isNaN(parsed.getTime())) {
    return Number.NEGATIVE_INFINITY;
  }
  return parsed.getTime();
}

function StatusBadge({ delta }: { delta: number }) {
  const isNonNegative = delta >= 0;
  return (
    <span
      className={`inline-flex min-w-24 items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
        isNonNegative
          ? "bg-green-100 text-green-800 ring-1 ring-inset ring-green-200"
          : "bg-red-100 text-red-800 ring-1 ring-inset ring-red-200"
      }`}
    >
      {isNonNegative ? (
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.563a1 1 0 0 1-1.42.005L3.29 9.835a1 1 0 1 1 1.42-1.409l3.79 3.826 6.796-6.856a1 1 0 0 1 1.408-.006Z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.59c.75 1.334-.213 2.986-1.742 2.986H3.48c-1.53 0-2.492-1.652-1.742-2.986l6.518-11.59Zm1.743 4.151a1 1 0 0 0-1 1v3.5a1 1 0 0 0 2 0v-3.5a1 1 0 0 0-1-1Zm0 8a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span>{formatCurrency(delta)}</span>
    </span>
  );
}

export function App() {
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [commitments, setCommitments] = useState<CommitmentSummary[]>([]);
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<number | null>(
    null
  );
  const [commitmentDetail, setCommitmentDetail] = useState<CommitmentDetail | null>(
    null
  );
  const [isLoadingCompanies, setIsLoadingCompanies] = useState<boolean>(true);
  const [isLoadingCommitments, setIsLoadingCommitments] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadCompanies() {
      setIsLoadingCompanies(true);
      setError("");
      try {
        const nextCompanies = await getCompanies();
        setCompanies(nextCompanies);
        setSelectedCompany(nextCompanies[0] ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load companies");
      } finally {
        setIsLoadingCompanies(false);
      }
    }
    void loadCompanies();
  }, []);

  useEffect(() => {
    if (!selectedCompany) {
      setCommitments([]);
      setSelectedCommitmentId(null);
      setCommitmentDetail(null);
      return;
    }

    async function loadCommitments() {
      setIsLoadingCommitments(true);
      setError("");
      try {
        const response = await getCommitmentsForCompany(selectedCompany);
        setCommitments(response.commitments);
        setSelectedCommitmentId(response.commitments[0]?.id ?? null);
      } catch (err) {
        setCommitments([]);
        setSelectedCommitmentId(null);
        setCommitmentDetail(null);
        setError(err instanceof Error ? err.message : "Failed to load commitments");
      } finally {
        setIsLoadingCommitments(false);
      }
    }
    void loadCommitments();
  }, [selectedCompany]);

  useEffect(() => {
    if (!selectedCompany || selectedCommitmentId == null) {
      setCommitmentDetail(null);
      return;
    }
    const commitmentId = selectedCommitmentId;

    async function loadCommitmentDetail() {
      setIsLoadingDetail(true);
      setError("");
      try {
        const response = await getCommitmentDetail(selectedCompany, commitmentId);
        setCommitmentDetail(response.commitment);
      } catch (err) {
        setCommitmentDetail(null);
        setError(
          err instanceof Error ? err.message : "Failed to load commitment detail"
        );
      } finally {
        setIsLoadingDetail(false);
      }
    }
    void loadCommitmentDetail();
  }, [selectedCompany, selectedCommitmentId]);

  const currentSummary = useMemo(
    () => commitments.find((item) => item.id === selectedCommitmentId) ?? null,
    [commitments, selectedCommitmentId]
  );
  const sortedCheckins = useMemo(() => {
    if (!commitmentDetail) {
      return [];
    }
    return [...commitmentDetail.checkins].sort(
      (a, b) => getCheckinStartTimestamp(b.start) - getCheckinStartTimestamp(a.start)
    );
  }, [commitmentDetail]);
  const hasUnmetCheckins = useMemo(
    () => sortedCheckins.some((checkin) => !checkin.met),
    [sortedCheckins]
  );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6 font-sans text-slate-900">
      <h1 className="text-3xl font-semibold tracking-tight">
        Contract Commitment Analyzer
      </h1>
      <p className="mt-1 text-slate-600">
        Compare committed AWS spend against actual spend by company and period.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700"
        >
          {error}
        </p>
      )}

      <section className="mb-4 mt-6">
        <label htmlFor="company-select">
          <strong>Company</strong>
        </label>
        <div>
          <select
            id="company-select"
            value={selectedCompany}
            onChange={(event) => setSelectedCompany(event.target.value)}
            disabled={isLoadingCompanies || companies.length === 0}
            className="mt-2 min-w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {companies.length === 0 ? (
              <option value="">No companies available</option>
            ) : (
              companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))
            )}
          </select>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(260px,320px)_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Commitments</h2>
          {isLoadingCommitments ? (
            <p className="text-slate-600">Loading commitments...</p>
          ) : commitments.length === 0 ? (
            <p className="text-slate-600">No commitments for this company.</p>
          ) : (
            <ul className="m-0 list-none space-y-2 p-0">
              {commitments.map((commitment) => (
                <li key={commitment.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCommitmentId(commitment.id)}
                    className={`w-full rounded-md px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      selectedCommitmentId === commitment.id
                        ? "border-2 border-blue-600 bg-blue-50"
                        : "border border-slate-300 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-semibold">
                      <strong>Service: {commitment.service}</strong>
                    </div>

                    <div className="mt-2">
                      <StatusBadge
                        delta={commitment.met ? 0 : -commitment.total_shortfall}
                      />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold capitalize">
            {commitmentDetail?.name ?? "Commitment"} Checkins
          </h2>

          {hasUnmetCheckins && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <svg
                aria-hidden="true"
                className="h-4 w-4 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.59c.75 1.334-.213 2.986-1.742 2.986H3.48c-1.53 0-2.492-1.652-1.742-2.986l6.518-11.59Zm1.743 4.151a1 1 0 0 0-1 1v3.5a1 1 0 0 0 2 0v-3.5a1 1 0 0 0-1-1Zm0 8a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                You have unmet commitments, contact your account representitive for
                futher actiom
              </span>
            </div>
          )}

          {!currentSummary ? (
            <p className="text-slate-600">Select a commitment to view details.</p>
          ) : isLoadingDetail ? (
            <p className="text-slate-600">Loading commitment detail...</p>
          ) : !commitmentDetail ? (
            <p className="text-slate-600">No commitment detail available.</p>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-700">
                      <th className="pb-2 pr-8 text-left font-medium">
                        Period
                      </th>
                      <th className="pb-2 pr-8 text-left font-medium">
                        Committed
                      </th>
                      <th className="pb-2 pr-8 text-left font-medium">
                        Actual
                      </th>
                      <th className="pb-2 pr-0 text-right font-medium">
                        <span className="inline-block w-24 text-center">Status</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCheckins.map((checkin) => (
                      <tr
                        key={`${checkin.start}-${checkin.end}`}
                        className="border-b border-slate-100"
                      >
                        <td className="py-2 pr-8">
                          {formatCheckinPeriod(checkin.start)}
                        </td>
                        <td className="pr-8 text-left">
                          {formatCurrency(checkin.committed_amount)}
                        </td>
                        <td className="pr-8 text-left">
                          {formatCurrency(checkin.actual_amount)}
                        </td>
                        <td className="pr-0 text-right">
                          <StatusBadge
                            delta={checkin.actual_amount - checkin.committed_amount}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
