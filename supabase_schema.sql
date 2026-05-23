-- 1. Tabel Profil Utama (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name TEXT,
    background TEXT,
    skills TEXT[],
    experience TEXT,
    hobbies TEXT[],
    interests TEXT[],
    career_state TEXT,
    career_goal TEXT,
    life_goal TEXT,
    xp INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    badges TEXT[] DEFAULT '{}'::text[] NOT NULL
);

-- Aktifkan RLS untuk profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);


-- 2. Tabel Finansial Pengguna (Relasi One-to-One dengan profiles)
CREATE TABLE public.financial_profiles (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    monthly_income NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    fixed_expenses NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    total_debt NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    debt_details TEXT,
    current_stage TEXT DEFAULT 'DEBT' NOT NULL, -- 'DEBT', 'EMERGENCY_FUND', 'INVESTMENT'
    emergency_fund_target NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    emergency_fund_current NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    liquid_savings NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    investment_value NUMERIC(15, 2) DEFAULT 0.00 NOT NULL
);

-- Aktifkan RLS untuk financial_profiles
ALTER TABLE public.financial_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own financial profile" 
ON public.financial_profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own financial profile" 
ON public.financial_profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own financial profile" 
ON public.financial_profiles FOR INSERT 
WITH CHECK (auth.uid() = id);


-- 3. Tabel Transaksi Keuangan
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    type TEXT NOT NULL, -- 'INCOME', 'EXPENSE'
    category TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE NOT NULL
);

-- Aktifkan RLS untuk transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update/delete their own transactions" 
ON public.transactions FOR ALL 
USING (auth.uid() = user_id);


-- 4. Tabel Chat Obrolan dengan AI
CREATE TABLE public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    role TEXT NOT NULL, -- 'user', 'assistant'
    content TEXT NOT NULL
);

-- Aktifkan RLS untuk chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat messages" 
ON public.chat_messages FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages" 
ON public.chat_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);


-- 5. Tabel Proyeksi Keputusan (Mirofish Simulator)
CREATE TABLE public.decision_projections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    horizon_years INTEGER DEFAULT 5 NOT NULL,
    projection_output JSONB NOT NULL
);

-- Aktifkan RLS untuk decision_projections
ALTER TABLE public.decision_projections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projections" 
ON public.decision_projections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projections" 
ON public.decision_projections FOR INSERT 
WITH CHECK (auth.uid() = user_id);


-- 6. Trigger Otomatis Pembuatan Profil saat Auth Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, xp, level, badges)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Mentee'), 0, 1, '{}'::text[]);
  
  INSERT INTO public.financial_profiles (id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 7. Tabel To-Do List & Produktivitas
CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    due_date DATE,
    completed BOOLEAN DEFAULT false NOT NULL,
    category TEXT DEFAULT 'Personal' NOT NULL -- 'Career', 'Finance', 'Personal'
);

-- Aktifkan RLS untuk tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks" 
ON public.tasks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" 
ON public.tasks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update/delete their own tasks" 
ON public.tasks FOR ALL 
USING (auth.uid() = user_id);


-- ================= MIGRASI BACKWARD COMPATIBILITY (Jika tabel sudah dibuat sebelumnya) =================
-- Jika tabel profiles sudah ada dan ingin menambahkan kolom gamifikasi, jalankan perintah di bawah ini:
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0 NOT NULL;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 NOT NULL;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}'::text[] NOT NULL;
