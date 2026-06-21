# Rencana Implementasi: Edge-Based Routing & Rate Limiting (Upstash / Cloudflare)

Rencana ini dibuat sebagai panduan langkah demi langkah untuk mengintegrasikan Edge-Based Routing & Rate Limiting di MentLife menggunakan **Upstash Redis** di layer middleware Next.js.
1. Memasang package `@upstash/ratelimit` dan `@upstash/redis` untuk mendukung deteksi IP address dan pembatasan API call (rate limiting) berlatensi ultra-rendah di Edge.
2. Mengamankan endpoint sensitif (seperti API Route Inngest `/api/inngest` dan Server Actions/API Chat/Simulasi) dari potensi abuse (DDOS, serangan spamming API key, pembengkakan token kuota Gemini).
3. Mengarahkan traffic / merancang fail-safe mechanism agar middleware dapat menangani kegagalan koneksi Redis Upstash tanpa menghambat pengalaman pengguna (graceful degradation).

## 1. Analisis Masalah & Tujuan

- **Masalah**:
  - Aplikasi menggunakan LLM berbayar/quota-limited (`gemini-3.5-flash`) untuk menghasilkan chat dan simulasi. Pihak tidak bertanggung jawab dapat mengeksploitasi Server Actions chat atau endpoint API `/api/inngest` secara masif, menghabiskan API quota, dan melambungkan biaya operasional.
  - Saat ini, tidak ada mekanisme rate limiting di tingkat gateway/middleware untuk membatasi jumlah request per IP address.
- **Solusi**:
  - Memperluas middleware Next.js dengan mengarahkan request ke file `src/middleware.ts` baru (atau memodifikasi wrapper) yang mengintegrasikan `@upstash/ratelimit` berbasis algoritma Token Bucket / Sliding Window.
  - Membatasi request ke `/api/inngest` dan `/dashboard` (Server Action chat) secara proporsional (misalnya: maksimum 10 request per 10 detik per IP).
  - Jika limit terlampaui, kembalikan HTTP Status `429 Too Many Requests` dengan format JSON yang rapi atau respons visual.

## 2. Dampak Perubahan

* **[package.json](file:///c:/Users/ZHULL/Documents/MentLife%20Project/package.json)**:
  - Menambahkan dependensi `@upstash/ratelimit` dan `@upstash/redis`.
* **[middleware.ts](file:///c:/Users/ZHULL/Documents/MentLife%20Project/src/middleware.ts)** (File Baru di Root `src/`):
  - Mengimplementasikan Next.js Edge Middleware standar.
  - Mengimpor `proxy` dari `src/proxy.ts` untuk mengamankan routing auth/Supabase.
  - Mengintegrasikan Upstash Rate Limiter berbasis deteksi IP client (`request.ip` atau header `x-forwarded-for`).
* **[.env.example](file:///c:/Users/ZHULL/Documents/MentLife%20Project/.env.example)** & **[.env.local](file:///c:/Users/ZHULL/Documents/MentLife%20Project/.env.local)**:
  - Menyediakan konfigurasi `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` sebagai parameter koneksi Redis.

## 3. Langkah-Langkah Eksekusi

1. **Instalasi Dependencies**:
   - Jalankan `cmd /c "npm install @upstash/ratelimit @upstash/redis"` di background.
2. **Konfigurasi Variabel Lingkungan**:
   - Tambahkan placeholder Upstash Redis URL dan Token ke `.env.example`.
   - Di `.env.local`, tambahkan fallback dev values atau baca kredensial jika tersedia. Jika tidak ada, buat bypass agar rate limiter tidak menghalangi development lokal (graceful bypass).
3. **Penyusunan Edge Middleware (`src/middleware.ts`)**:
   - Definisikan `middleware(request: NextRequest)` yang beroperasi di Next.js Edge Runtime.
   - Periksa IP Address client.
   - Terapkan aturan rate limit untuk jalur API sensitif (misal `/api/inngest`, `/api/chat` atau request POST Server Action).
   - Jika limit terlampaui, kembalikan `new NextResponse(JSON.stringify({ error: "Too many requests. Please try again later." }), { status: 429, headers: { 'Content-Type': 'application/json' } })`.
   - Jika lolos rate limit, teruskan request ke `proxy(request)` (yang menangani Supabase session dan auth redirect).
4. **Verifikasi Kompilasi**:
   - Jalankan `cmd /c "npx tsc --noEmit"` untuk mengonfirmasi nol error kompilasi.

## 4. Rencana Verifikasi

1. **Kompilasi TypeScript**: Pastikan tidak ada error kompilasi TS.
2. **Uji Simulasi Rate Limiting**:
   - Simulasikan request berulang secara cepat ke endpoint `/api/inngest` atau halaman dashboard.
   - Pastikan server merespons dengan HTTP Status 429 ketika batas batas terlampaui.
