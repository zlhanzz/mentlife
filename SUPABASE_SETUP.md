# Setup Supabase - MentLife

## Langkah-langkah Setup

### 1. Dapatkan API Keys dari Supabase

1. Buka [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Pilih project Anda atau buat project baru
3. Klik **Settings** (kiri bawah) → **API**
4. Copy informasi berikut:

```
Project URL: https://lnkpomahqbqugpkmtybg.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIs...
```

### 2. Update File `.env.local`

Edit file `.env.local` di root project:

```bash
# Buka file
nano .env.local
# atau
vi .env.local
```

Isi dengan:

```env
NEXT_PUBLIC_SUPABASE_URL="https://lnkpomahqbqugpkmtybg.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ACTUAL_JWT_TOKEN_HERE"
```

**PENTING:**
- Ganti `YOUR_ACTUAL_JWT_TOKEN_HERE` dengan API key yang valid (mulai dengan `eyJhbG...`)
- Jangan gunakan placeholder seperti `YOUR_ANON_KEY_HERE` atau `EXAMPLE`

### 3. Verifikasi Setup

Jalankan script test:

```bash
node scripts/test-supabase-connection.js
```

Atau jalankan development server:

```bash
npm run dev
```

Lihat status koneksi di bagian bawah dashboard.

### 4. Setup Database Tables

Pastikan tabel-tabel berikut ada di Supabase:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles, skills, hobbies, career |
| `financial_profiles` | Income, debt, savings, investment |
| `users_core` | User demographic & financial state |
| `financial_transactions` | Transaction history |
| `tasks` | User tasks |
| `chat_messages` | AI chat history |
| `ai_memory` | AI long-term memory |
| `decision_projections` | Simulation results |

Jika tabel belum ada, jalankan SQL migration di Supabase Dashboard → SQL Editor.

### 5. Setup RLS Policies (Row Level Security)

Untuk setiap tabel, pastikan RLS policies sudah dikonfigurasi:

**Contoh untuk tabel `profiles`:**

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);
```

Lakukan hal yang sama untuk tabel-tabel lainnya.

### Troubleshooting

#### Error: "Missing environment variables"
- Pastikan file `.env.local` ada di root project
- Pastikan variabel `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` terisi

#### Error: "Invalid API key"
- API key harus berupa JWT token lengkap (mulai dengan `eyJhbG...`)
- Jangan copy placeholder dari dokumentasi

#### Error: "Permission denied"
- Cek RLS policies di Supabase Dashboard
- Pastikan user memiliki hak akses untuk membaca/menulis data

#### Error: "Table not found"
- Pastikan tabel sudah dibuat di Supabase
- Jalankan SQL migration untuk membuat tabel

### Kontak

Jika masih ada masalah:
1. Cek Supabase Dashboard → Logs
2. Cek Supabase Status: https://status.supabase.com/
3. Review error message di console/terminal
