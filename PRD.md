

## PRODUCT REQUIREMENTS
## DOCUMENT (PRD)
MENTLIFE — AI-Native Executive Wealth & Career Mentor
Nama ProyekMentlife
Versi Dokumenv1.0 (Final Master)
## Tanggal Pembuatan30 Mei 2026
Penulis / Arsitek UtamaSulhan Fajar (Zhul) & AI Development Team
Target Agen AICursor / Windsurf / GitHub Copilot (Vibe Coding Framework)
Sifat DokumenSangat Rahasia / Kekayaan Intelektual Internal

## 1. Filosofi Produk & Visi Utama
Mentlife  adalah  sebuah  ekosistem  asisten  pribadi  penasihat  kekayaan  (Wealth Manager)  dan
konsultan karir digital yang dirancang khusus untuk para entrepreneur, profesional aktif, dan individu
yang berorientasi pada pertumbuhan (growth-minded). Aplikasi ini melangkah jauh melampaui aplikasi
pencatatan keuangan (expense tracker) konvensional dengan mengadopsi peran sebagai instrumen
taktis yang aktif mengarahkan, mendisiplinkan, dan mendorong eksekusi di dunia nyata.
## Prinsip Arsitektur Utama:
Tough-Love AI Philosophy: Agen AI memposisikan diri sebagai Chief Operating Officer (COO)
atau Chief Financial Officer (CFO) pribadi yang bersikap dingin, tegas, objektif, tanpa basa-basi
(no-nonsense), namun memiliki pemahaman kontekstual yang mendalam terhadap kondisi
pengguna.
Progressive Disclosure & Gamification: Membatasi akses fitur tingkat lanjut secara ketat.
Sebagai contoh, fitur investasi akan sepenuhnya dikunci (lock) sebelum pengguna berhasil
menyelesaikan krisis fundamental di bawahnya seperti utang berbunga tinggi atau defisit arus kas.
Continuous Profiling (Invisible Memory): Data pengguna tidak bersifat statis. Form onboarding di
awal pendaftaran hanyalah baseline sementara; perkembangan profil di-update secara aktif melalui
transaksi harian serta di-update secara pasif melalui ekstraksi obrolan kontekstual menggunakan
mekanisme Function Calling.
## 2. Spesifikasi Teknologi & Internasionalisasi
Aplikasi   dikembangkan   menggunakan   infrastruktur   modern   berskala   global   untuk   memastikan
kecepatan eksekusi tinggi dan kemudahan pemeliharaan kode (maintainability) oleh AI Agent.
Komponen StackTeknologi & Aturan Implementasi
Frontend FrameworkNext.js (App Router), React, Tailwind CSS. Menggunakan arsitektur
berbasis komponen modular yang bersih.
Backend & DatabaseSupabase (PostgreSQL) dengan optimasi Row Level Security (RLS) serta
pemanfaatan tipe data JSONB murni untuk fleksibilitas penyimpanan
memori AI.
Integrasi APIGoogle Calendar API (OAuth 2.0 via Google Cloud Console) untuk
otomasi penjadwalan dan timeboxing.
## •
## •
## •
Mentlife Master PRD v1.0 — RahasiaHalaman 2 dari 11

Komponen StackTeknologi & Aturan Implementasi
## Internasionalisasi (i18n)
Menggunakan library next-intl. Seluruh teks statis di UI dilarang keras
di-hardcode. Semua teks wajib merujuk pada file dictionary lokal
(id.json dan en.json).
## Design System
Tema premium Dark Mode (Warna dasar bg-slate-950 atau hitam
murni). Komponen visual berbasis glassmorphism, border tipis, dan
## Interactive Chips.
- Logika Utama: 6 Tangga Finansial (The Baby
## Steps)
Sistem secara mutlak mengklasifikasikan kondisi finansial pengguna ke dalam salah satu dari enam
tingkatan berikut berdasarkan kalkulasi angka absolut murni dari database, bukan dari asumsi atau
penilaian subjektif pengguna:
Tangga 1: Mode Survival (Bebas Utang Konsumtif) Kritis
Fokus penuh pada pemangkasan biaya variabel, perbaikan arus kas bulanan, dan penghancuran
utang berbunga tinggi (Pinjol, Paylater, Kartu Kredit) secara agresif menggunakan metode Debt
## Snowball.
Tangga 2: Dana Darurat (Emergency Fund)
Fokus pada akumulasi dan pengamanan dana tunai likuid yang disimpan pada pos terpisah
sebesar 3x hingga 6x dari total pengeluaran wajib bulanan.
## Tangga 3: Investasi Konsisten (20% Rule)
Mulai membangun kekayaan masa depan dengan mengalokasikan minimal 20% dari pendapatan
bersih bulanan ke instrumen pasar modal atau aset produktif.
## Tangga 4: Dana Tujuan Hidup Besar
Akumulasi modal secara terarah untuk keperluan ekspansi bisnis, modal usaha struktural,
pernikahan, atau aset fisik utama.
## Tangga 5: Bebas Utang Jangka Panjang
Proses akselerasi pelunasan kewajiban jangka panjang jangka panjang seperti KPR properti atau
utang permodalan usaha struktural.
Tangga 6: Kebebasan Finansial (Financial Freedom) Ideal
Fase puncak di mana seluruh pengeluaran gaya hidup pengguna ditopang sepenuhnya oleh imbal
hasil portofolio investasi secara pasif menggunakan aturan baku The 4% Rule.
## 1.
## 2.
## 3.
## 4.
## 5.
## 6.
Mentlife Master PRD v1.0 — RahasiaHalaman 3 dari 11

Aturan Penguncian Sistem (System Lockout Rule):
Jika sistem mendeteksi pengguna memiliki utang berbunga tinggi (Tangga 1) atau dana darurat
belum terpenuhi (Tangga 2), maka Modul Portofolio Investasi di UI harus otomatis dikunci, diberi
efek blur, dan menampilkan pesan penegasan disiplin.
Mentlife Master PRD v1.0 — RahasiaHalaman 4 dari 11

## 4. Spesifikasi Detail Modul Aplikasi (8 Pilar Utama)
## Module A: Profiling Engine & Onboarding
Sistem   pengumpulan   data   komprehensif   di   awal   menggunakan   pendekatan   hibrida   yang
menyeimbangkan kenyamanan pengguna (UX) dan kekayaan data untuk model AI.
Mekanisme Input: Menggunakan deretan Interactive Chips untuk pilihan umum populer, dilengkapi
tombol kustom [+] Add custom..., dan ditutup dengan sebuah Text Area (Ruang Cerita) di
akhir setiap kategori untuk memberikan konteks personal yang bebas.
## Kategori Data:
Tab Pribadi: Demografi, Domisili, Beban Tanggungan (Sandwich Gen), Aset Utama, dan Target
## Hidup.
Tab Karir (Ikigai): Latar Belakang Pendidikan, Status Profesi Saat Ini, Hard Skills, Soft Skills,
Hobi, dan Topik Minat (Interests).
Tab Keuangan: Rentang Pendapatan, Estimasi Pengeluaran, Jaring Pengaman Likuid, dan
## Profil Risiko Finansial.
Variabel Prioritas AI: Jika terjadi anomali antara data formal (misal: kuliah Agribisnis) dengan
narasi cerita (misal: merintis startup properti kos RuangSinggah), AI backend wajib memprioritaskan
data narasi sebagai poros utama rekomendasi strategi karir.
Module B: Beranda (Command Center)
Pusat kendali utama pengguna yang menyajikan visualisasi agregat dari kondisi keuangan riil dan
penugasan aktif.
Financial Pulse: Menampilkan indikator angka real-time untuk Runway (Total Tabungan Likuid /
Pengeluaran Wajib Bulanan) dalam satuan bulan, status stabilitas Cashflow, dan analisis teks
ringkas otomatis.
Alert Banner: Banner dinamis di bagian paling atas layar yang berubah warna dan teks secara
radikal menyesuaikan status darurat pengguna (Contoh: "⚠️ MODE SURVIVAL AKTIF — Runway
0.0 Bulan. Fokus absolut pada pengetatan biaya").
Roadmap Tracker: Visualisasi linier dari 6 Tangga Keuangan (Tangga aktif menyala terang, tangga
berikutnya redup/terkunci).
Misi Prioritas (AI-Curated Quests):** Menampilkan maksimal 3 rekomendasi tindakan taktis
jangka pendek hasil kurasi AI yang disesuaikan dengan posisi tangga pengguna.
## •
## •
## ◦
## ◦
## ◦
## •
## •
## •
## •
## •
Mentlife Master PRD v1.0 — RahasiaHalaman 5 dari 11

Module C: Finance Ledger (Buku Besar Keuangan)
Antarmuka pencatatan keuangan taktis murni yang memisahkan pengeluaran konsumtif dengan
alokasi pengamanan aset.
Visual Buckets: Sisa Kas Operasional, Dana Darurat (statis), Sisa Utang Aktif (kondisional),
dan Portofolio Investasi (tergembok di Level 1 & 2).
Logika 3 Tombol Aksi (The 3 Action Engine):
[+ Pemasukan] (Hijau): Menambah Sisa Kas Operasional. Mendukung tagging kategori,
pencatatan berulang (recurring), dan tagar konteks (Contoh: #Bisnis, #Pribadi).
[- Pengeluaran] (Merah): Mengurangi Sisa Kas Operasional (Uang hangus
dikonsumsi). Pengguna WAJIB mengklasifikasikan transaksi ke dalam kategori
Kebutuhan Wajib (Needs) atau Keinginan (Wants).
[⇄ Alokasi] (Biru/Ungu): Memindahkan uang dari Sisa Kas menuju pos Dana Darurat,
Pelunasan Utang, atau Investasi. Transaksi ini tidak mengurangi nilai kekayaan total,
melainkan memindahkan pos aset/mengurangi kewajiban secara akuntansi akurat.
AI Friction Trigger: Jika pengguna di Tangga 1 mencoba menginput pengeluaran dengan
kategori Keinginan (Wants) yang melebihi batas psikologis sistem, aplikasi akan
memunculkan dialog peringatan tegas dari AI sebelum transaksi disimpan.
Module D: Career & Execution Engine (Ikigai & GCal Sync)
Modul yang bertugas mengonversi rekomendasi strategis AI menjadi tindakan terjadwal yang
nyata di dunia nyata.
Ikigai Matcher: Menampilkan kartu rekomendasi peluang kerja lepas (side hustle) atau bisnis
hasil kurasi AI yang mencocokkan keterampilan pengguna dengan kebutuhan pasar, lengkap
dengan persentase kecocokan (Contoh: "Ikigai Match: 85%" - Potensi Income: Rp 1.5M - Rp
3.5M/bln).
Approval-Based Task Management: Rekomendasi misi (Quest) dari AI berstatus awal
sebagai Draft/Recommended. Tugas baru akan pindah ke daftar To-Do List utama berstatus
Active hanya jika pengguna menekan tombol "Ambil Misi" secara sadar.
User-Generated Tasks: Pengguna memiliki hak penuh untuk menambahkan daftar tugas
mereka secara manual ([+ Tambah Tugas]) langsung ke dalam daftar aktif.
Google Calendar Sync: Seluruh tugas aktif (baik dari AI maupun Manual) memiliki tombol
[Sync to GCal]. Menggunakan Google Calendar API untuk menjadwalkan blok waktu
pengerjaan (timeboxing) secara otomatis berdasarkan kapasitas waktu luang pengguna,
lengkap dengan sistem alarm pengingat bawaan (reminder).
## •
## •
## 1.
## 2.
## 3.
## •
## •
## •
## •
## •
Mentlife Master PRD v1.0 — RahasiaHalaman 6 dari 11

Module E: Mentor AI Chat Interface
Saluran komunikasi langsung antara pengguna dengan mesin kecerdasan buatan Mentlife.
Context Injection: Sebelum memproses setiap baris pesan teks dari pengguna, sistem wajib
menyuntikkan data mentah terbaru dari database (Saldo kas, total utang, sisa waktu luang,
portofolio keahlian, dan level tangga finansial) ke dalam memori sesi LLM secara tidak
terlihat.
Tone of Voice: Komunikasi berjalan dengan gaya profesional, berwibawa, analitis, langsung
pada inti masalah, dan menuntut tanggung jawab eksekusi. Dilarang menggunakan bahasa
bertele-tele atau formalitas generik.
Module F: Continuous Profiling (Invisible Memory)
Infrastruktur kecerdasan buatan yang bertugas menjaga profil tetap up-to-date secara otomatis.
Function Calling Engine: Ketika pengguna melakukan percakapan di modul chat Mentor AI
dan menyebutkan fakta atau progres baru dalam hidup mereka (Contoh: *"Bisnis properti
kos saya bulan ini sukses menambah 5 mitra baru"* atau *"Saya baru saja melunasi sisa
utang paylater"*), LLM secara otomatis memicu perintah Function Call di latar belakang.
Silent Database Update: Mengubah, memperbarui, atau menambahkan data baru tersebut ke
dalam kolom berformat JSONB atau basis data vektor memori jangka panjang tanpa
memaksa pengguna melakukan pengisian ulang di form edit profil.
## Module G: Gamification, Streak Days, & Audit Reconciliation
Sistem retensi dan pembentukan kebiasaan (habit-forming) yang ketat namun aman bagi
integritas data.
Sistem Streak Harian (Daily Streak Tracker):** Penghitung streak bertambah +1 hari jika
pengguna melakukan minimal 1 input transaksi (INCOME, EXPENSE, atau ALLOCATION).
Menyediakan tombol khusus [Nihil / Gak Jajan Hari Ini] di UI Keuangan sebagai
opsi pengisian jika pengguna tidak melakukan perputaran uang, agar streak tetap terjaga.
Konsekuensi Streak Padam (The Soft-Lock Penalty):** Sistem dilarang keras menghapus
atau mereset data angka absolut keuangan pengguna. Jika pengguna melewatkan 1 hari
tanpa aktivitas pencatatan, streak kembali ke 0. Pengguna dikenakan penalti pemotongan
nilai besar (-300 XP) yang berisiko menurunkan pangkat (Executive Tier) mereka. Aplikasi
masuk ke mode SOFT-LOCK di mana akses ke modul Mentor AI (Chat), Portofolio Investasi,
dan Wishlist otomatis DIKUNCI.
## •
## •
## •
## •
## •
## •
Mentlife Master PRD v1.0 — RahasiaHalaman 7 dari 11

Mekanisme Penebusan (The Reconciliation Audit):** Untuk membuka kembali kunci aplikasi,
pengguna wajib menyelesaikan form pop-up "Audit Jurnal yang Terlewat". UI akan
menampilkan kalender interaktif yang menandai tanggal-tanggal yang bolong tanpa
transaksi. Pengguna wajib mengisi transaksi secara backdate atau memilih status Nihil pada
setiap tanggal yang terlewat tersebut hingga seluruh celah hari terisi penuh.
Module H: Wishlist & Reward Vault (Delayed Gratification)
Modul pengendali hasrat konsumsi bergaya hidup agar tetap selaras dengan kondisi finansial
riil.
Sistem Karantina (Quarantine Period): Setiap barang konsumtif baru yang dimasukkan oleh
pengguna ke dalam daftar keinginan tidak bisa langsung dibeli, melainkan wajib masuk ke
masa karantina selama 7 hari untuk menguji kestabilan psikologis pengguna (menghindari
impulsivitas/FOMO).
Strict AI Gatekeeper:
Auto-Reject: Jika pengguna di Tangga 1 atau 2 mencoba menginput barang konsumtif
mewah yang tidak logis dengan pendapatan/utang mereka, AI secara otomatis menolak
input tersebut dengan argumentasi finansial yang tajam.
Hustle Conversion: AI mengonversi nilai harga barang menjadi target usaha nyata
(Contoh: *"Untuk bisa membeli jam tangan ini seharga Rp 500.000 secara aman tanpa
merusak dana darurat, kamu harus menyelesaikan 1 proyek sampingan copywriting
ekstra minggu ini"*).
Guilt-Free Pass Approval: Jika kondisi keuangan pengguna telah surplus, dana darurat
aman, dan tingkat XP kedisiplinan tinggi, AI secara proaktif akan memberikan persetujuan
resmi (Guilt-Free Pass) bagi pengguna untuk membeli barang impian tersebut tanpa
penyesalan finansial.
## •
## •
## •
## ◦
## ◦
## •
Mentlife Master PRD v1.0 — RahasiaHalaman 8 dari 11

- Skema & Panduan Database (Supabase
## Architecture)
Setiap proses pembuatan komponen atau integrasi API baru oleh AI Agent wajib merujuk secara
ketat pada struktur relasi tabel PostgreSQL di Supabase berikut:
## -- 1. TABEL INTI PENGGUNA
CREATE TABLE users_core (
id UUID PRIMARY KEY REFERENCES auth.users(id),
full_name TEXT NOT NULL,
nickname TEXT,
birth_date DATE,
gender TEXT,
domicile TEXT,
current_xp INTEGER DEFAULT 0,
executive_tier TEXT DEFAULT 'Survivor',
locale TEXT DEFAULT 'id',
created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
## );
## -- 2. TABEL REKAM KARIR & IKIGAI
CREATE TABLE user_careers (
user_id UUID PRIMARY KEY REFERENCES users_core(id),
skills TEXT[] DEFAULT '{}',
hobbies TEXT[] DEFAULT '{}',
interests TEXT[] DEFAULT '{}',
education_history TEXT[] DEFAULT '{}',
career_story TEXT,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
## );
## -- 3. TABEL HARD DATA KEUANGAN
CREATE TABLE user_finances (
user_id UUID PRIMARY KEY REFERENCES users_core(id),
monthly_income NUMERIC(15,2) DEFAULT 0.00,
fixed_expenses NUMERIC(15,2) DEFAULT 0.00,
liquid_savings NUMERIC(15,2) DEFAULT 0.00,
total_debt NUMERIC(15,2) DEFAULT 0.00,
investment_risk_profile TEXT DEFAULT 'Moderate',
updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
## );
## -- 4. TABEL TRANSAKSI BUKU BESAR
CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE', 'ALLOCATION');
CREATE TABLE financial_transactions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES users_core(id),
Mentlife Master PRD v1.0 — RahasiaHalaman 9 dari 11

type transaction_type NOT NULL,
amount NUMERIC(15,2) NOT NULL,
category TEXT NOT NULL, -- Needs, Wants, Dana Darurat, Utang, dll
description TEXT,
tags TEXT[] DEFAULT '{}',
created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
## );
## -- 5. TABEL MANAJEMEN TUGAS & GCAL SYNC
CREATE TYPE task_source AS ENUM ('AI_CURATED', 'MANUAL');
CREATE TYPE task_status AS ENUM ('RECOMMENDED', 'ACTIVE', 'COMPLETED');
CREATE TABLE user_tasks (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES users_core(id),
source task_source NOT NULL,
status task_status DEFAULT 'RECOMMENDED',
title TEXT NOT NULL,
description TEXT,
deadline TIMESTAMP WITH TIME ZONE,
gcal_event_id TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
## );
## -- 6. TABEL BRANKAS KEINGINAN
CREATE TYPE wishlist_status AS ENUM ('QUARANTINE', 'LOCKED', 'APPROVED',
## 'PURCHASED');
CREATE TABLE user_wishlists (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES users_core(id),
item_name TEXT NOT NULL,
estimated_price NUMERIC(15,2) NOT NULL,
status wishlist_status DEFAULT 'QUARANTINE',
unlock_condition TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
## );
- Pagar Pengaman Pengembang (Development
## Guardrails)
Dokumen ini mengikat AI Agent untuk mematuhi batasan mutlak berikut selama proses
penulisan kode:
UX Simpel Di Depan: Jangan membangun form input panjang yang mengintimidasi.
Gunakan prinsip Progressive Disclosure (sembunyikan di balik toggle sampai dibutuhkan).
Mathematics over Feeling: Indikator kesehatan keuangan wajib dihitung berdasarkan
algoritma kepastian angka di database, dilarang bersumber dari estimasi subjektif
pengguna.
## •
## •
Mentlife Master PRD v1.0 — RahasiaHalaman 10 dari 11

No Dead Ends UI: Jika fitur investasi terkunci karena pengguna berada di Tangga 1,
antarmuka dilarang hanya menampilkan layar kosong. UI wajib berubah wujud menjadi
ruang edukasi atau ruang motivasi pemecahan masalah utang.
## •
Mentlife Master PRD v1.0 — RahasiaHalaman 11 dari 11