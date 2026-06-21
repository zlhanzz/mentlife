# Walkthrough: Edge-Based Routing & Rate Limiting (Upstash / Cloudflare)

Dokumen ini menjelaskan daftar perubahan dan hasil pengujian untuk integrasi Edge-Based Routing & Rate Limiting menggunakan Upstash Redis di MentLife.

## 1. Daftar Perubahan

* **[middleware.ts](file:///c:/Users/ZHULL/Documents/MentLife%20Project/src/middleware.ts)**:
  - Membuat Next.js Edge Middleware terpadu.
  - Mengintegrasikan Upstash `@upstash/ratelimit` dan `@upstash/redis` untuk rate limiting berbasis IP address di Edge.
  - Menerapkan batasan 10 request per 10 detik untuk API sensitif (`/api/inngest`, `/api/chat`, dan seluruh request `POST` Server Actions).
  - Menyediakan *fail-safe* graceful degradation: jika Redis tidak terkonfigurasi atau error saat runtime, request akan di-bypass secara otomatis.
  - Melanjutkan routing ke `proxy` (Supabase auth & session routing).
* **[.env.example](file:///c:/Users/ZHULL/Documents/MentLife%20Project/.env.example)** & **[.env.local](file:///c:/Users/ZHULL/Documents/MentLife%20Project/.env.local)**:
  - Menambahkan baris konfigurasi `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN`.

## 2. Hasil Pengujian & Kompilasi

* **TypeScript Compilation**:
  - Berhasil menyelesaikan pengujian kompilasi dengan menjalankan `npx tsc --noEmit` yang menghasilkan **Zero Errors** (lulus kompilasi sukses).

## 3. Petunjuk Deploy & Menjalankan secara Lokal

1. Dapatkan kredensial Redis Serverless dari konsol [Upstash](https://upstash.com).
2. Tambahkan variabel lingkungan berikut ke berkas `.env.local` Anda untuk mengaktifkan rate limiting secara riil:
   ```env
   UPSTASH_REDIS_REST_URL=https://nama-database.upstash.io
   UPSTASH_REDIS_REST_TOKEN=token_rahasia_anda
   ```
   *Catatan: Jika variabel ini dikosongkan, middleware akan secara otomatis melakukan bypass agar proses development lokal Anda tidak terganggu.*
3. Jalankan server lokal seperti biasa:
   ```bash
   npm run dev
   ```
