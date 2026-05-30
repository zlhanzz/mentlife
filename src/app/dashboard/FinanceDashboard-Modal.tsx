"use client";

import { useState } from "react";
import { Plus, Wallet, PieChart, History, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, X, BrainCircuit, RefreshCw, ShieldCheck, CreditCard, BarChart4, TrendingUp, TrendingDown, Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateLadderLevel, isFeatureLocked } from "@/lib/finance-logic";

// --- MODAL TRANSAKSI (AUDIT & HUSTLE ENABLED) ---
const TransactionModal = ({ isOpen, onClose, onAddTransaction, financeData, isInvestmentLocked }: any) => {
  const [step, setStep] = useState<"SELECT" | "FORM">("SELECT");
  const [type, setType] = useState<"INCOME" | "EXPENSE" | "ALLOCATION" | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Needs");
  const [reflection, setReflection] = useState(""); // Catatan psikologis/Audit
  const [isQuarantine, setIsQuarantine] = useState(false);

  const handleSave = async () => {
    if (!amount) return;
    // Logika Hustle Conversion: Jika Wants > 1jt, sistem memicu pengingat kerja
    const isHighValueWant = type === "EXPENSE" && category === "Wants" && Number(amount) > 1000000;
    
    await onAddTransaction(type, category, Number(amount), reflection || "Transaksi baru", isHighValueWant);
    onClose();
    setStep("SELECT");
    setAmount("");
  };

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
          <div className="space-y-4 animate-in slide-in-from-bottom-4">
            <h3 className="font-black text-white text-sm">Input {type}</h3>
            <input type="number" className="w-full h-12 bg-zinc-900 rounded-xl px-4 text-white" placeholder="Nominal Rp" value={amount} onChange={(e) => setAmount(e.target.value)} />
            
            {type === "EXPENSE" && (
              <div className="space-y-3">
                <select className="w-full h-10 bg-zinc-900 rounded-xl px-4 text-white text-xs" onChange={(e) => setCategory(e.target.value)}>
                  <option value="Needs">Needs (Wajib)</option>
                  <option value="Wants">Wants (Keinginan)</option>
                  <option value="Business">Business (Kerja)</option>
                </select>
                <textarea className="w-full h-20 bg-zinc-900 rounded-xl p-4 text-white text-xs" placeholder="Audit Jurnal: Apa yang kamu rasakan saat membeli ini?" value={reflection} onChange={(e) => setReflection(e.target.value)} />
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
            
            <button onClick={handleSave} className="w-full h-12 bg-primary rounded-xl font-bold text-white">Simpan Audit</button>
          </div>
        )}
      </div>
    </div>
  );
};
