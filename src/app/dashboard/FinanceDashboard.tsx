"use client";

import { useState } from "react";
import { Plus, Wallet, PieChart, History, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, X, BrainCircuit, RefreshCw, ShieldCheck, CreditCard, BarChart4, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

// --- ANALYTICS DASHBOARD ---
const AnalyticsDashboard = ({ financeData, transactions }: any) => {
  const income = transactions.filter((t: any) => t.type === "INCOME").reduce((acc: number, t: any) => acc + t.amount, 0);
  const expense = transactions.filter((t: any) => t.type === "EXPENSE").reduce((acc: number, t: any) => acc + t.amount, 0);
  const burnRate = income > 0 ? (expense / income) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-card border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Financial Health Score</p>
        </div>
        <div className="h-3 bg-zinc-900 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${Math.min(100 - burnRate, 100)}%` }} />
        </div>
        <p className="text-[10px] text-zinc-400">
          {burnRate > 80 ? "⚠️ Burn rate tinggi. Kurangi kategori 'Wants'." : "✅ Arus kas sehat. Disiplin tetap terjaga."}
        </p>
      </div>
    </div>
  );
};

// --- MODAL TRANSAKSI (LENGKAP) ---
const TransactionModal = ({ isOpen, onClose, onAddTransaction, financeData }: any) => {
  const [step, setStep] = useState<"SELECT" | "FORM">("SELECT");
  const [type, setType] = useState<"INCOME" | "EXPENSE" | "ALLOCATION" | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Needs");
  const [desc, setDesc] = useState("");

  const handleSave = async () => {
    if (!amount) return;
    await onAddTransaction(type, category, Number(amount), desc);
    onClose();
    setStep("SELECT");
    setAmount("");
    setDesc("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 space-y-6">
        {step === "SELECT" ? (
          <div className="grid grid-cols-3 gap-3">
            {[ { id: "INCOME", label: "Masuk", icon: ArrowUpCircle }, { id: "EXPENSE", label: "Keluar", icon: ArrowDownCircle }, { id: "ALLOCATION", label: "Alokasi", icon: ArrowLeftRight } ].map((i) => (
              <button key={i.id} onClick={() => { setType(i.id as any); setStep("FORM"); }} className="p-4 bg-zinc-900 rounded-2xl flex flex-col items-center gap-2 hover:bg-zinc-800">
                <i.icon className="w-6 h-6 text-primary" />
                <span className="text-[9px] font-bold text-white">{i.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-black text-white text-sm">Input {type}</h3>
            <input type="number" className="w-full h-12 bg-zinc-900 rounded-xl px-4 text-white" placeholder="Nominal Rp" value={amount} onChange={(e) => setAmount(e.target.value)} />
            {type === "EXPENSE" && (
              <select className="w-full h-10 bg-zinc-900 rounded-xl px-4 text-white text-xs" onChange={(e) => setCategory(e.target.value)}>
                <option value="Needs">Needs (Wajib)</option>
                <option value="Wants">Wants (Keinginan)</option>
                <option value="Business">Business (Kerja)</option>
              </select>
            )}
            <button onClick={handleSave} className="w-full h-12 bg-primary rounded-xl font-bold text-white">Simpan</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function FinanceDashboard({ financeData, transactions = [], onAddTransaction }: any) {
  const [activeTab, setActiveTab] = useState<"summary" | "analytics" | "history">("summary");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Kalkulasi data riil untuk dashboard
  const efProgress = financeData?.emergency_fund_target > 0 ? ((financeData.emergency_fund_current || 0) / financeData.emergency_fund_target) * 100 : 0;
  const debtProgress = financeData?.total_debt > 0 ? (financeData.total_debt_paid / financeData.total_debt) * 100 : 100;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* HEADER NAV */}
      <div className="sticky top-0 z-30 px-4 py-3 bg-background/90 backdrop-blur border-b border-white/5">
        <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl">
          {[ { id: "summary", label: "Ringkasan", icon: Wallet }, { id: "analytics", label: "Analitik", icon: PieChart }, { id: "history", label: "Riwayat", icon: History } ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase", activeTab === tab.id ? "bg-primary text-white" : "text-zinc-500")}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6">
        {activeTab === "summary" && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {/* SISA KAS */}
            <div className="bg-zinc-900 p-6 rounded-3xl border border-white/5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase">Sisa Kas</p>
              <h2 className="text-3xl font-black mt-1 text-white">Rp{financeData?.liquid_savings?.toLocaleString()}</h2>
            </div>
            
            {/* PROGRESS CARDS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card p-4 rounded-2xl border border-white/5">
                <ShieldCheck className="w-4 h-4 text-blue-500 mb-2" />
                <p className="text-[9px] font-black text-zinc-500 uppercase">Dana Darurat</p>
                <div className="h-1 bg-zinc-800 rounded-full mt-2 mb-2"><div className="h-full bg-blue-500" style={{ width: `${efProgress}%` }} /></div>
                <p className="text-[9px] font-bold text-white">Rp{financeData?.emergency_fund_current?.toLocaleString() || 0} / Rp{financeData?.emergency_fund_target?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-card p-4 rounded-2xl border border-white/5">
                <CreditCard className="w-4 h-4 text-rose-500 mb-2" />
                <p className="text-[9px] font-black text-zinc-500 uppercase">Utang Aktif</p>
                <div className="h-1 bg-zinc-800 rounded-full mt-2 mb-2"><div className="h-full bg-rose-500" style={{ width: `${debtProgress}%` }} /></div>
                <p className="text-[9px] font-bold text-rose-400">Rp{financeData?.total_debt?.toLocaleString() || 0}</p>
              </div>
            </div>

            {/* INVESTASI & LEVEL */}
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-zinc-900 p-4 rounded-2xl border border-white/5">
                <BarChart4 className="w-4 h-4 text-violet-500 mb-2" />
                <p className="text-[9px] font-black text-zinc-500 uppercase">Investasi</p>
                <p className="text-sm font-black text-white">Rp{financeData?.investment_value?.toLocaleString()}</p>
              </div>
               <div className="bg-zinc-900 p-4 rounded-2xl border border-white/5">
                <p className="text-[9px] font-black text-zinc-500 uppercase">Level Tangga</p>
                <p className="text-sm font-black text-white">Level {financeData?.ladderLevel || 1}</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "analytics" && <AnalyticsDashboard financeData={financeData} transactions={transactions} />}
        
        {activeTab === "history" && (
          <div className="space-y-2">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex justify-between p-4 bg-card rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  {tx.type === "INCOME" ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
                  <span className="text-xs font-bold text-white">{tx.description}</span>
                </div>
                <span className="text-xs font-black text-white">Rp{tx.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-2xl flex items-center justify-center text-white z-40">
        <Plus className="w-8 h-8" />
      </button>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTransaction={onAddTransaction} financeData={financeData} />
    </div>
  );
}
