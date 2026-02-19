import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

function jsonResponse(data: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 400,
    json: async () => data,
  } as Response;
}

describe("App", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("loads companies, commitments, and detail", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/api/companies")) {
        return Promise.resolve(jsonResponse({ companies: ["cyberdyne"] }));
      }
      if (url.endsWith("/api/companies/cyberdyne/commitments")) {
        return Promise.resolve(
          jsonResponse({
            company: "cyberdyne",
            commitments: [
              {
                id: 1,
                name: "S3 commitment",
                service: "s3",
                met: false,
                checkin_count: 1,
                total_committed: 1000,
                total_actual: 850.5,
                total_shortfall: 149.5,
              },
            ],
          })
        );
      }
      if (url.endsWith("/api/companies/cyberdyne/commitments/1")) {
        return Promise.resolve(
          jsonResponse({
            company: "cyberdyne",
            commitment: {
              id: 1,
              name: "S3 commitment",
              company: "cyberdyne",
              service: "s3",
              met: false,
              total_committed: 1000,
              total_actual: 850.5,
              total_shortfall: 149.5,
              checkins: [
                {
                  start: "2024-01-01 00:00:00",
                  end: "2024-02-01 00:00:00",
                  status: "past",
                  committed_amount: 1000,
                  actual_amount: 850.5,
                  shortfall: 149.5,
                  surplus: 0,
                  met: false,
                },
              ],
            },
          })
        );
      }

      return Promise.resolve(jsonResponse({ error: "not found" }, false));
    });

    render(<App />);

    expect(await screen.findByText("Service: s3")).toBeTruthy();
    expect(await screen.findByText("Checkin Details")).toBeTruthy();
    expect(screen.getByText("-$149.50")).toBeTruthy();
  });

  it("updates commitment list when company changes", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/api/companies")) {
        return Promise.resolve(jsonResponse({ companies: ["cyberdyne", "ingen"] }));
      }
      if (url.endsWith("/api/companies/cyberdyne/commitments")) {
        return Promise.resolve(
          jsonResponse({
            company: "cyberdyne",
            commitments: [
              {
                id: 1,
                name: "S3 commitment",
                service: "s3",
                met: true,
                checkin_count: 1,
                total_committed: 1000,
                total_actual: 1000,
                total_shortfall: 0,
              },
            ],
          })
        );
      }
      if (url.endsWith("/api/companies/cyberdyne/commitments/1")) {
        return Promise.resolve(
          jsonResponse({
            company: "cyberdyne",
            commitment: {
              id: 1,
              name: "S3 commitment",
              company: "cyberdyne",
              service: "s3",
              met: true,
              total_committed: 1000,
              total_actual: 1000,
              total_shortfall: 0,
              checkins: [],
            },
          })
        );
      }
      if (url.endsWith("/api/companies/ingen/commitments")) {
        return Promise.resolve(
          jsonResponse({
            company: "ingen",
            commitments: [
              {
                id: 8,
                name: "Cloudwatch commitment",
                service: "cloudwatch",
                met: false,
                checkin_count: 2,
                total_committed: 6000,
                total_actual: 5300,
                total_shortfall: 700,
              },
            ],
          })
        );
      }
      if (url.endsWith("/api/companies/ingen/commitments/8")) {
        return Promise.resolve(
          jsonResponse({
            company: "ingen",
            commitment: {
              id: 8,
              name: "Cloudwatch commitment",
              company: "ingen",
              service: "cloudwatch",
              met: false,
              total_committed: 6000,
              total_actual: 5300,
              total_shortfall: 700,
              checkins: [],
            },
          })
        );
      }

      return Promise.resolve(jsonResponse({ error: "not found" }, false));
    });

    render(<App />);

    await screen.findByRole("button", { name: /Service:\s*s3/i });

    fireEvent.change(screen.getByLabelText("Company"), {
      target: { value: "ingen" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Service:\s*cloudwatch/i })
      ).toBeTruthy();
    });
  });
});

