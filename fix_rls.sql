-- Fix RLS policies on financial_transactions table
-- The old policies incorrectly compared auth.uid() to the table's PK (id)
-- instead of the user's FK (user_id), blocking ALL inserts/reads.

-- Drop old broken policies
DROP POLICY IF EXISTS "Users can read own transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON financial_transactions;

-- Create correct policies using user_id (the foreign key column)
CREATE POLICY "Users can read own transactions" ON financial_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON financial_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON financial_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON financial_transactions FOR DELETE USING (auth.uid() = user_id);
