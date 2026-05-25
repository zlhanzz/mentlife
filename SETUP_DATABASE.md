# Setup Database MentLife

## Langkah-langkah Setup Database

### 1. Buka Supabase Dashboard
1. Buka [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Pilih project Anda: `lnkpomahqbqugpkmtybg`

### 2. Jalankan SQL Migration
1. Klik menu **SQL Editor** di kiri
2. Klik **New Query**
3. Copy isi file `setup-database.sql` (di root project)
4. Paste ke SQL Editor
5. Klik **Run**

### 3. Verifikasi Tabel
Setelah menjalankan SQL, pastikan tabel-tabel berikut muncul di **Table Editor**:
- ✅ profiles
- ✅ financial_profiles
- ✅ users_core
- ✅ financial_transactions (sudah ada)
- ✅ tasks
- ✅ chat_messages
- ✅ ai_memory
- ✅ decision_projections
- ✅ transactions

### 4. Test Aplikasi
1. Jalankan: `npm run dev`
2. Buka: http://localhost:3000
3. Login dengan akun Anda
4. Lihat status koneksi di bagian bawah dashboard

## Troubleshooting

### Error: "relation already exists"
- Tabel sudah ada, abaikan error ini
- Lanjut ke langkah berikutnya

### Error: "permission denied"
- Pastikan Anda login dengan akun yang memiliki akses ke tabel
- Cek RLS policies di SQL Editor

### Error: "extension already exists"
- UUID extension sudah diaktifkan
- Lanjut ke langkah berikutnya

## Kontak
Jika ada masalah, cek:
1. Supabase Dashboard → Logs
2. Supabase Status: https://status.supabase.com/
3. Console browser untuk error message
