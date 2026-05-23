"use client";

import { useState, useTransition } from "react";
import { 
  Plus, Minus, ArrowLeftRight, Lock, 
  TrendingUp, TrendingDown, RefreshCw, X, ShieldAlert,
  Wallet, ShieldCheck, CreditCard, BarChart4
} from "lucide-react";
import { getCurrencyConfig } from "@/services/financial-ladder";
import { useApp } from "@/context/app-context";
import { cn } from "@/lib/utils";

// Translator sederhana sesuai dengan preferensi bahasa Mentlife
const DICT = {
  id: {
    sisaKas: "Sisa Kas Operasional",
    sisaKasSub: "Uang siap pakai untuk kebutuhan harian",
    danaDarurat: "Dana Darurat",
    danaDaruratSub: "Bantalan aman jika terjadi musibah",
    utangAktif: "Kewajiban / Utang Aktif",
    utangSub: "Total utang konsumtif tersisa",
    investasi: "Portofolio Investasi",
    investasiSub: "Aset produktif untuk pertumbuhan kekayaan",
    terkunci: "Terkunci (Survival Mode)",
    terkunciSub: "Selesaikan Tangga 1 & 2 terlebih dahulu",
    pemasukan: "Pemasukan",
    pengeluaran: "Pengeluaran",
    alokasi: "Alokasi",
    pemasukanAksen: "+ Pemasukan",
    pengeluaranAksen: "- Pengeluaran",
    alokasiAksen: "⇄ Alokasi",
    pemasukanDesc: "Catat uang masuk ke dompet harian Anda",
    pengeluaranDesc: "Catat pengeluaran yang memotong kas operasional",
    alokasiDesc: "Pindahkan uang dari kas harian ke pos dana khusus",
    simpan: "Simpan Transaksi",
    deskripsi: "Keterangan / Deskripsi",
    nominal: "Jumlah Nominal (Rp)",
    kategori: "Pilih Kategori",
    riwayat: "Riwayat Transaksi Cerdas",
    noTransactions: "Belum ada transaksi tercatat.",
    target: "Target",
    sisaUtang: "Sisa Utang",
    lunas: "Terbayar",
    kembali: "Batal",
    placeholderKeterangan: "Contoh: Gaji bulanan, makan siang, cicilan...",
    keDanaDarurat: "Dana Darurat",
    keBayarUtang: "Bayar Utang",
    keInvestasi: "Investasi",
    alokasiKe: "Alokasi ke",
    gaji: "Gaji",
    bisnis: "Bisnis",
    lainnya: "Lainnya",
    kebutuhanWajib: "Kebutuhan Wajib",
    keinginan: "Keinginan",
  },
  en: {
    sisaKas: "Operational Cash Balance",
    sisaKasSub: "Ready-to-use cash for daily needs",
    danaDarurat: "Emergency Fund",
    danaDaruratSub: "Safety cushion for unexpected events",
    utangAktif: "Liabilities / Active Debt",
    utangSub: "Total remaining consumer debt",
    investasi: "Investment Portfolio",
    investasiSub: "Productive assets for wealth growth",
    terkunci: "Locked (Survival Mode)",
    terkunciSub: "Complete Step 1 & 2 first",
    pemasukan: "Income",
    pengeluaran: "Expense",
    alokasi: "Allocation",
    pemasukanAksen: "+ Income",
    pengeluaranAksen: "- Expense",
    alokasiAksen: "⇄ Allocation",
    pemasukanDesc: "Record money entering your daily wallet",
    pengeluaranDesc: "Record expenses cutting from operational cash",
    alokasiDesc: "Move money from daily cash to specific budget buckets",
    simpan: "Save Transaction",
    deskripsi: "Description",
    nominal: "Amount (Rp)",
    kategori: "Select Category",
    riwayat: "Smart Transaction History",
    noTransactions: "No transactions recorded yet.",
    target: "Target",
    sisaUtang: "Remaining Debt",
    lunas: "Paid",
    kembali: "Cancel",
    placeholderKeterangan: "e.g. Monthly salary, lunch, debt payment...",
    keDanaDarurat: "Emergency Fund",
    keBayarUtang: "Pay Debt",
    keInvestasi: "Investment",
    alokasiKe: "Allocation to",
    gaji: "Salary",
    bisnis: "Business",
    lainnya: "Others",
    kebutuhanWajib: "Needs",
    keinginan: "Wants",
  }
};

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE" | "ALLOCATION";
  amount: number;
  category: string;
  description: string;
  created_at: string;
}

interface FinanceDashboardProps {
  transactions: Transaction[];
  financeData: {
    liquid_savings: number;
    emergency_fund_current: number;
    emergency_fund_target: number;
    total_debt: number;
    investment_value: number;
  };
  ladderLevel: number;
  countryCode: string;
  onAddTransaction: (
    type: "INCOME" | "EXPENSE" | "ALLOCATION",
    category: any,
    amount: number,
    description: string
  ) => Promise<{ success: boolean; message: string }>;
}

export default function FinanceDashboard({
  transactions = [],
  financeData,
  ladderLevel,
  countryCode = "ID",
  onAddTransaction
}: FinanceDashboardProps) {
  const { lang = "id" } = useApp();
  const t = DICT[lang === "id" ? "id" : "en"];
  const [isPending, startTransition] = useTransition();

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "Gaji": return t.gaji;
      case "Bisnis": return t.bisnis;
      case "Lainnya": return t.lainnya;
      case "Kebutuhan Wajib": return t.kebutuhanWajib;
      case "Keinginan": return t.keinginan;
      case "Dana Darurat": return t.keDanaDarurat;
      case "Bayar Utang": return t.keBayarUtang;
      case "Investasi": return t.keInvestasi;
      default: return cat;
    }
  };

  const typeLabels: Record<"INCOME" | "EXPENSE" | "ALLOCATION", string> = {
    INCOME: t.pemasukan,
    EXPENSE: t.pengeluaran,
    ALLOCATION: t.alokasi
  };

  // Modal & Form States
  const [activeModal, setActiveModal] = useState<"INCOME" | "EXPENSE" | "ALLOCATION" | null>(null);
  const [amountStr, setAmountStr] = useState("");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currConf = getCurrencyConfig(countryCode);
  const fmt = (val: number) => {
    return `${currConf.symbol} ${Math.abs(val).toLocaleString(currConf.locale)}`;
  };

  // Hitung progress utang dinamis
  const totalPaidDebt = transactions
    .filter(tx => tx.type === "ALLOCATION" && tx.category === "Bayar Utang")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const currentDebt = financeData.total_debt;
  const originalDebt = currentDebt + totalPaidDebt;
  const debtProgressPct = originalDebt > 0 ? Math.min(Math.round((totalPaidDebt / originalDebt) * 100), 100) : 0;

  // Dana Darurat Progress
  const efPct = financeData.emergency_fund_target > 0 
    ? Math.min(Math.round((financeData.emergency_fund_current / financeData.emergency_fund_target) * 100), 100) 
    : 0;

  // Cek apakah investasi terkunci (Survival Mode: Level 0, 1, 2 terkunci)
  const isInvestmentLocked = ladderLevel < 3;

  // Formatter input angka saat diketik
  const handleAmountChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) {
      setAmountStr("");
      return;
    }
    const num = parseInt(clean, 10);
    setAmountStr(num.toLocaleString(currConf.locale));
  };

  const handleOpenModal = (mode: "INCOME" | "EXPENSE" | "ALLOCATION") => {
    setActiveModal(mode);
    setAmountStr("");
    setDescription("");
    setErrorMessage(null);
    // Set default category
    if (mode === "INCOME") setCategory("Gaji");
    else if (mode === "EXPENSE") setCategory("Kebutuhan Wajib");
    else if (mode === "ALLOCATION") setCategory("Dana Darurat");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const numericAmount = parseInt(amountStr.replace(/\D/g, ""), 10);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage(lang === "id" ? "Nominal harus lebih besar dari 0" : "Amount must be greater than 0");
      return;
    }

    if (!category) {
      setErrorMessage(lang === "id" ? "Kategori wajib dipilih" : "Category is required");
      return;
    }

    // Proteksi: Jika alokasi melebihi sisa kas operasional
    if ((activeModal === "EXPENSE" || activeModal === "ALLOCATION") && numericAmount > financeData.liquid_savings) {
      setErrorMessage(lang === "id" 
        ? `Saldo kas harian tidak mencukupi (${fmt(financeData.liquid_savings)})` 
        : `Insufficient operational cash balance (${fmt(financeData.liquid_savings)})`
      );
      return;
    }

    // Proteksi: Jika alokasi bayar utang padahal utang sudah 0
    if (activeModal === "ALLOCATION" && category === "Bayar Utang" && financeData.total_debt === 0) {
      setErrorMessage(lang === "id"
        ? "Anda tidak memiliki sisa utang yang perlu dibayar."
        : "You have no remaining active debt to pay."
      );
      return;
    }

    startTransition(async () => {
      try {
        const res = await onAddTransaction(activeModal!, category as any, numericAmount, description);
        if (res.success) {
          setActiveModal(null);
        } else {
          setErrorMessage(res.message);
        }
      } catch (err: any) {
        setErrorMessage(err.message || "An unexpected error occurred");
      }
    });
  };

  return (
    <div className="space-y-6 pb-6">

      {/* ── SEKSI 1: PANEL SALDO & POS ANGGARAN (THE BUCKETS) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
        
        {/* Sisa Kas Operasional */}
        <div className="relative overflow-hidden bg-card/40 backdrop-blur-md border border-border/30 rounded-3xl p-5 shadow-lg flex flex-col justify-between min-h-[140px] group transition-all duration-300 hover:border-primary/40">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-300" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wallet className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.sisaKas}</p>
              <p className="text-[9px] text-muted-foreground/80">{t.sisaKasSub}</p>
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-4 tracking-tight">
            {fmt(financeData.liquid_savings)}
          </p>
        </div>

        {/* Dana Darurat */}
        <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-3xl p-5 shadow-lg flex flex-col justify-between min-h-[140px] group transition-all duration-300 hover:border-blue-500/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.danaDarurat}</p>
                <p className="text-[9px] text-muted-foreground/80">{t.danaDaruratSub}</p>
              </div>
            </div>
            <span className="text-xs font-black text-blue-400">{efPct}%</span>
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex justify-between items-baseline">
              <p className="text-2xl font-black text-white">{fmt(financeData.emergency_fund_current)}</p>
              <p className="text-[9px] text-muted-foreground">{t.target} {fmt(financeData.emergency_fund_target)}</p>
            </div>
            <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${efPct}%` }} />
            </div>
          </div>
        </div>

        {/* Kewajiban / Utang Aktif (Kondisional) */}
        {financeData.total_debt > 0 && (
          <div className="bg-card/40 backdrop-blur-md border border-amber-500/20 rounded-3xl p-5 shadow-lg flex flex-col justify-between min-h-[140px] group transition-all duration-300 hover:border-amber-500/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <CreditCard className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.utangAktif}</p>
                  <p className="text-[9px] text-muted-foreground/80">{t.utangSub}</p>
                </div>
              </div>
              <span className="text-xs font-black text-amber-400">{debtProgressPct}% {t.lunas}</span>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex justify-between items-baseline">
                <p className="text-2xl font-black text-white">{fmt(financeData.total_debt)}</p>
                <p className="text-[9px] text-muted-foreground">{t.sisaUtang}</p>
              </div>
              <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${debtProgressPct}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Portofolio Investasi */}
        <div className={cn(
          "bg-card/40 backdrop-blur-md border rounded-3xl p-5 shadow-lg flex flex-col justify-between min-h-[140px] transition-all duration-300",
          isInvestmentLocked 
            ? "border-muted-foreground/10 opacity-70" 
            : "border-border/30 hover:border-violet-500/40"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center",
                isInvestmentLocked ? "bg-muted/20" : "bg-violet-500/20"
              )}>
                {isInvestmentLocked ? (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <BarChart4 className="w-4.5 h-4.5 text-violet-400" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.investasi}</p>
                <p className="text-[9px] text-muted-foreground/80">
                  {isInvestmentLocked ? t.terkunci : t.investasiSub}
                </p>
              </div>
            </div>
          </div>

          {isInvestmentLocked ? (
            <div className="mt-4 flex flex-col gap-1">
              <span className="text-xs font-black text-amber-500/90">{t.terkunci}</span>
              <span className="text-[9px] text-muted-foreground/90">{t.terkunciSub}</span>
            </div>
          ) : (
            <p className="text-2xl font-black text-white mt-4 tracking-tight">
              {fmt(financeData.investment_value)}
            </p>
          )}
        </div>

      </div>

      {/* ── SEKSI 2: TIGA TOMBOL AKSI UTAMA (THE ACTION ENGINE) ── */}
      <div className="px-4">
        <div className="grid grid-cols-3 gap-2">
          
          {/* [+ Pemasukan] */}
          <button 
            onClick={() => handleOpenModal("INCOME")}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/30 active:scale-95 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/20 mb-2">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-black text-emerald-500">{t.pemasukan}</span>
          </button>

          {/* [- Pengeluaran] */}
          <button 
            onClick={() => handleOpenModal("EXPENSE")}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/15 hover:border-rose-500/30 active:scale-95 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center shadow-md shadow-rose-500/20 mb-2">
              <Minus className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-black text-rose-500">{t.pengeluaran}</span>
          </button>

          {/* [⇄ Alokasi] */}
          <button 
            onClick={() => handleOpenModal("ALLOCATION")}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/15 hover:border-violet-500/30 active:scale-95 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center shadow-md shadow-violet-500/20 mb-2">
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-black text-violet-400">{t.alokasi}</span>
          </button>

        </div>
      </div>

      {/* ── SEKSI 3: RIWAYAT TRANSAKSI CERDAS (SMART HISTORY) ── */}
      <div className="px-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 px-1">
          {t.riwayat}
        </p>

        {transactions.length === 0 ? (
          <div className="bg-card/20 border border-border/10 rounded-2xl p-6 text-center text-xs text-muted-foreground">
            {t.noTransactions}
          </div>
        ) : (
          <div className="bg-card/30 backdrop-blur-md border border-border/20 rounded-2xl overflow-hidden divide-y divide-border/10">
            {transactions.slice(0, 15).map((tx) => {
              const isIncome = tx.type === "INCOME";
              const isExpense = tx.type === "EXPENSE";
              const isAllocation = tx.type === "ALLOCATION";

              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5 transition-all hover:bg-muted/10">
                  
                  {/* Indicator Icon */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    isIncome && "bg-emerald-500/10 text-emerald-500",
                    isExpense && "bg-rose-500/10 text-rose-500",
                    isAllocation && "bg-violet-500/10 text-violet-400"
                  )}>
                    {isIncome && <TrendingUp className="w-4.5 h-4.5" />}
                    {isExpense && <TrendingDown className="w-4.5 h-4.5" />}
                    {isAllocation && <ArrowLeftRight className="w-4.5 h-4.5" />}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-foreground">
                        {isAllocation ? `${t.alokasiKe} ${getCategoryLabel(tx.category)}` : getCategoryLabel(tx.category)}
                      </p>
                      <span className={cn(
                        "text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider",
                        isIncome && "bg-emerald-500/15 text-emerald-400",
                        isExpense && "bg-rose-500/15 text-rose-400",
                        isAllocation && "bg-violet-500/15 text-violet-400"
                      )}>
                        {typeLabels[tx.type]}
                      </span>
                    </div>
                    {tx.description && (
                      <p className="text-[10px] text-muted-foreground/90 mt-0.5 truncate">{tx.description}</p>
                    )}
                    <p className="text-[8px] text-muted-foreground/60 mt-0.5">
                      {new Date(tx.created_at || Date.now()).toLocaleDateString(currConf.locale, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>

                  {/* Nominal */}
                  <p className={cn(
                    "text-xs font-black shrink-0 tracking-tight",
                    isIncome && "text-emerald-400",
                    isExpense && "text-rose-400",
                    isAllocation && "text-violet-400"
                  )}>
                    {isIncome ? "+" : isExpense ? "-" : "⇄"}{fmt(tx.amount)}
                  </p>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL DIALOG PENCATATAN TRANSAKSI ── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          
          {/* Overlay Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isPending && setActiveModal(null)}
          />

          {/* Modal Content Box */}
          <div className="relative w-full max-w-md bg-zinc-950 border border-border/40 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col space-y-4 animate-in slide-in-from-bottom duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className={cn(
                  "text-lg font-black tracking-tight",
                  activeModal === "INCOME" && "text-emerald-500",
                  activeModal === "EXPENSE" && "text-rose-500",
                  activeModal === "ALLOCATION" && "text-violet-400"
                )}>
                  {activeModal === "INCOME" && t.pemasukanAksen}
                  {activeModal === "EXPENSE" && t.pengeluaranAksen}
                  {activeModal === "ALLOCATION" && t.alokasiAksen}
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  {activeModal === "INCOME" && t.pemasukanDesc}
                  {activeModal === "EXPENSE" && t.pengeluaranDesc}
                  {activeModal === "ALLOCATION" && t.alokasiDesc}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => !isPending && setActiveModal(null)}
                className="w-8 h-8 rounded-xl bg-card border border-border/20 flex items-center justify-center hover:bg-muted/10 active:scale-90 transition-all"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-bold px-3 py-2.5 rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Nominal Input */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-1.5 uppercase tracking-wider">
                  {t.nominal}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground">
                    {currConf.symbol}
                  </span>
                  <input 
                    type="text" 
                    value={amountStr} 
                    onChange={(e) => handleAmountChange(e.target.value)} 
                    placeholder="0" 
                    required
                    disabled={isPending}
                    className="w-full h-14 pl-12 pr-4 rounded-2xl border border-border/30 bg-background text-2xl font-black text-white focus:outline-none focus:border-primary transition-all" 
                  />
                </div>
              </div>

              {/* Category selector */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-1.5 uppercase tracking-wider">
                  {t.kategori}
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeModal === "INCOME" && (
                    ["Gaji", "Bisnis", "Lainnya"].map((catName) => (
                      <button 
                        key={catName}
                        type="button"
                        onClick={() => setCategory(catName)}
                        className={cn(
                          "text-xs px-3.5 py-2 rounded-xl font-bold border transition-all",
                          category === catName 
                            ? "bg-emerald-500 text-white border-transparent shadow-md shadow-emerald-500/10" 
                            : "border-border/30 text-muted-foreground hover:bg-muted/10"
                        )}
                      >
                        {getCategoryLabel(catName)}
                      </button>
                    ))
                  )}

                  {activeModal === "EXPENSE" && (
                    ["Kebutuhan Wajib", "Keinginan"].map((catName) => (
                      <button 
                        key={catName}
                        type="button"
                        onClick={() => setCategory(catName)}
                        className={cn(
                          "text-xs px-3.5 py-2 rounded-xl font-bold border transition-all",
                          category === catName 
                            ? "bg-rose-500 text-white border-transparent shadow-md shadow-rose-500/10" 
                            : "border-border/30 text-muted-foreground hover:bg-muted/10"
                        )}
                      >
                        {getCategoryLabel(catName)}
                      </button>
                    ))
                  )}

                  {activeModal === "ALLOCATION" && (
                    ["Dana Darurat", "Bayar Utang", "Investasi"].map((catName) => {
                      // Blokir alokasi ke investasi jika terkunci
                      const isOptionBlocked = catName === "Investasi" && isInvestmentLocked;

                      return (
                        <button 
                          key={catName}
                          type="button"
                          disabled={isOptionBlocked}
                          onClick={() => setCategory(catName)}
                          className={cn(
                            "text-xs px-3.5 py-2 rounded-xl font-bold border transition-all flex items-center gap-1",
                            category === catName 
                              ? "bg-violet-500 text-white border-transparent shadow-md shadow-violet-500/10" 
                              : "border-border/30 text-muted-foreground hover:bg-muted/10",
                            isOptionBlocked && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          {isOptionBlocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                          {getCategoryLabel(catName)}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Description Input */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-1.5 uppercase tracking-wider">
                  {t.deskripsi}
                </label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder={t.placeholderKeterangan}
                  disabled={isPending}
                  className="w-full h-11 px-4 rounded-xl border border-border/30 bg-background text-sm text-white focus:outline-none focus:border-primary transition-all" 
                />
              </div>

              {/* Action buttons inside form */}
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  disabled={isPending}
                  onClick={() => setActiveModal(null)}
                  className="flex-1 h-12 rounded-xl border border-border/30 font-bold text-xs text-muted-foreground hover:bg-muted/10 active:scale-95 transition-all"
                >
                  {t.kembali}
                </button>
                <button 
                  type="submit"
                  disabled={isPending}
                  className={cn(
                    "flex-2 h-12 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50",
                    activeModal === "INCOME" && "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/10",
                    activeModal === "EXPENSE" && "bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/10",
                    activeModal === "ALLOCATION" && "bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/10"
                  )}
                >
                  {isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    activeModal === "INCOME" ? <Plus className="w-4 h-4" /> : activeModal === "EXPENSE" ? <Minus className="w-4 h-4" /> : <ArrowLeftRight className="w-4 h-4" />
                  )}
                  {t.simpan}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
