-- Migration: Add missing columns to users_core table
-- These columns are needed for the onboarding flow

-- Add display_name column
ALTER TABLE public.users_core ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);

-- Add birth_date column
ALTER TABLE public.users_core ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add gender column with check constraint
ALTER TABLE public.users_core ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('Laki-laki', 'Perempuan', 'Memilih untuk tidak menjawab'));

-- Add domicile column
ALTER TABLE public.users_core ADD COLUMN IF NOT EXISTS domicile TEXT;

-- Add living_situation column with check constraint
ALTER TABLE public.users_core ADD COLUMN IF NOT EXISTS living_situation VARCHAR(50) CHECK (living_situation IN (
  'Tinggal Bersama Orang Tua/Keluarga',
  'Sewa/Ngekost Bulanan',
  'Sewa/Kontrak Tahunan',
  'Milik Sendiri (KPR)',
  'Milik Sendiri (Lunas)'
));

-- Add work_devices column (array of text)
ALTER TABLE public.users_core ADD COLUMN IF NOT EXISTS work_devices TEXT[] DEFAULT '{}'::TEXT[];

-- Add device_brands column (JSONB for brand/model mapping)
ALTER TABLE public.users_core ADD COLUMN IF NOT EXISTS device_brands JSONB DEFAULT '{}'::JSONB;

-- Add mobility_assets column (array of text)
ALTER TABLE public.users_core ADD COLUMN IF NOT EXISTS mobility_assets TEXT[] DEFAULT '{}'::TEXT[];

-- Add insurance column
ALTER TABLE public.users_core ADD COLUMN IF NOT EXISTS insurance TEXT;

-- Add life_goal column
ALTER TABLE public.users_core ADD COLUMN IF NOT EXISTS life_goal TEXT;
