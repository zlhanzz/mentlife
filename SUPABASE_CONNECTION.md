# Supabase Connection Guide - MentLife

## Status Saat Ini

### ✅ Yang Sudah Diperbaiki:

1. **File `.env.local`** - Diperbaiki formatnya (key terpotong menjadi 2 baris)
2. **`src/lib/supabase/client.ts`** - Ditambahkan validasi environment variables
3. **`src/lib/supabase/server.ts`** - Ditambahkan validasi environment variables
4. **`src/lib/supabase/health-check.ts`** - Utility baru untuk cek koneksi
5. **`src/components/supabase-health-check.tsx`** - Komponen visual untuk debug
6. **`src/proxy.ts`** - Ditambahkan error logging

---

## Cara Test Koneksi Supabase

### 1. Jalankan Development Server
```bash
npm run dev
```

### 2. Buka Dashboard
Akses `http://localhost:3000/dashboard` dan lihat bagian bawah nav untuk status koneksi.

### 3. Cek Console
Jika ada error, akan muncul log di browser console atau terminal.

---

## Troubleshooting

### Error: "Missing Supabase environment variables"

**Penyebab:** File `.env.local` tidak terbaca atau variabel tidak terdefinisi.

**Solusi:**
1. Pastikan file `.env.local` ada di root project
2. Pastikan variabel berikut ada:
   ```
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."
   ```

### Error: "Invalid API key" atau "unauthorized"

**Penyebab:** API key tidak valid atau sudah expired.

**Solusi:**
1. Buka Supabase Dashboard → Settings → API
2. Copy `anon/public key` (bukan service role key)
3. Update `.env.local` dengan key baru

### Error: "Network error" atau timeout

**Penyebab:** 
- URL Supabase salah
- Koneksi internet bermasalah
- Firewall memblokir akses

**Solusi:**
1. Cek URL di Supabase Dashboard (Settings → API)
2. Test koneksi internet
3. Coba akses `https://your-project.supabase.co/rest/v1/` di browser

---

## Environment Variables

### Wajib (Public):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Opsional (Server-side):
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

> ⚠️ **Jangan commit** `SUPABASE_SERVICE_ROLE_KEY` ke repository public!

---

## Database Setup Checklist

Pastikan tabel-tabel berikut ada di Supabase:

- [ ] `profiles` - User profiles
- [ ] `financial_profiles` - Financial data
- [ ] `users_core` - User demographic
- [ ] `financial_transactions` - Transaction history
- [ ] `transactions` - Legacy transactions
- [ ] `tasks` - User tasks
- [ ] `chat_messages` - AI chat history
- [ ] `ai_memory` - AI long-term memory
- [ ] `decision_projections` - Simulation results

---

## Quick Fix Script

Jika koneksi masih bermasalah, jalankan:

```bash
# 1. Cek environment variables
cat .env.local

# 2. Restart dev server
npm run dev

# 3. Clear cache
rm -rf .next
npm run dev
```

---

## Kontak Support

Jika masih ada masalah:
1. Cek Supabase Dashboard → Logs
2. Cek Supabase Status: https://status.supabase.com/
3. Review error message di console/terminal
