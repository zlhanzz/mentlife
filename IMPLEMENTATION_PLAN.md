# Rencana Implementasi: Audit & Optimasi Tata Letak Menu Keuangan

Rencana ini disusun untuk mengoptimalkan tampilan tab Keuangan dengan menghapus elemen-elemen yang memadati layar dan tidak esensial, serta menyelaraskan pemahaman logika keuangan dan kesiapan AI.

## 1. Analisis Masalah & Kebutuhan

Berdasarkan masukan pengguna:
1. **Audit Tata Letak**: Layar tab Keuangan saat ini terlalu padat. Beberapa elemen visual dirasa redundan atau hanya memadati layar tanpa nilai tambah harian yang signifikan.
2. **Hapus AI Ledger**: Bilah input transaksi berbasis bahasa natural ("AI Ledger") tidak diperlukan lagi karena pengguna dapat menggunakan modal transaksi terstruktur yang sudah ada.
3. **Hapus Banner Informasi Profil**: Keterangan tentang memperbarui saldo utama/baseline keuangan melalui Tab Profil harus dihapus. Saldo aktual berjalan secara dinamis berdasarkan pencatatan transaksi masuk (Pemasukan), keluar (Pengeluaran), dan Alokasi. Data di profil hanyalah estimasi awal (baseline) untuk menentukan posisi awal tangga keuangan pengguna saat pertama kali menggunakan aplikasi.
4. **Kesiapan AI Tanpa Data Aktual Lengkap**: Mengonfirmasi bahwa AI dapat membantu memberikan rekomendasi langsung menggunakan data estimasi awal dari profil (`financial_profiles`) tanpa harus menunggu transaksi dicatat secara lengkap, sehingga pengguna langsung mendapatkan manfaat mentoring sejak hari pertama.

## 2. Dampak Perubahan

Perubahan akan dilakukan secara bertahap pada file berikut:
* **Front-end Tab Keuangan**: [finance-tab.tsx](file:///c:/Users/ZHULL/Documents/MentLife%20Project/src/app/dashboard/finance-tab.tsx)
  * Menghapus state input NLP (`nlpInput`, `nlpLoading`, `nlpMsg`).
  * Menghapus fungsi handler pengiriman NLP (`handleNlpSubmit`).
  * Menghapus render komponen Info Banner.
  * Menghapus render komponen AI Ledger Input Bar.

## 3. Langkah-Langkah Eksekusi

1. **Pembersihan Kode di `finance-tab.tsx`**:
   * Hapus deklarasi state NLP di baris 81-84.
   * Hapus fungsi pembantu `handleNlpSubmit` di baris 148-282.
   * Hapus komponen visual `INFO BANNER` pada bagian JSX render.
   * Hapus komponen visual `NLP LEDGER INPUT BAR` pada bagian JSX render.
2. **Validasi Tipe Data & Kompilasi**:
   * Jalankan pemeriksa tipe TypeScript `npx tsc --noEmit` untuk memastikan tidak ada pemanggilan fungsi atau state yang patah.

## 4. Rencana Verifikasi

1. **Uji Kompilasi**: Jalankan `npx tsc --noEmit` untuk memastikan kode terbebas dari kesalahan tipe data.
2. **Pengecekan Visual**: Memastikan tampilan dasbor keuangan kini terlihat lebih bersih, menyisakan alert survival (jika aktif) dan visualisasi instrumen keuangan utama beserta riwayat transaksi.
