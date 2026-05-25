# Setup Google Auth - MentLife

## Langkah-langkah Setup Google OAuth

### 1. Buka Google Cloud Console
1. Buka [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Pilih project Anda atau buat project baru

### 2. Aktifkan Google+ API
1. Klik **APIs & Services** → **Library**
2. Cari "Google+ API"
3. Klik **Enable**

### 3. Buat OAuth 2.0 Credentials
1. Klik **APIs & Services** → **Credentials**
2. Klik **Create Credentials** → **OAuth client ID**
3. Konfigurasi konsent:
   - Application type: **Web application**
   - Name: **MentLife**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)
4. Klik **Create**
5. Copy **Client ID** dan **Client Secret**

### 4. Konfigurasi di Supabase Dashboard
1. Buka [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Pilih project Anda: `lnkpomahqbqugpkmtybg`
3. Klik **Authentication** → **Providers**
4. Aktifkan **Google**
5. Paste **Client ID** dan **Client Secret** dari Google Cloud Console
6. Klik **Save**

### 5. Update Environment Variables
Edit file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL="https://lnkpomahqbqugpkmtybg.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 6. Test Google Auth
1. Jalankan: `npm run dev`
2. Buka: http://localhost:3000/login
3. Klik tombol **"Continue with Google"**
4. Login dengan akun Google Anda
5. Setelah login, Anda akan diarahkan ke halaman onboarding

---

## Troubleshooting

### Error: "Invalid redirect URI"
- Pastikan redirect URI di Google Cloud Console sama dengan `NEXT_PUBLIC_SITE_URL/auth/callback`
- Format: `http://localhost:3000/auth/callback` (development)

### Error: "OAuth provider not configured"
- Pastikan Google provider sudah diaktifkan di Supabase Dashboard
- Pastikan Client ID dan Client Secret sudah benar

### Error: "Origin not allowed"
- Tambahkan origin di Google Cloud Console:
  - `http://localhost:3000` (development)
  - `https://yourdomain.com` (production)

### Error: "Email not confirmed"
- Jika menggunakan email baru dari Google, pastikan email sudah diverifikasi
- Atau nonaktifkan email confirmation di Supabase Dashboard → Authentication → Settings

---

## Cara Kerja Google Auth di MentLife

1. User klik tombol "Continue with Google"
2. Aplikasi redirect ke Supabase OAuth endpoint
3. Supabase redirect ke Google login page
4. User login dengan Google
5. Google redirect kembali ke `/auth/callback` dengan code
6. Route handler `/auth/callback` menukar code dengan session
7. User diarahkan ke dashboard atau onboarding

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://lnkpomahqbqugpkmtybg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGciOiJIUzI1NiIs...` |
| `NEXT_PUBLIC_SITE_URL` | Site URL untuk redirect | `http://localhost:3000` |

---

## File-file yang Dimodifikasi

| File | Fungsi |
|------|--------|
| `src/features/auth/actions.ts` | Menambahkan `loginWithGoogleAction` dan `registerWithGoogleAction` |
| `src/app/auth/callback/route.ts` | Route handler untuk OAuth callback |
| `src/features/auth/components/login-form.tsx` | Menambahkan tombol Google login |
| `src/features/auth/components/register-form.tsx` | Menambahkan tombol Google register |
| `.env.local` | Menambahkan `NEXT_PUBLIC_SITE_URL` |

---

## Kontak

Jika ada masalah:
1. Cek Supabase Dashboard → Authentication → Logs
2. Cek Google Cloud Console → APIs & Services → Logs
3. Review error message di console/terminal
