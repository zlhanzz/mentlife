-- Enable the pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Country Localization Rules Table
CREATE TABLE IF NOT EXISTS public.country_localization_rules (
    country_code VARCHAR(2) PRIMARY KEY,
    currency_code VARCHAR(3) NOT NULL,
    informal_economy_sectors TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    standard_working_hours_per_week INT DEFAULT 40 NOT NULL
);

-- Seed country localization rules
INSERT INTO public.country_localization_rules (country_code, currency_code, informal_economy_sectors, standard_working_hours_per_week)
VALUES 
('ID', 'IDR', ARRAY['ojek_online', 'affiliate_lokal', 'makelar_properti', 'jasa_ketik', 'warung_kelontong'], 40),
('SG', 'SGD', ARRAY['grab_car', 'food_delivery', 'dropship_global', 'freelance_tutor'], 44),
('US', 'USD', ARRAY['uber_driver', 'doordash_delivery', 'etsy_shop', 'amazon_fba', 'fiverr_gigs'], 40)
ON CONFLICT (country_code) DO UPDATE SET
    currency_code = EXCLUDED.currency_code,
    informal_economy_sectors = EXCLUDED.informal_economy_sectors,
    standard_working_hours_per_week = EXCLUDED.standard_working_hours_per_week;

-- Enable RLS for country_localization_rules
ALTER TABLE public.country_localization_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to country rules" 
ON public.country_localization_rules FOR SELECT 
USING (true);


-- 2. Users Core (Demographics & Baseline Sandbox) Table
CREATE TABLE IF NOT EXISTS public.users_core (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    formal_status VARCHAR(50) CHECK (formal_status IN ('Mahasiswa', 'Karyawan', 'Pengusaha', 'Freelancer', 'Menganggur')) DEFAULT 'Menganggur' NOT NULL,
    primary_focus TEXT,
    daily_free_hours INTEGER DEFAULT 0 NOT NULL,
    financial_state_id VARCHAR(50) CHECK (financial_state_id IN ('Survival', 'Stabilitas', 'Pertumbuhan', 'Kebebasan')) DEFAULT 'Survival' NOT NULL,
    country_code VARCHAR(2) REFERENCES public.country_localization_rules(country_code) DEFAULT 'ID' NOT NULL,
    risk_profile VARCHAR(20) CHECK (risk_profile IN ('konservatif', 'moderat', 'agresif')) DEFAULT 'moderat' NOT NULL,
    dependents_count INT DEFAULT 0 NOT NULL,
    is_sandwich_gen BOOLEAN DEFAULT false NOT NULL,
    owned_assets TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    marital_status VARCHAR(30) CHECK (marital_status IN ('single', 'married', 'previously_married', 'pacaran')) DEFAULT 'single' NOT NULL,
    major_life_goals TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    health_baseline VARCHAR(30) CHECK (health_baseline IN ('fit', 'physical_limitation', 'burnout_alert')) DEFAULT 'fit' NOT NULL,
    rent_by_choice BOOLEAN DEFAULT false NOT NULL,
    ai_communication_style VARCHAR(50) CHECK (ai_communication_style IN ('empatis_sabar', 'tegas_disiplin', 'logis_objektif')) DEFAULT 'empatis_sabar' NOT NULL,
    current_roadblock VARCHAR(50) CHECK (current_roadblock IN ('sulit_menabung', 'arah_karir', 'burnout_lelah', 'kurang_disiplin')) DEFAULT 'sulit_menabung' NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for users_core
ALTER TABLE public.users_core ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own users_core" 
ON public.users_core FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own users_core" 
ON public.users_core FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own users_core" 
ON public.users_core FOR INSERT 
WITH CHECK (auth.uid() = id);


-- 3. Financial Ledgers (Hard Data & Transactions) Table
CREATE TABLE IF NOT EXISTS public.financial_ledgers (
    transaction_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    transaction_type VARCHAR(10) CHECK (transaction_type IN ('income', 'expense')) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('kebutuhan_dasar', 'sewa', 'variabel', 'investasi', 'cicilan_hutang')) NOT NULL,
    is_recurring BOOLEAN DEFAULT false NOT NULL,
    debt_type VARCHAR(30) CHECK (debt_type IN ('high_interest_toxic', 'bank_standard', 'family_zero_interest', 'none')) DEFAULT 'none' NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for financial_ledgers
ALTER TABLE public.financial_ledgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own financial_ledgers" 
ON public.financial_ledgers FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial_ledgers" 
ON public.financial_ledgers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update/delete their own financial_ledgers" 
ON public.financial_ledgers FOR ALL 
USING (auth.uid() = user_id);


-- 4. Ikigai Vectors (Soft Data & Semantic Memory) Table
CREATE TABLE IF NOT EXISTS public.ikigai_vectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(30) CHECK (category IN ('passion', 'skill', 'market_demand', 'life_goal', 'social_capital')) NOT NULL,
    embedding VECTOR(1536), -- 1536 dimensions for OpenAI/standard embeddings (nullable)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for ikigai_vectors
ALTER TABLE public.ikigai_vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ikigai_vectors" 
ON public.ikigai_vectors FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ikigai_vectors" 
ON public.ikigai_vectors FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update/delete their own ikigai_vectors" 
ON public.ikigai_vectors FOR ALL 
USING (auth.uid() = user_id);


-- 5. Upgrade new user trigger to populate users_core
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, xp, level, badges)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Mentee'), 0, 1, '{}'::text[]);
  
  INSERT INTO public.financial_profiles (id)
  VALUES (new.id);
  
  INSERT INTO public.users_core (id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Backfill existing profiles into users_core
INSERT INTO public.users_core (id)
SELECT id FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- 7. Migrasi Tab PRIBADI (Final Blueprint)
ALTER TABLE public.users_core 
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(50),
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(30) CHECK (gender IN ('Laki-laki', 'Perempuan', 'Memilih untuk tidak menjawab')),
  ADD COLUMN IF NOT EXISTS domicile TEXT,
  ADD COLUMN IF NOT EXISTS living_situation VARCHAR(100) CHECK (living_situation IN ('Tinggal Bersama Orang Tua/Keluarga', 'Sewa/Ngekost Bulanan', 'Sewa/Kontrak Tahunan', 'Milik Sendiri (KPR)', 'Milik Sendiri (Lunas)')),
  ADD COLUMN IF NOT EXISTS has_physical_limitation BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS physical_limitation_details TEXT,
  ADD COLUMN IF NOT EXISTS work_devices TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS mobility_assets TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS life_goal TEXT;

-- Drop old check constraint on marital_status and add the new one
ALTER TABLE public.users_core DROP CONSTRAINT IF EXISTS users_core_marital_status_check;
ALTER TABLE public.users_core ADD CONSTRAINT users_core_marital_status_check CHECK (marital_status IN ('single', 'married', 'previously_married', 'pacaran'));

-- Tambahkan kolom age pada tabel profiles jika belum ada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INT;

-- 8. Kolom-kolom baru untuk CareerProfileTab (6 seksi baru)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS education_options TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS education_story TEXT,
  ADD COLUMN IF NOT EXISTS status_options TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS status_story TEXT,
  ADD COLUMN IF NOT EXISTS skills_story TEXT,
  ADD COLUMN IF NOT EXISTS hobbies_story TEXT,
  ADD COLUMN IF NOT EXISTS interests_story TEXT,
  ADD COLUMN IF NOT EXISTS north_star_options TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS north_star_story TEXT;


-- 9. Kolom-kolom baru untuk FinanceProfileTab (Keuangan Lengkap)
ALTER TABLE public.financial_profiles 
  ADD COLUMN IF NOT EXISTS cashflow_story TEXT,
  ADD COLUMN IF NOT EXISTS other_assets NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  ADD COLUMN IF NOT EXISTS savings_story TEXT,
  ADD COLUMN IF NOT EXISTS has_debt BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS debt_high_interest NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  ADD COLUMN IF NOT EXISTS debt_productive NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  ADD COLUMN IF NOT EXISTS debt_zero_interest NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  ADD COLUMN IF NOT EXISTS debt_story TEXT,
  ADD COLUMN IF NOT EXISTS has_investments BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS investment_instruments TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  ADD COLUMN IF NOT EXISTS investment_story TEXT,
  ADD COLUMN IF NOT EXISTS financial_priorities TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  ADD COLUMN IF NOT EXISTS financial_goals_story TEXT;


-- 10. Tabel financial_transactions baru
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) CHECK (type IN ('INCOME', 'EXPENSE', 'ALLOCATION')) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint untuk memvalidasi kategori berdasarkan jenis transaksi
    CONSTRAINT check_category_by_type CHECK (
        (type = 'INCOME' AND category IN ('Gaji', 'Bisnis', 'Lainnya')) OR
        (type = 'EXPENSE' AND category IN ('Kebutuhan Wajib', 'Keinginan')) OR
        (type = 'ALLOCATION' AND category IN ('Dana Darurat', 'Bayar Utang', 'Investasi'))
    )
);

-- Enable RLS for financial_transactions
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own financial_transactions" 
ON public.financial_transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial_transactions" 
ON public.financial_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update/delete their own financial_transactions" 
ON public.financial_transactions FOR ALL 
USING (auth.uid() = user_id);


