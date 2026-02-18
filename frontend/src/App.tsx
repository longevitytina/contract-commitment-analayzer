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

function formatCurrency(amount: number): string {
  return moneyFormatter.format(amount);
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

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "1rem 1.5rem" }}>
      <h1>Contract Commitment Analyzer</h1>
      <p style={{ marginTop: 0, color: "#4b5563" }}>
        Compare committed AWS spend against actual spend by company and period.
      </p>

      {error && (
        <p role="alert" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      )}

      <section style={{ marginBottom: "1rem" }}>
        <label htmlFor="company-select">
          <strong>Company</strong>
        </label>
        <div>
          <select
            id="company-select"
            value={selectedCompany}
            onChange={(event) => setSelectedCompany(event.target.value)}
            disabled={isLoadingCompanies || companies.length === 0}
            style={{ marginTop: "0.5rem", minWidth: "16rem" }}
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

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 320px) 1fr",
          gap: "1rem",
        }}
      >
        <aside
          style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "0.75rem" }}
        >
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Commitments</h2>
          {isLoadingCommitments ? (
            <p>Loading commitments...</p>
          ) : commitments.length === 0 ? (
            <p>No commitments for this company.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {commitments.map((commitment) => (
                <li key={commitment.id} style={{ marginBottom: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedCommitmentId(commitment.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      borderRadius: "6px",
                      border:
                        selectedCommitmentId === commitment.id
                          ? "2px solid #2563eb"
                          : "1px solid #d1d5db",
                      padding: "0.5rem",
                      background:
                        selectedCommitmentId === commitment.id ? "#eff6ff" : "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <strong>{commitment.name}</strong>
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#4b5563" }}>
                      Service: {commitment.service}
                    </div>
                    <div style={{ fontSize: "0.9rem" }}>
                      Shortfall: {formatCurrency(commitment.total_shortfall)}
                    </div>
                    <div style={{ fontSize: "0.9rem" }}>
                      Status: {commitment.met ? "Met" : "Missed"}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section
          style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "0.75rem" }}
        >
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Commitment Detail</h2>
          {!currentSummary ? (
            <p>Select a commitment to view details.</p>
          ) : isLoadingDetail ? (
            <p>Loading commitment detail...</p>
          ) : !commitmentDetail ? (
            <p>No commitment detail available.</p>
          ) : (
            <div>
              <p>
                <strong>{commitmentDetail.name}</strong> ({commitmentDetail.service})
              </p>
              <p>
                Total Committed: {formatCurrency(commitmentDetail.total_committed)} | Total
                Actual: {formatCurrency(commitmentDetail.total_actual)} | Total Shortfall:{" "}
                {formatCurrency(commitmentDetail.total_shortfall)}
              </p>

              <h3 style={{ marginBottom: "0.5rem" }}>Checkin Details</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db" }}>
                        Period
                      </th>
                      <th style={{ textAlign: "right", borderBottom: "1px solid #d1d5db" }}>
                        Committed
                      </th>
                      <th style={{ textAlign: "right", borderBottom: "1px solid #d1d5db" }}>
                        Actual
                      </th>
                      <th style={{ textAlign: "right", borderBottom: "1px solid #d1d5db" }}>
                        Shortfall
                      </th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db" }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {commitmentDetail.checkins.map((checkin) => (
                      <tr key={`${checkin.start}-${checkin.end}`}>
                        <td style={{ padding: "0.4rem 0" }}>
                          {checkin.start} to {checkin.end}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {formatCurrency(checkin.committed_amount)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {formatCurrency(checkin.actual_amount)}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            color: checkin.shortfall > 0 ? "#b91c1c" : "inherit",
                          }}
                        >
                          {formatCurrency(checkin.shortfall)}
                        </td>
                        <td>
                          {checkin.met ? "Met" : "Missed"} ({checkin.status})
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
