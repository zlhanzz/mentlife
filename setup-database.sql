-- MentLife Database Setup
-- Copy dan jalankan di Supabase Dashboard → SQL Editor

-- Enable UUID extension (jika belum diaktifkan)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  age INTEGER,
  background TEXT,
  life_goal TEXT,
  skills TEXT[],
  experience TEXT,
  hobbies TEXT[],
  interests TEXT[],
  career_state TEXT,
  career_goal TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges TEXT[],
  health_mental TEXT,
  communication_style TEXT,
  risk_tolerance TEXT,
  time_availability INTEGER,
  financial_literacy_level TEXT,
  income_type TEXT,
  location TEXT,
  education TEXT,
  ikigai_passion TEXT[],
  ikigai_profession TEXT[],
  ikigai_mission TEXT[],
  ikigai_vocation TEXT[],
  skills_assessment JSONB,
  values_and_beliefs TEXT[],
  current_challenges TEXT[],
  support_system TEXT[],
  learning_preference TEXT,
  motivation_triggers TEXT[],
  financial_behavior_score INTEGER,
  financial_goals TEXT[],
  credit_score INTEGER,
  financial_literacy_score INTEGER,
  education_options TEXT[],
  education_story TEXT,
  status_options TEXT[],
  status_story TEXT,
  skills_story TEXT,
  hobbies_story TEXT,
  interests_story TEXT,
  north_star_options TEXT[],
  north_star_story TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create financial_profiles table
CREATE TABLE IF NOT EXISTS financial_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  monthly_income NUMERIC DEFAULT 0,
  fixed_expenses NUMERIC DEFAULT 0,
  total_debt NUMERIC DEFAULT 0,
  debt_details TEXT,
  liquid_savings NUMERIC DEFAULT 0,
  investment_value NUMERIC DEFAULT 0,
  emergency_fund_current NUMERIC DEFAULT 0,
  emergency_fund_target NUMERIC DEFAULT 0,
  current_stage TEXT DEFAULT 'EMERGENCY_FUND',
  monthly_expenses_breakdown JSONB,
  assets TEXT[],
  debt_type TEXT,
  cashflow_story TEXT,
  other_assets NUMERIC DEFAULT 0,
  savings_story TEXT,
  has_debt BOOLEAN DEFAULT FALSE,
  debt_high_interest NUMERIC DEFAULT 0,
  debt_productive NUMERIC DEFAULT 0,
  debt_zero_interest NUMERIC DEFAULT 0,
  debt_story TEXT,
  has_investments BOOLEAN DEFAULT FALSE,
  investment_instruments TEXT[],
  investment_story TEXT,
  financial_priorities TEXT[],
  financial_goals_story TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create users_core table
CREATE TABLE IF NOT EXISTS users_core (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  formal_status TEXT DEFAULT 'Karyawan',
  primary_focus TEXT,
  daily_free_hours INTEGER DEFAULT 2,
  financial_state_id TEXT DEFAULT 'Stabilitas',
  country_code TEXT DEFAULT 'ID',
  risk_profile TEXT DEFAULT 'moderat',
  dependents_count INTEGER DEFAULT 0,
  is_sandwich_gen BOOLEAN DEFAULT FALSE,
  owned_assets TEXT[],
  marital_status TEXT DEFAULT 'single',
  major_life_goals TEXT[],
  health_baseline TEXT DEFAULT 'fit',
  rent_by_choice BOOLEAN DEFAULT FALSE,
  ai_communication_style TEXT DEFAULT 'empatis_sabar',
  current_roadblock TEXT DEFAULT 'sulit_menabung',
  display_name TEXT,
  birth_date DATE,
  gender TEXT,
  domicile TEXT,
  living_situation TEXT,
  has_physical_limitation BOOLEAN DEFAULT FALSE,
  physical_limitation_details TEXT,
  work_devices TEXT[],
  mobility_assets TEXT[],
  life_goal TEXT,
  ai_memory JSONB,
  learning_preference TEXT,
  motivation_triggers TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'Personal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create ai_memory table
CREATE TABLE IF NOT EXISTS ai_memory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  context TEXT NOT NULL,
  insight TEXT NOT NULL,
  confidence NUMERIC DEFAULT 0.9,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create decision_projections table
CREATE TABLE IF NOT EXISTS decision_projections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  horizon_years INTEGER NOT NULL,
  projection_output JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create transactions table (legacy)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_core ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for financial_profiles
CREATE POLICY "Users can read own financial profile" ON financial_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own financial profile" ON financial_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own financial profile" ON financial_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for users_core
CREATE POLICY "Users can read own users_core" ON users_core FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own users_core" ON users_core FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own users_core" ON users_core FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for tasks
CREATE POLICY "Users can read own tasks" ON tasks FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can read own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for ai_memory
CREATE POLICY "Users can read own ai memory" ON ai_memory FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own ai memory" ON ai_memory FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for decision_projections
CREATE POLICY "Users can read own projections" ON decision_projections FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own projections" ON decision_projections FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for transactions
CREATE POLICY "Users can read own legacy transactions" ON transactions FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own legacy transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_financial_profiles_user_id ON financial_profiles(id);
CREATE INDEX IF NOT EXISTS idx_users_core_user_id ON users_core(id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_user_id ON ai_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_projections_user_id ON decision_projections(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
