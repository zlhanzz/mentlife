-- AI Cache & Usage Tracking Tables for MentLife
-- Run this migration in Supabase SQL editor to create the tables.

-- 1. AI Cache: stores AI-generated results (recommendations, projections) to avoid redundant API calls
CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  cache_type TEXT NOT NULL,  -- 'recommendations' | 'decision_projection'
  cached_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, cache_key)
);

-- Index for fast lookups by user + cache_key
CREATE INDEX IF NOT EXISTS idx_ai_cache_lookup ON ai_cache(user_id, cache_key);
-- Index for cleanup of expired rows
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache(expires_at);

-- 2. AI Usage: tracks every AI API call for cost monitoring
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
  prompt_tokens INT NOT NULL DEFAULT 0,
  completion_tokens INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  call_type TEXT NOT NULL,  -- 'recommendations' | 'chat' | 'extraction' | 'decision'
  cached BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for per-user usage queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id, created_at DESC);
-- Index for cost reporting
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage(created_at DESC);

-- 3. RLS policies: users can only read their own cache and usage
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own ai_cache" ON ai_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own ai_cache" ON ai_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own ai_cache" ON ai_cache
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users read own ai_usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own ai_usage" ON ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Grant access to service_role for background jobs (Inngest)
GRANT ALL ON ai_cache TO service_role;
GRANT ALL ON ai_usage TO service_role;
