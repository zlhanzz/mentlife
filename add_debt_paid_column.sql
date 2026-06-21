-- Add debt_paid column to financial_profiles
-- Tracks cumulative debt payments so the progress bar can show real-time % paid

ALTER TABLE financial_profiles
ADD COLUMN IF NOT EXISTS debt_paid NUMERIC DEFAULT 0;
