"use client";

import { useState } from "react";
import { Plus, Wallet, PieChart, History, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, X, BrainCircuit, RefreshCw, ShieldCheck, CreditCard, BarChart4, TrendingUp, TrendingDown, Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateLadderLevel, isFeatureLocked } from "@/lib/finance-logic";

// --- MODAL TRANSAKSI (AUDIT & HUSTLE ENABLED) ---
const TransactionModal = ({ isOpen, onClose, onAddTransaction, financeData, isInvestmentLocked, isSurvival, lang }: any) => {
  const [step, setStep] = useState<"SELECT" | "FORM">("SELECT");
  const [type, setType] = useState<"INCOME" | "EXPENSE" | "ALLOCATION" | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Needs");
  const [reflection, setReflection] = useState(""); // Catatan psikologis/Audit
  const [showFrictionAlert, setShowFrictionAlert] = useState(false);

  const handleSave = async (bypassFriction = false) => {
    if (!amount) return;
    
    // AI Friction Trigger: Pengeluaran Wants > Rp100.000 pada Mode Survival
    const numericAmount = Number(amount);
    const isWantsExpense = type === "EXPENSE" && category === "Wants";
    
    if (isWantsExpense && isSurvival && numericAmount >= 100000 && !bypassFriction) {
      setShowFrictionAlert(true);
      return;
    }

    // Logika Hustle Conversion: Jika Wants > 1jt, sistem memicu pengingat kerja
    const isHighValueWant = isWantsExpense && numericAmount > 1000000;
    
    await onAddTransaction(type, category, numericAmount, reflection || "Transaksi baru", isHighValueWant);
    onClose();
    setStep("SELECT");
    setAmount("");
    setReflection("");
    setCategory("Needs");
    setShowFrictionAlert(false);
  };

  const handleCancelFriction = () => {
    setShowFrictionAlert(false);
    onClose();
    setStep("SELECT");
    setAmount("");
    setReflection("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      {showFrictionAlert ? (
        <div className="relative w-full max-w-md bg-zinc-950 border border-rose-500/20 rounded-3xl p-6 space-y-6 z-10 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 text-rose-500">
            <BrainCircuit className="w-8 h-8 animate-pulse" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest">Peringatan Tough-Love AI</h4>
              <p className="text-[8px] text-zinc-500 mt-0.5">Mode Survival Aktif</p>
            </div>
          </div>
          
          <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-white">
              {lang === "id" 
                ? "Batas Pengeluaran Dilanggar!" 
                : "Spending Limit Violated!"}
            </p>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              {lang === "id"
                ? `Kamu berada di Mode Survival (Tangga 1) dengan utang aktif/runway kritis. Mengeluarkan Rp${Number(amount).toLocaleString()} untuk Keinginan (Wants) saat ini adalah keputusan finansial yang buruk.`
                : `You are in Survival Mode (Step 1) with active debt/critical runway. Spending Rp${Number(amount).toLocaleString()} on Wants right now is a bad financial decision.`}
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleCancelFriction}
              className="flex-1 h-11 bg-zinc-900 border border-white/10 hover:bg-zinc-800 rounded-xl text-[10px] font-bold text-white uppercase tracking-wider transition-all"
            >
              {lang === "id" ? "Batal Belanja (Disiplin)" : "Cancel Spending"}
            </button>
            <button 
              onClick={() => handleSave(true)}
              className="flex-1 h-11 bg-rose-950 hover:bg-rose-900 border border-rose-500/30 rounded-xl text-[10px] font-bold text-rose-400 uppercase tracking-wider transition-all"
            >
              {lang === "id" ? "Abaikan & Catat" : "Ignore & Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 space-y-6 z-10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-black text-white text-xs uppercase tracking-wider">
              {lang === "id" ? "Catat Transaksi" : "Record Transaction"}
            </h3>
            <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          {step === "SELECT" ? (
            <div className="grid grid-cols-3 gap-3">
              {[ 
                { id: "INCOME", label: lang === "id" ? "Masuk" : "Income", icon: ArrowUpCircle }, 
                { id: "EXPENSE", label: lang === "id" ? "Keluar" : "Expense", icon: ArrowDownCircle }, 
                { id: "ALLOCATION", label: lang === "id" ? "Alokasi" : "Allocation", icon: ArrowLeftRight } 
              ].map((i) => (
                <button key={i.id} onClick={() => { setType(i.id as any); setStep("FORM"); }} className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl flex flex-col items-center gap-2 hover:bg-zinc-800 transition-all">
                  <i.icon className="w-6 h-6 text-primary" />
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">{i.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Input {type}</span>
                <button onClick={() => setStep("SELECT")} className="text-[9px] text-primary font-bold uppercase tracking-wider hover:underline">Kembali</button>
              </div>

              <input type="number" className="w-full h-12 bg-zinc-900 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-primary border border-white/5" placeholder="Nominal Rp" value={amount} onChange={(e) => setAmount(e.target.value)} />
              
              {type === "EXPENSE" && (
                <div className="space-y-3">
                  <select className="w-full h-11 bg-zinc-900 rounded-xl px-4 text-white text-xs border border-white/5 focus:outline-none" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Needs">Needs (Wajib)</option>
                    <option value="Wants">Wants (Keinginan)</option>
                    <option value="Business">Business (Kerja)</option>
                  </select>
                  <textarea className="w-full h-20 bg-zinc-900 rounded-xl p-4 text-white text-xs border border-white/5 focus:outline-none" placeholder="Audit Jurnal: Apa yang kamu rasakan saat membeli ini?" value={reflection} onChange={(e) => setReflection(e.target.value)} />
                </div>
              )}

              {/* Hustle Conversion UI untuk barang mahal */}
              {category === "Wants" && Number(amount) > 1000000 && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                  <div className="flex gap-2 text-primary mb-2">
                    <Target className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase">Hustle Conversion Required</span>
                  </div>
                  <p className="text-[10px] text-zinc-300">"Harga barang ini setara dengan 1 proyek sampingan copywriting. Sanggup selesaikan?"</p>
                </div>
              )}
              
              <button onClick={() => handleSave(false)} className="w-full h-12 bg-primary hover:bg-primary/95 rounded-xl font-bold text-white text-xs uppercase tracking-wider transition-all mt-2">Simpan Audit</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
