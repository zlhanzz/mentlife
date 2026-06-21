-- Add total_borrowed column to financial_profiles
-- Tracks the cumulative total of all debt ever borrowed by the user.
-- Used as the denominator for the debt countdown progress bar:
--   progress = total_debt / total_borrowed * 100
-- Falls back to (total_debt + debt_paid) for existing users.

ALTER TABLE financial_profiles
ADD COLUMN IF NOT EXISTS total_borrowed NUMERIC DEFAULT 0;

-- Backfill existing users: set total_borrowed = total_debt + debt_paid
UPDATE financial_profiles
SET total_borrowed = COALESCE(total_debt, 0) + COALESCE(debt_paid, 0)
WHERE total_borrowed = 0 AND (COALESCE(total_debt, 0) + COALESCE(debt_paid, 0)) > 0;
