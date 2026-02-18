CREATE TABLE IF NOT EXISTS billing_events (
    id BIGSERIAL PRIMARY KEY,
    company TEXT NOT NULL,
    aws_service TEXT NOT NULL,
    event_time TIMESTAMPTZ NOT NULL,
    gross_cost NUMERIC(12,2) NOT NULL CHECK (gross_cost >= 0)
);

CREATE INDEX IF NOT EXISTS idx_billing_events_company_service_time
    ON billing_events (company, aws_service, event_time);
