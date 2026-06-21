"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useState, ReactNode } from "react";

type Theme = "dark" | "theme-light" | "theme-ocean" | "theme-forest" | "theme-sunset";
type Lang = "id" | "en";

interface AppContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<Lang, Record<string, string>> = {
  id: {
    // Header
    "header.stage.debt": "Tahap: Lunasi Hutang",
    "header.stage.emergency": "Tahap: Dana Darurat",
    "header.stage.invest": "Tahap: Investasi",
    "header.logout": "Keluar",
    // Nav
    "nav.home": "Beranda",
    "nav.record": "Catat",
    "nav.tasks": "Tugas",
    "nav.chat": "Tanya AI",
    // Home tab
    "home.greeting": "Selamat datang 👋",
    "home.finance": "Keuangan Bulanan",
    "home.income": "Pemasukan",
    "home.expense": "Pengeluaran",
    "home.remaining": "Sisa",
    "home.target.debt": "Target: Lunasi Hutang",
    "home.target.emergency": "Target: Dana Darurat",
    "home.collected": "Terkumpul",
    "home.target": "Target",
    "home.achieved": "% Tercapai",
    "home.aiadvice": "Saran dari AI Mentor",
    "home.sidehustle": "Peluang Penghasilan Tambahan",
    "home.debt.tip": "Sisihkan",
    "home.debt.tip2": "/bln untuk melunasi hutang lebih cepat.",
    "home.emergency.tip": "Dana darurat ideal = 6× pengeluaran tetap. Catat tabungan di menu",
    // Record tab
    "record.title": "Catat Transaksi",
    "record.subtitle": "Rekam pemasukan atau pengeluaran harian Anda",
    "record.type": "Jenis Transaksi",
    "record.expense": "Pengeluaran",
    "record.income": "Pemasukan",
    "record.category": "Kategori",
    "record.pick": "-- Pilih Kategori --",
    "record.amount": "Jumlah (Rp)",
    "record.note": "Keterangan (opsional)",
    "record.save": "Simpan Transaksi",
    "record.saving": "Menyimpan...",
    "record.history": "Riwayat Transaksi",
    "record.empty": "Belum ada transaksi dicatat.",
    "record.cat.expense": "Makan & Minum,Transportasi,Tagihan,Belanja,Hiburan,Kesehatan,Cicilan Hutang,Lainnya",
    "record.cat.income": "Gaji,Freelance,Tabungan,Bisnis,Bonus,Investasi,Lainnya",
    // Tasks tab
    "tasks.title": "Daftar Tugas",
    "tasks.subtitle": "Kelola rencana harian Anda",
    "tasks.add": "+ Tambah",
    "tasks.placeholder": "Nama tugas...",
    "tasks.addBtn": "Tambahkan",
    "tasks.empty.title": "Belum ada tugas",
    "tasks.empty.sub": 'Klik "+ Tambah" untuk membuat tugas pertama',
    // Chat tab
    "chat.title": "Tanya AI Mentor",
    "chat.subtitle": "Konsultasikan masalah keuangan atau karir Anda",
    "chat.greeting": "Halo! Saya AI Mentor Anda",
    "chat.greeting.sub": "Tanyakan apa saja soal keuangan atau karir. Saya siap membantu!",
    "chat.q1": "Bagaimana cara cepat lunasi hutang?",
    "chat.q2": "Tips menabung dengan gaji UMR",
    "chat.q3": "Cara memulai side hustle",
    "chat.typing": "AI Mentor sedang mengetik...",
    "chat.placeholder": "Ketik pertanyaan Anda...",
    // Settings
    "settings.title": "Pengaturan",
    "settings.theme": "Tema Tampilan",
    "settings.lang": "Bahasa",
    "settings.theme.dark": "🌑 Gelap (Default)",
    "settings.theme.light": "☀️ Terang",
    "settings.theme.ocean": "🌊 Ocean Blue",
    "settings.theme.forest": "🌿 Forest Green",
    "settings.theme.sunset": "🌅 Sunset Orange",
    "settings.lang.id": "🇮🇩 Indonesia",
    "settings.lang.en": "🇬🇧 English",
    // Finance Dashboard
    "finance.summary": "Ringkasan",
    "finance.analytics": "Analitik",
    "finance.history": "Riwayat",
    "finance.sisaKas": "Sisa Kas",
    "finance.danaDarurat": "Dana Darurat",
    "finance.utangAktif": "Utang Aktif",
    "finance.investasi": "Investasi",
    "finance.levelTangga": "Level Tangga",
    "finance.terkunci": "TERKUNCI",
    "finance.pemasukan": "+ Pemasukan",
    "finance.pengeluaran": "- Pengeluaran",
    "finance.alokasi": "⇄ Alokasi",
    "finance.anggaranBulanan": "Anggaran Bulanan",
    "finance.anggaranSub": "Disiplin alokasi bulanan Anda",
    "finance.danaGoal": "Dana Goal Masa Depan",
    "finance.danaGoalSub": "Tujuan besar yang dipantau AI",
    "finance.tambahAnggaran": "+ Tambah Anggaran",
    "finance.tambahGoal": "+ Tambah Goal",
    "finance.berulang": "Berulang",
    "finance.tidakBerulang": "Satu Kali",
    "finance.aiReview": "Evaluasi CFO AI",
    "finance.targetWaktu": "Target Waktu",
    "finance.sisa": "Sisa",
    "finance.terpakai": "Terpakai",
    "finance.simpan": "Simpan",
    "finance.batal": "Batal",
  },
  en: {
    "header.stage.debt": "Stage: Pay Off Debt",
    "header.stage.emergency": "Stage: Emergency Fund",
    "header.stage.invest": "Stage: Investing",
    "header.logout": "Logout",
    "nav.home": "Home",
    "nav.record": "Record",
    "nav.tasks": "Tasks",
    "nav.chat": "Ask AI",
    "home.greeting": "Welcome 👋",
    "home.finance": "Monthly Finance",
    "home.income": "Income",
    "home.expense": "Expenses",
    "home.remaining": "Remaining",
    "home.target.debt": "Goal: Pay Off Debt",
    "home.target.emergency": "Goal: Emergency Fund",
    "home.collected": "Saved",
    "home.target": "Target",
    "home.achieved": "% Achieved",
    "home.aiadvice": "AI Mentor Advice",
    "home.sidehustle": "Extra Income Opportunities",
    "home.debt.tip": "Set aside",
    "home.debt.tip2": "/mo to pay off debt faster.",
    "home.emergency.tip": "Ideal emergency fund = 6× fixed expenses. Record savings in",
    "record.title": "Record Transaction",
    "record.subtitle": "Log your daily income or expenses",
    "record.type": "Transaction Type",
    "record.expense": "Expense",
    "record.income": "Income",
    "record.category": "Category",
    "record.pick": "-- Select Category --",
    "record.amount": "Amount (Rp)",
    "record.note": "Note (optional)",
    "record.save": "Save Transaction",
    "record.saving": "Saving...",
    "record.history": "Transaction History",
    "record.empty": "No transactions recorded yet.",
    "record.cat.expense": "Food & Drinks,Transportation,Bills,Shopping,Entertainment,Healthcare,Debt Payment,Other",
    "record.cat.income": "Salary,Freelance,Savings,Business,Bonus,Investment,Other",
    "tasks.title": "Task List",
    "tasks.subtitle": "Manage your daily plans",
    "tasks.add": "+ Add",
    "tasks.placeholder": "Task name...",
    "tasks.addBtn": "Add Task",
    "tasks.empty.title": "No tasks yet",
    "tasks.empty.sub": 'Click "+ Add" to create your first task',
    "chat.title": "Ask AI Mentor",
    "chat.subtitle": "Consult on your financial or career questions",
    "chat.greeting": "Hello! I'm your AI Mentor",
    "chat.greeting.sub": "Ask me anything about finance or career. I'm here to help!",
    "chat.q1": "How to pay off debt quickly?",
    "chat.q2": "Saving tips on minimum wage",
    "chat.q3": "How to start a side hustle",
    "chat.typing": "AI Mentor is typing...",
    "chat.placeholder": "Type your question...",
    "settings.title": "Settings",
    "settings.theme": "Display Theme",
    "settings.lang": "Language",
    "settings.theme.dark": "🌑 Dark (Default)",
    "settings.theme.light": "☀️ Light",
    "settings.theme.ocean": "🌊 Ocean Blue",
    "settings.theme.forest": "🌿 Forest Green",
    "settings.theme.sunset": "🌅 Sunset Orange",
    "settings.lang.id": "🇮🇩 Indonesian",
    "settings.lang.en": "🇬🇧 English",
    // Finance Dashboard
    "finance.summary": "Summary",
    "finance.analytics": "Analytics",
    "finance.history": "History",
    "finance.sisaKas": "Remaining Cash",
    "finance.danaDarurat": "Emergency Fund",
    "finance.utangAktif": "Active Debt",
    "finance.investasi": "Investment",
    "finance.levelTangga": "Ladder Level",
    "finance.terkunci": "LOCKED",
    "finance.pemasukan": "+ Income",
    "finance.pengeluaran": "- Expense",
    "finance.alokasi": "⇄ Allocate",
    "finance.anggaranBulanan": "Monthly Budgets",
    "finance.anggaranSub": "Your monthly allocation discipline",
    "finance.danaGoal": "Future Financial Goals",
    "finance.danaGoalSub": "Major targets monitored by AI",
    "finance.tambahAnggaran": "+ Add Budget",
    "finance.tambahGoal": "+ Add Goal",
    "finance.berulang": "Recurring",
    "finance.tidakBerulang": "One-time",
    "finance.aiReview": "CFO AI Evaluation",
    "finance.targetWaktu": "Target Date",
    "finance.sisa": "Remaining",
    "finance.terpakai": "Spent",
    "finance.simpan": "Save",
    "finance.batal": "Cancel",
  },
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("mentlife-theme") as Theme) || "dark";
    const savedLang = (localStorage.getItem("mentlife-lang") as Lang) || "id";
    setThemeState(savedTheme);
    setLangState(savedLang);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (t: Theme) => {
    const html = document.documentElement;
    // Remove all theme classes
    html.classList.remove("dark", "theme-light", "theme-ocean", "theme-forest", "theme-sunset");
    html.classList.add(t);
  };

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("mentlife-theme", t);
    applyTheme(t);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("mentlife-lang", l);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[lang][key] ?? translations["id"][key] ?? key;
  }, [lang]);

  const value = useMemo(() => ({ theme, setTheme, lang, setLang, t }), [theme, setTheme, lang, setLang, t]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
