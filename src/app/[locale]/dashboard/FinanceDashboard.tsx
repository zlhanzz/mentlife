"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Plus, Wallet, PieChart, History, ArrowUpCircle, ArrowDownCircle, 
  ArrowLeftRight, X, BrainCircuit, ShieldCheck, CreditCard, 
  BarChart4, TrendingUp, TrendingDown, Trash2, Calendar, ChevronDown, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/app-context";
import { calculateLadderLevel, isFeatureLocked } from "@/lib/finance-logic";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, ALLOCATION_CATEGORIES } from "@/lib/finance-categories";
import { AlertTriangle, Lock, ShieldAlert } from "lucide-react";
import { RupiahInput } from "./FinanceProfileTab";

// --- CUSTOM CATEGORY SELECT ---
interface CustomCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: any[];
  placeholder: string;
  onAddCategory?: (name: string) => void;
}

const CustomCategorySelect = ({ value, onChange, options, placeholder, onAddCategory }: CustomCategorySelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [flipUp, setFlipUp] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddInput(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Detect position and flip if needed
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 280; // approximate max height
      setFlipUp(spaceBelow < dropdownHeight);
    }
  }, [isOpen]);

  // Focus input when showAddInput changes
  useEffect(() => {
    if (showAddInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddInput]);

  const selectedOption = options.find((opt) => opt.label === value);

  const handleAddNew = () => {
    if (newName.trim() && onAddCategory) {
      onAddCategory(newName.trim());
      onChange(newName.trim());
      setNewName("");
      setShowAddInput(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => { setIsOpen(!isOpen); setShowAddInput(false); }}
        className="w-full h-11 bg-zinc-900 border border-white/10 rounded-xl px-4 flex items-center justify-between text-white text-xs focus:outline-none focus:border-primary transition-colors hover:border-white/20"
      >
        <span className={cn("flex items-center gap-2", !value && "text-zinc-500")}>
          {selectedOption ? (
            <>
              <span>{selectedOption.icon}</span>
              <span>{selectedOption.label}</span>
            </>
          ) : (
            <span>-- {placeholder} --</span>
          )}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", isOpen && (flipUp ? "rotate-0" : "rotate-180"))} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute z-[100] w-full bg-zinc-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in duration-150",
          flipUp 
            ? "bottom-full mb-1.5 slide-in-from-bottom-2" 
            : "mt-1.5 slide-in-from-top-2"
        )}>
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((cat) => (
              <button
                key={cat.id || cat.label}
                type="button"
                onClick={() => {
                  onChange(cat.label);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-2.5 flex items-center gap-3 text-xs transition-colors hover:bg-white/5",
                  value === cat.label ? "bg-primary/10 text-primary" : "text-white"
                )}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="flex-1 text-left">{cat.label}</span>
                {value === cat.label && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}

            {/* Add New Category */}
            <div className="border-t border-white/5 mt-1 pt-1">
              {showAddInput ? (
                <div className="px-3 py-2 flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddNew();
                      if (e.key === 'Escape') { setShowAddInput(false); setNewName(""); }
                    }}
                    placeholder={placeholder === "Pilih Kategori" ? "Nama kategori..." : "Category name..."}
                    className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-primary placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddNew}
                    disabled={!newName.trim()}
                    className="p-1.5 bg-primary hover:bg-primary/80 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddInput(false); setNewName(""); }}
                    className="p-1.5 text-zinc-500 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddInput(true)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-xs text-primary hover:bg-white/5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{placeholder === "Pilih Kategori" ? "Tambah Kategori Baru" : "Add New Category"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- ANALYTICS DASHBOARD ---
const AnalyticsDashboard = ({ financeData, transactions, budgets = [], t, lang }: any) => {
  const income = transactions.filter((t: any) => t.type === "INCOME").reduce((acc: number, t: any) => acc + t.amount, 0);
  const expense = transactions.filter((t: any) => t.type === "EXPENSE").reduce((acc: number, t: any) => acc + t.amount, 0);
  const burnRate = income > 0 ? (expense / income) * 100 : 0;

  const totalLimit = budgets.reduce((acc: number, b: any) => acc + b.limit, 0);
  const totalSpent = budgets.reduce((acc: number, b: any) => acc + b.spent, 0);
  const budgetUtilization = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  const healthScore = Math.max(0, Math.min(100, Math.round(100 - (burnRate * 0.6) - (financeData?.total_debt > 0 ? 15 : 0))));

  // Group and sort expenses by category
  const expenseTransactions = transactions.filter((t: any) => t.type === "EXPENSE");
  const categoryMap: Record<string, { amount: number; count: number }> = {};
  expenseTransactions.forEach((tx: any) => {
    const cat = tx.category || (lang === "id" ? "Lainnya" : "Other");
    if (!categoryMap[cat]) {
      categoryMap[cat] = { amount: 0, count: 0 };
    }
    categoryMap[cat].amount += tx.amount;
    categoryMap[cat].count += 1;
  });

  const totalExpenseAmount = expenseTransactions.reduce((acc: number, tx: any) => acc + tx.amount, 0);

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalExpenseAmount > 0 ? (data.amount / totalExpenseAmount) * 100 : 0,
      count: data.count
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Health Score Card */}
      <div className="bg-zinc-900 p-6 rounded-3xl border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Financial Health Score</p>
        </div>
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-3xl font-black text-white">{healthScore} <span className="text-xs text-zinc-500 font-bold">/ 100</span></h3>
          <span className={cn(
            "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", 
            healthScore > 75 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          )}>
            {healthScore > 75 ? (lang === "id" ? "SEHAT" : "HEALTHY") : (lang === "id" ? "EVALUASI" : "NEEDS REVIEW")}
          </span>
        </div>
        <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${healthScore}%` }} />
        </div>
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          {burnRate > 80 
            ? (lang === "id" ? "⚠️ Rasio pengeluaran bulanan Anda sangat tinggi dibandingkan pemasukan. Disarankan untuk membatasi pengeluaran non-esensial." : "⚠️ Your monthly expense ratio is high relative to income. Discretionary spending reduction is advised.")
            : (lang === "id" ? "✅ Arus kas Anda seimbang dan terkendali. Pertahankan kedisiplinan pencatatan ini." : "✅ Cashflow is balanced and well controlled. Maintain this recording discipline.")}
        </p>
      </div>

      {/* Budget Utilization Card */}
      <div className="bg-zinc-900 p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-primary" />
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{lang === "id" ? "Pemakaian Anggaran" : "Budget Utilization"}</p>
        </div>
        <div className="flex justify-between items-baseline">
          <p className="text-xl font-black text-white">{budgetUtilization.toFixed(0)}%</p>
          <p className="text-[10px] text-zinc-500 font-bold">Rp{totalSpent.toLocaleString()} / Rp{totalLimit.toLocaleString()}</p>
        </div>
        <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
          <div className={cn("h-full transition-all duration-500", budgetUtilization > 90 ? "bg-rose-500" : budgetUtilization > 70 ? "bg-amber-500" : "bg-primary")} style={{ width: `${budgetUtilization}%` }} />
        </div>
      </div>

      {/* Category Portion Breakdown Card */}
      <div className="bg-zinc-900 p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart4 className="w-4 h-4 text-indigo-400" />
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {lang === "id" ? "Porsi Pengeluaran per Kategori" : "Expense Portion by Category"}
          </p>
        </div>
        {categoryBreakdown.length === 0 ? (
          <p className="text-[10px] text-zinc-500 italic py-4 text-center">
            {lang === "id" ? "Tidak ada catatan pengeluaran pada periode ini." : "No expense records in this period."}
          </p>
        ) : (
          <div className="space-y-4 pt-2">
            {categoryBreakdown.map((item, idx) => {
              let barColor = "bg-primary";
              if (idx === 0) barColor = "bg-violet-500";
              else if (idx === 1) barColor = "bg-indigo-500";
              else if (idx === 2) barColor = "bg-sky-500";

              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between items-baseline text-[10px]">
                    <span className="font-bold text-white uppercase tracking-wide">{item.category}</span>
                    <div className="space-x-1.5 font-bold">
                      <span className="text-zinc-400">Rp{item.amount.toLocaleString()}</span>
                      <span className="text-primary">{item.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-500", barColor)} style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI CFO Report Card */}
      <div className="bg-zinc-900 p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">{t("finance.aiReview")}</p>
        </div>
        
        <div className="space-y-3 divide-y divide-white/5">
          <div className="flex items-center justify-between pb-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">{lang === "id" ? "Arus Kas Bulanan" : "Monthly Cashflow"}</span>
            <span className="text-[10px] font-black text-emerald-400">SURPLUS</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">{lang === "id" ? "Penyebaran Anggaran" : "Budget Distribution"}</span>
            <span className={cn("text-[10px] font-black", budgetUtilization > 90 ? "text-rose-400" : "text-emerald-400")}>
              {budgetUtilization > 90 ? "OVERLIMIT WARNING" : "TERKENDALI"}
            </span>
          </div>
          {financeData?.total_debt > 0 && (
            <div className="flex items-center justify-between py-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">{lang === "id" ? "Status Utang Konsumtif" : "Consumer Debt Status"}</span>
              <span className="text-[10px] font-black text-amber-400">BUTUH PELUNASAN</span>
            </div>
          )}
        </div>

        <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-2xl p-4 mt-2">
          <p className="text-[10px] text-indigo-200/90 leading-relaxed">
            {lang === "id" 
              ? "💡 Rapor CFO AI: Dana darurat Anda belum menyentuh target 100%. Prioritaskan mengalokasikan sisa kas operasional setiap minggunya untuk mempertebal jaring pengaman sebelum memulai investasi." 
              : "💡 CFO AI Insights: Your emergency fund has not reached 100%. Prioritize allocating residual operational cash weekly to reinforce your safety net before committing to investments."}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- MODAL TRANSAKSI ---
const TransactionModal = ({ isOpen, onClose, onAddTransaction, defaultType, customCategories, onAddCustomCategory, onEditCustomCategory, onDeleteCustomCategory, lang, financeData }: any) => {
  const [step, setStep] = useState<"SELECT" | "FORM">("SELECT");
  const [type, setType] = useState<"INCOME" | "EXPENSE" | "ALLOCATION" | null>(null);
  const [amount, setAmount] = useState("");
  const [mainGroup, setMainGroup] = useState<"Needs" | "Wants" | "Business">("Needs");
  const [selectedCat, setSelectedCat] = useState("");
  const [desc, setDesc] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🏷️");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("🏷️");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Financial priority computation for allocation enforcement
  const totalDebt = financeData?.total_debt || 0;
  const efCurrent = financeData?.emergency_fund_current || 0;
  const efTarget = financeData?.emergency_fund_target || 0;
  const hasDebt = totalDebt > 0;
  const emergencyFundMet = efTarget > 0 && efCurrent >= efTarget;

  const ICON_OPTIONS = ["🏷️", "💰", "🎯", "", "🚗", "", "🍔", "", "🎮", "", "✈️", "💊", "👕", "🎁", "⚡", "", "🐾", "️", "💼", ""];

  useEffect(() => {
    if (isOpen) {
      if (defaultType) {
        setType(defaultType);
        setStep("FORM");
      } else {
        setType(null);
        setStep("SELECT");
      }
      setSelectedCat("");
      setNewCatName("");
      setAmount("");
      setDesc("");
      setSaveError("");
    }
  }, [isOpen, defaultType]);

  const getOptions = () => {
    let defaults: any[] = [];
    if (type === "INCOME") defaults = INCOME_CATEGORIES;
    else if (type === "ALLOCATION") {
      // Apply financial ladder priority enforcement
      // "Tambah Utang" is always available (users can record new debt at any level)
      if (hasDebt) {
        // Level 1: Debt exists → debt payment + ability to add new debt
        defaults = ALLOCATION_CATEGORIES.filter(c => c.id === "utang" || c.id === "utang_baru");
      } else if (!emergencyFundMet) {
        // Level 2: No debt but emergency fund incomplete → Dana Darurat + Investasi + Tambah Utang
        defaults = ALLOCATION_CATEGORIES.filter(c => c.id !== "utang");
      } else {
        // Level 3+: All options available
        defaults = [...ALLOCATION_CATEGORIES];
      }
    }
    else defaults = EXPENSE_CATEGORIES[mainGroup || "Needs"] || [];

    const customs = (customCategories && type) ? (customCategories[type === "EXPENSE" ? (mainGroup || "Needs") : type] || []) : [];
    return [...defaults, ...customs];
  };

  const handleAddCategoryClick = () => {
    if (!newCatName.trim()) return;
    const group = type === "EXPENSE" ? (mainGroup || "Needs") : type;
    if (group && onAddCustomCategory) {
      onAddCustomCategory(group, newCatName.trim(), newCatIcon);
      setSelectedCat(newCatName.trim());
      setNewCatName("");
      setNewCatIcon("🏷️");
    }
  };

  const handleStartEdit = (cat: any) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.label);
    setEditCatIcon(cat.icon);
  };

  const handleSaveEdit = () => {
    if (!editCatName.trim() || !editingCatId) return;
    const group = type === "EXPENSE" ? (mainGroup || "Needs") : type;
    if (group && onEditCustomCategory) {
      onEditCustomCategory(group, editingCatId, editCatName.trim(), editCatIcon);
      if (selectedCat === editingCatId) {
        setSelectedCat(editCatName.trim());
      }
      setEditingCatId(null);
      setEditCatName("");
      setEditCatIcon("🏷️");
    }
  };

  const handleCancelEdit = () => {
    setEditingCatId(null);
    setEditCatName("");
    setEditCatIcon("🏷️");
  };

  const handleSave = async () => {
    if (!amount || !selectedCat) return;
    setIsSaving(true);
    setSaveError("");
    try {
      const res = await onAddTransaction(type, selectedCat, Number(amount), desc);
      if (res && res.success) {
        onClose();
        setStep("SELECT");
        setAmount("");
        setDesc("");
      } else {
        setSaveError(res?.message || (lang === "id" ? "Gagal menyimpan transaksi." : "Failed to save transaction."));
      }
    } catch (err: any) {
      setSaveError(err?.message || (lang === "id" ? "Terjadi kesalahan." : "An error occurred."));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 space-y-6">
        {step === "SELECT" ? (
          <div className="grid grid-cols-3 gap-3">
            {[ 
              { id: "INCOME", label: lang === "id" ? "Masuk" : "Income", icon: ArrowUpCircle }, 
              { id: "EXPENSE", label: lang === "id" ? "Keluar" : "Expense", icon: ArrowDownCircle }, 
              { id: "ALLOCATION", label: lang === "id" ? "Alokasi" : "Allocation", icon: ArrowLeftRight } 
            ].map((i) => (
              <button key={i.id} onClick={() => { setType(i.id as any); setStep("FORM"); }} className="p-4 bg-zinc-900 rounded-2xl flex flex-col items-center gap-2 hover:bg-zinc-800">
                <i.icon className="w-6 h-6 text-primary" />
                <span className="text-[9px] font-bold text-white uppercase">{i.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-white text-xs uppercase tracking-widest">Input {type === "INCOME" ? (lang === "id" ? "Pemasukan" : "Income") : type === "EXPENSE" ? (lang === "id" ? "Pengeluaran" : "Expense") : (lang === "id" ? "Alokasi" : "Allocation")}</h3>
              <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Allocation Priority Enforcement Banner */}
            {type === "ALLOCATION" && hasDebt && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-rose-400">{lang === "id" ? "🚨 Prioritas Utama: Lunasi Utang" : "🚨 Top Priority: Pay Off Debt"}</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5">{lang === "id" ? `Sisa utang: Rp${totalDebt.toLocaleString()}. Alokasi diarahkan penuh ke pelunasan utang sesuai Tangga Finansial Level 1.` : `Remaining debt: Rp${totalDebt.toLocaleString()}. Allocation is locked to debt payment per Financial Ladder Level 1.`}</p>
                </div>
              </div>
            )}
            {type === "ALLOCATION" && !hasDebt && !emergencyFundMet && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-blue-400">{lang === "id" ? "🛡️ Prioritas: Bangun Dana Darurat" : "🛡️ Priority: Build Emergency Fund"}</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5">{lang === "id" ? `Dana darurat: Rp${efCurrent.toLocaleString()} / Rp${efTarget.toLocaleString()}. Fokus pengisian dana darurat sebelum investasi agresif.` : `Emergency fund: Rp${efCurrent.toLocaleString()} / Rp${efTarget.toLocaleString()}. Focus on emergency fund before aggressive investing.`}</p>
                </div>
              </div>
            )}
            
            <RupiahInput
              label={lang === "id" ? "Nominal Transaksi" : "Transaction Amount"}
              value={amount}
              onChange={setAmount}
              placeholder="0"
            />
            
            {type === "EXPENSE" && (
              <div className="flex gap-2">
                {(["Needs", "Wants", "Business"] as const).map(g => (
                  <button 
                    key={g} 
                    type="button"
                    onClick={() => { setMainGroup(g); setSelectedCat(""); }} 
                    className={cn("flex-1 py-2 text-[9px] font-bold rounded-lg border uppercase tracking-wider", mainGroup === g ? "bg-primary border-primary text-white" : "border-white/5 bg-zinc-900 text-zinc-500")}
                  >
                    {g === "Needs" ? (lang === "id" ? "Kebutuhan" : "Needs") : g === "Wants" ? (lang === "id" ? "Keinginan" : "Wants") : (lang === "id" ? "Bisnis" : "Business")}
                  </button>
                ))}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase block">{lang === "id" ? "Pilih Kategori" : "Select Category"}</label>
              <CustomCategorySelect
                value={selectedCat}
                onChange={setSelectedCat}
                options={getOptions()}
                placeholder={lang === "id" ? "Pilih Kategori" : "Pick Category"}
                onAddCategory={(name) => {
                  const group = type === "EXPENSE" ? (mainGroup || "Needs") : type;
                  if (group && onAddCustomCategory) {
                    onAddCustomCategory(group, name, "🏷️");
                  }
                }}
              />
            </div>

            <input 
              type="text" 
              className="w-full h-11 bg-zinc-900 border border-white/5 rounded-xl px-4 text-white text-xs focus:outline-none focus:border-primary" 
              placeholder={lang === "id" ? "Keterangan / Deskripsi (opsional)" : "Notes / Description (optional)"} 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)} 
            />

            {saveError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                <p className="text-[10px] font-bold text-rose-400">{saveError}</p>
              </div>
            )}

            <button onClick={handleSave} disabled={isSaving} className="w-full h-12 bg-primary rounded-xl font-bold text-white text-xs uppercase tracking-widest mt-2 disabled:opacity-50">
              {isSaving ? (lang === "id" ? "Menyimpan..." : "Saving...") : (lang === "id" ? "Simpan Transaksi" : "Save Transaction")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MODAL BUDGET ---
const AddBudgetModal = ({ isOpen, onClose, onAddBudget, t, lang }: any) => {
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);

  const handleSave = () => {
    if (!category || !limit) return;
    onAddBudget(category, Number(limit), isRecurring);
    setCategory("");
    setLimit("");
    setIsRecurring(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 space-y-4 animate-in slide-in-from-bottom-4">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-white text-sm uppercase tracking-widest">{t("finance.tambahAnggaran")}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">{lang === "id" ? "Nama Anggaran" : "Budget Name"}</label>
            <input type="text" className="w-full h-11 bg-zinc-900 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-primary border border-white/5" placeholder={lang === "id" ? "Nama Anggaran (misal: Makanan)" : "Budget Name (e.g. Food)"} value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <RupiahInput
            label={lang === "id" ? "Batas Anggaran" : "Budget Limit"}
            value={limit}
            onChange={setLimit}
            placeholder="0"
            required
          />
          <div className="flex items-center justify-between bg-zinc-900/40 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase">{lang === "id" ? "Tipe Anggaran" : "Budget Type"}</span>
            <button type="button" onClick={() => setIsRecurring(!isRecurring)} className={cn("px-3 py-1 text-[9px] font-bold rounded-lg border uppercase tracking-wider transition-all", isRecurring ? "bg-primary border-primary text-white" : "border-white/10 text-zinc-500")}>
              {isRecurring ? t("finance.berulang") : t("finance.tidakBerulang")}
            </button>
          </div>
          <button onClick={handleSave} className="w-full h-11 bg-primary rounded-xl font-bold text-white text-xs uppercase tracking-wider transition-all hover:bg-primary/90 mt-2">{t("finance.simpan")}</button>
        </div>
      </div>
    </div>
  );
};

// --- MODAL GOAL ---
const AddGoalModal = ({ isOpen, onClose, onAddGoal, t, lang }: any) => {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleSave = () => {
    if (!title || !target || !deadline) return;
    onAddGoal(title, Number(target), deadline);
    setTitle("");
    setTarget("");
    setDeadline("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 space-y-4 animate-in slide-in-from-bottom-4">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-white text-sm uppercase tracking-widest">{t("finance.tambahGoal")}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">{lang === "id" ? "Nama Goal" : "Goal Name"}</label>
            <input type="text" className="w-full h-11 bg-zinc-900 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-primary border border-white/5" placeholder={lang === "id" ? "Misal: Tabungan Pernikahan" : "e.g. Wedding Savings"} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <RupiahInput
            label={lang === "id" ? "Target Dana" : "Target Amount"}
            value={target}
            onChange={setTarget}
            placeholder="0"
            required
          />
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">{t("finance.targetWaktu")}</label>
            <input type="date" className="w-full h-11 bg-zinc-900 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-primary border border-white/5" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <button onClick={handleSave} className="w-full h-11 bg-primary rounded-xl font-bold text-white text-xs uppercase tracking-wider transition-all hover:bg-primary/90 mt-2">{t("finance.simpan")}</button>
        </div>
      </div>
    </div>
  );
};

export default function FinanceDashboard({ financeData, transactions = [], onAddTransaction, usersCore }: any) {
  const { lang = "id", t } = useApp();
  const [activeTab, setActiveTab] = useState<"summary" | "analytics" | "history">("summary");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"INCOME" | "EXPENSE" | "ALLOCATION" | null>(null);

  // Dynamic current date references
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const prevMonth = now.getMonth() === 0 ? "12" : String(now.getMonth()).padStart(2, "0");
  const prevMonthYear = now.getMonth() === 0 ? String(now.getFullYear() - 1) : currentYear;
  const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const monthNamesEn = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const currentMonthName = lang === "id" ? monthNames[now.getMonth()] : monthNamesEn[now.getMonth()];
  const prevMonthName = lang === "id" ? monthNames[now.getMonth() === 0 ? 11 : now.getMonth() - 1] : monthNamesEn[now.getMonth() === 0 ? 11 : now.getMonth() - 1];

  // Time Period Filter State ("this_month" | "last_month" | year strings)
  const [timeFilter, setTimeFilter] = useState<string>("this_month");

  // Custom Categories State managed dynamically with localStorage persistence
  const [customCategories, setCustomCategories] = useState<{
    Needs: Array<{ id: string; label: string; icon: string }>;
    Wants: Array<{ id: string; label: string; icon: string }>;
    Business: Array<{ id: string; label: string; icon: string }>;
    INCOME: Array<{ id: string; label: string; icon: string }>;
    ALLOCATION: Array<{ id: string; label: string; icon: string }>;
  }>(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mentlife_custom_categories');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Ignore parse errors
        }
      }
    }
    return {
      Needs: [],
      Wants: [],
      Business: [],
      INCOME: [],
      ALLOCATION: []
    };
  });

  // Persist custom categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mentlife_custom_categories', JSON.stringify(customCategories));
  }, [customCategories]);

  const handleAddCustomCategory = (group: "Needs" | "Wants" | "Business" | "INCOME" | "ALLOCATION", name: string, icon: string = "️") => {
    const id = name.toLowerCase().replace(/\s+/g, "-");
    // Check if category already exists
    const exists = customCategories[group].some(cat => cat.id === id);
    if (exists) return;
    
    const newCat = { id, label: name, icon };
    setCustomCategories(prev => ({
      ...prev,
      [group]: [...prev[group], newCat]
    }));
  };

  const handleEditCustomCategory = (group: "Needs" | "Wants" | "Business" | "INCOME" | "ALLOCATION", oldId: string, newName: string, newIcon: string) => {
    const newId = newName.toLowerCase().replace(/\s+/g, "-");
    setCustomCategories(prev => ({
      ...prev,
      [group]: prev[group].map(cat => 
        cat.id === oldId ? { id: newId, label: newName, icon: newIcon } : cat
      )
    }));
  };

  const handleDeleteCustomCategory = (group: "Needs" | "Wants" | "Business" | "INCOME" | "ALLOCATION", categoryId: string) => {
    setCustomCategories(prev => ({
      ...prev,
      [group]: prev[group].filter(cat => cat.id !== categoryId)
    }));
  };

  // Pre-populated localTransactions with rich historical data for demonstration
  const [localTransactions, setLocalTransactions] = useState(() => {
    const defaultMock = [
      // Mei 2026 (Bulan Ini)
      { id: "tx-m1", type: "EXPENSE", category: "Makanan & Minuman", amount: 150000, description: "Makan siang sushi", created_at: "2026-05-28T12:00:00.000Z", date: "2026-05-28" },
      { id: "tx-m2", type: "EXPENSE", category: "Rokok", amount: 35000, description: "Beli rokok", created_at: "2026-05-27T10:00:00.000Z", date: "2026-05-27" },
      { id: "tx-m3", type: "EXPENSE", category: "Motor & Kendaraan", amount: 350000, description: "Servis motor berkala", created_at: "2026-05-25T09:00:00.000Z", date: "2026-05-25" },
      { id: "tx-m4", type: "INCOME", category: "Gaji Utama", amount: 7500000, description: "Gaji bulanan", created_at: "2026-05-25T08:00:00.000Z", date: "2026-05-25" },
      { id: "tx-m5", type: "EXPENSE", category: "Tagihan Listrik", amount: 450000, description: "Token listrik", created_at: "2026-05-20T14:00:00.000Z", date: "2026-05-20" },
      { id: "tx-m6", type: "EXPENSE", category: "Cemilan", amount: 85000, description: "Snack indomaret", created_at: "2026-05-18T16:00:00.000Z", date: "2026-05-18" },
      { id: "tx-m7", type: "EXPENSE", category: "Langganan Layanan", amount: 186000, description: "Langganan Netflix & Spotify", created_at: "2026-05-10T08:00:00.000Z", date: "2026-05-10" },

      // April 2026 (Bulan Lalu)
      { id: "tx-l1", type: "EXPENSE", category: "Makanan & Minuman", amount: 1200000, description: "Makan bulanan April", created_at: "2026-04-28T12:00:00.000Z", date: "2026-04-28" },
      { id: "tx-l2", type: "EXPENSE", category: "Transportasi", amount: 300000, description: "Bensin April", created_at: "2026-04-25T10:00:00.000Z", date: "2026-04-25" },
      { id: "tx-l3", type: "EXPENSE", category: "Cemilan", amount: 200000, description: "Jajan April", created_at: "2026-04-20T15:00:00.000Z", date: "2026-04-20" },
      { id: "tx-l4", type: "INCOME", category: "Gaji Utama", amount: 7500000, description: "Gaji April", created_at: "2026-04-25T08:00:00.000Z", date: "2026-04-25" },
      { id: "tx-l5", type: "EXPENSE", category: "Rokok", amount: 350000, description: "Rokok April", created_at: "2026-04-15T09:00:00.000Z", date: "2026-04-15" },
      { id: "tx-l6", type: "EXPENSE", category: "Tagihan Internet/HP", amount: 150000, description: "Paket data April", created_at: "2026-04-05T11:00:00.000Z", date: "2026-04-05" },

      // Tahun 2025
      { id: "tx-25-1", type: "INCOME", category: "Gaji Utama", amount: 80000000, description: "Total Gaji Tahun 2025", created_at: "2025-12-15T12:00:00.000Z", date: "2025-12-15" },
      { id: "tx-25-2", type: "EXPENSE", category: "Pendidikan", amount: 12000000, description: "Uang Kuliah Semester 2025", created_at: "2025-07-10T09:00:00.000Z", date: "2025-07-10" },
      { id: "tx-25-3", type: "EXPENSE", category: "Motor & Kendaraan", amount: 18000000, description: "Beli motor bekas cash", created_at: "2025-05-12T10:00:00.000Z", date: "2025-05-12" },
      { id: "tx-25-4", type: "EXPENSE", category: "Makanan & Minuman", amount: 15000000, description: "Makan & Minum 2025", created_at: "2025-06-20T12:00:00.000Z", date: "2025-06-20" },

      // Tahun 2024
      { id: "tx-24-1", type: "INCOME", category: "Proyek Freelance", amount: 45000000, description: "Proyek pembuatan web", created_at: "2024-11-20T12:00:00.000Z", date: "2024-11-20" },
      { id: "tx-24-2", type: "EXPENSE", category: "Gadget & Aksesoris", amount: 15000000, description: "Beli Laptop Kerja Baru", created_at: "2024-08-15T10:00:00.000Z", date: "2024-08-15" },
      { id: "tx-24-3", type: "EXPENSE", category: "Makanan & Minuman", amount: 10000000, description: "Makan bulanan 2024", created_at: "2024-05-10T12:00:00.000Z", date: "2024-05-10" },
    ];

    // Merge actual transactions if they exist
    const actual = (transactions || []).map((t: any) => ({
      id: t.id,
      type: t.type,
      category: t.category,
      amount: t.amount,
      description: t.description || "",
      created_at: t.created_at || t.date || new Date().toISOString(),
      date: t.date || (t.created_at ? t.created_at.split("T")[0] : new Date().toISOString().split("T")[0])
    }));

    // Prepend actual transactions to the default mock
    const existingIds = new Set(actual.map((t: any) => t.id));
    const uniqueMocks = defaultMock.filter((t: any) => !existingIds.has(t.id));
    return [...actual, ...uniqueMocks];
  });

  // Sync prop changes
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      setLocalTransactions(prev => {
        const existingIds = new Set(prev.map((t: any) => t.id));
        const newTxs = transactions.filter((t: any) => !existingIds.has(t.id)).map((t: any) => ({
          id: t.id,
          type: t.type,
          category: t.category,
          amount: t.amount,
          description: t.description || "",
          created_at: t.created_at || t.date || new Date().toISOString(),
          date: t.date || (t.created_at ? t.created_at.split("T")[0] : new Date().toISOString().split("T")[0])
        }));
        return [...newTxs, ...prev];
      });
    }
  }, [transactions]);

  // Date Filtering Logic (dynamic based on current date)
  const filteredTransactions = localTransactions.filter((tx: any) => {
    const txDateStr = tx.date || tx.created_at || "";
    if (!txDateStr) return true;
    
    const txYear = txDateStr.substring(0, 4);
    const txMonth = txDateStr.substring(5, 7);

    if (timeFilter === "this_month") {
      return txYear === currentYear && txMonth === currentMonth;
    } else if (timeFilter === "last_month") {
      return txYear === prevMonthYear && txMonth === prevMonth;
    } else {
      return txYear === timeFilter;
    }
  });

  const handleLocalAddTransaction = async (
    type: "INCOME" | "EXPENSE" | "ALLOCATION",
    category: string,
    amount: number,
    description: string
  ) => {
    // Delegate to parent (finance-tab.tsx) which handles server action + local state + router.refresh
    // The transactions prop will update via useEffect sync, avoiding duplicate entries
    const res = await onAddTransaction(type, category, amount, description);
    return res;
  };

  // Budgets & Goals Modals
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Pre-populated Budgeting & Goals local states (Semi-dummy)
  const [budgets, setBudgets] = useState([
    { id: "b1", category: "Makanan & Sembako", limit: 2000000, spent: 1450000, isRecurring: true },
    { id: "b2", category: "Sewa Kos & Tagihan", limit: 1200000, spent: 1200000, isRecurring: true },
    { id: "b3", category: "Kopi & Cafe", limit: 400000, spent: 350000, isRecurring: false },
    { id: "b4", category: "Belanja Gaya Hidup", limit: 1500000, spent: 300000, isRecurring: false },
  ]);

  const [goals, setGoals] = useState(() => {
    const isSingleOrPacaran = !usersCore || usersCore.marital_status === "single" || usersCore.marital_status === "pacaran";
    const needsHouse = !usersCore || (usersCore.living_situation !== "Milik Sendiri (Lunas)" && usersCore.living_situation !== "Milik Sendiri (KPR)");

    const initialGoals = [];
    if (isSingleOrPacaran) {
      initialGoals.push({
        id: "g1", 
        title: "Tabungan Pernikahan", 
        target: 60000000, 
        current: 6000000, 
        deadline: "2027-12-31", 
        aiReview: lang === "id" 
          ? "Tabungan pernikahan baru terkumpul 10%. Berdasarkan surplus kas saat ini, naikkan alokasi bulanan sebesar Rp500.000 agar target tercapai tepat waktu." 
          : "Wedding savings are only at 10%. Based on your cashflow surplus, increase monthly allocation by Rp500,000 to meet your timeline."
      });
    }
    if (needsHouse) {
      initialGoals.push({ 
        id: "g2", 
        title: "Uang Muka (DP) Rumah", 
        target: 150000000, 
        current: 15000000, 
        deadline: "2029-06-30", 
        aiReview: lang === "id"
          ? "Keadaan finansial Anda saat ini di Level 1. Selesaikan utang aktif Anda sebesar Rp733.000 terlebih dahulu sebelum mengalokasikan tabungan DP properti." 
          : "Your current financial state is Level 1. Pay off your remaining Rp733,000 active debt first before dedicating funds to property downpayments."
      });
    }
    
    // Fallback if none matched (user is married and already owns home lunas/KPR)
    if (initialGoals.length === 0) {
      initialGoals.push({
        id: "g3",
        title: "Dana Pendidikan Anak",
        target: 100000000,
        current: 25000000,
        deadline: "2032-12-31",
        aiReview: lang === "id"
          ? "Dana pendidikan anak terkumpul 25%. Tingkatkan alokasi bulanan Anda ke instrumen reksa dana pasar uang untuk mengimbangi inflasi biaya pendidikan."
          : "Child education funds are at 25%. Increase your monthly allocation to money market funds to hedge against tuition cost inflation."
      });
    }
    return initialGoals;
  });

  const handleOpenModal = (type: "INCOME" | "EXPENSE" | "ALLOCATION") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleAddBudget = (category: string, limit: number, isRecurring: boolean) => {
    const newBudget = {
      id: `b-${Date.now()}`,
      category,
      limit,
      spent: 0,
      isRecurring
    };
    setBudgets([newBudget, ...budgets]);
  };

  const handleAddGoal = (title: string, target: number, deadline: string) => {
    const newGoal = {
      id: `g-${Date.now()}`,
      title,
      target,
      current: 0,
      deadline,
      aiReview: lang === "id"
        ? "💡 CFO AI: Goal baru terdaftar. Naikkan konsistensi alokasi Sisa Kas untuk mengumpulkan target ini secara bertahap."
        : "💡 CFO AI: New goal registered. Increase your consistent cashflow allocations to accumulate towards this target."
    };
    setGoals([newGoal, ...goals]);
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets(budgets.filter(b => b.id !== id));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const ladderLevel = calculateLadderLevel({
    liquid_savings: financeData?.liquid_savings || 0,
    total_debt: financeData?.total_debt || 0,
    emergency_fund_current: financeData?.emergency_fund_current || 0,
    emergency_fund_target: financeData?.emergency_fund_target || 0,
    investment_value: financeData?.investment_value || 0,
    monthly_expenses: financeData?.monthly_expenses || 0,
  });

  const isInvestmentLocked = isFeatureLocked(ladderLevel, 'INVESTMENT');
  const efProgress = financeData?.emergency_fund_target > 0 ? ((financeData.emergency_fund_current || 0) / financeData.emergency_fund_target) * 100 : 0;
  // Debt progress: countdown from full → empty as debt is paid off
  // Uses total_borrowed (all debt ever taken) as the baseline denominator
  const totalBorrowed = financeData?.total_borrowed || ((financeData?.total_debt || 0) + (financeData?.debt_paid || 0));
  const debtProgress = totalBorrowed > 0 ? ((financeData?.total_debt || 0) / totalBorrowed) * 100 : 0;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Tab Switcher */}
      <div className="sticky top-0 z-30 px-4 py-3 bg-background/90 backdrop-blur border-b border-white/5">
        <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl">
          {[ 
            { id: "summary", label: t("finance.summary"), icon: Wallet }, 
            { id: "analytics", label: t("finance.analytics"), icon: PieChart }, 
            { id: "history", label: t("finance.history"), icon: History } 
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", activeTab === tab.id ? "bg-primary text-white" : "text-zinc-500")}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Period Filter Pills/Dropdown */}
      {(activeTab === "analytics" || activeTab === "history") && (
        <div className="px-4 mt-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between p-3.5 bg-zinc-900 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              {lang === "id" ? "Filter Periode" : "Period Filter"}
            </span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-extrabold text-white focus:outline-none focus:border-primary cursor-pointer transition-colors"
            >
              <option value="this_month" className="bg-zinc-950">{lang === "id" ? `Bulan Ini (${currentMonthName} ${currentYear})` : `This Month (${currentMonthName} ${currentYear})`}</option>
              <option value="last_month" className="bg-zinc-950">{lang === "id" ? `Bulan Lalu (${prevMonthName} ${prevMonthYear})` : `Last Month (${prevMonthName} ${prevMonthYear})`}</option>
              <option value={currentYear} className="bg-zinc-950">{lang === "id" ? `Tahun ${currentYear}` : `Year ${currentYear}`}</option>
              <option value={String(Number(currentYear) - 1)} className="bg-zinc-950">{lang === "id" ? `Tahun ${Number(currentYear) - 1}` : `Year ${Number(currentYear) - 1}`}</option>
              <option value={String(Number(currentYear) - 2)} className="bg-zinc-950">{lang === "id" ? `Tahun ${Number(currentYear) - 2}` : `Year ${Number(currentYear) - 2}`}</option>
            </select>
          </div>
        </div>
      )}

      <div className="px-4 mt-6 space-y-6">
        {activeTab === "summary" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Balance Card */}
            <div className="bg-zinc-900 p-6 rounded-3xl border border-white/5 shadow-xl space-y-5">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t("finance.sisaKas")}</p>
                <h2 className="text-3xl font-black mt-1 text-white">Rp{financeData?.liquid_savings?.toLocaleString()}</h2>
              </div>
              
              {/* Inline Action Engine Buttons (Pemasukan, Pengeluaran, Alokasi) */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
                <button onClick={() => handleOpenModal("INCOME")} className="py-2.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95">
                  <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">{lang === "id" ? "Pemasukan" : "Income"}</span>
                </button>
                <button onClick={() => handleOpenModal("EXPENSE")} className="py-2.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95">
                  <ArrowDownCircle className="w-5 h-5 text-rose-500" />
                  <span className="text-[8px] font-black text-rose-400 uppercase tracking-wider">{lang === "id" ? "Pengeluaran" : "Expense"}</span>
                </button>
                <button onClick={() => handleOpenModal("ALLOCATION")} className="py-2.5 px-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95">
                  <ArrowLeftRight className="w-5 h-5 text-indigo-500" />
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-wider">{lang === "id" ? "Alokasi" : "Allocation"}</span>
                </button>
              </div>
            </div>
            
            {/* Fundamental Buckets Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card p-4 rounded-2xl border border-white/5">
                <ShieldCheck className="w-4 h-4 text-blue-500 mb-2" />
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">{t("finance.danaDarurat")}</p>
                <div className="h-1 bg-zinc-800 rounded-full mt-2 mb-2"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${efProgress}%` }} /></div>
                <p className="text-[9px] font-bold text-white">Rp{financeData?.emergency_fund_current?.toLocaleString() || 0} <span className="text-zinc-500 font-normal">/ Rp{financeData?.emergency_fund_target?.toLocaleString() || 0}</span></p>
              </div>
              <div className="bg-card p-4 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <CreditCard className="w-4 h-4 text-rose-500" />
                  <button onClick={() => handleOpenModal("ALLOCATION")} className="w-5 h-5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center transition-colors" title={lang === "id" ? "Catat Utang Baru" : "Record New Debt"}>
                    <span className="text-[9px] font-black text-rose-500 leading-none">+</span>
                  </button>
                </div>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">{t("finance.utangAktif")}</p>
                <div className="h-1 bg-zinc-800 rounded-full mt-2 mb-2"><div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${debtProgress}%` }} /></div>
                <p className="text-[9px] font-bold text-rose-400">Rp{financeData?.total_debt?.toLocaleString() || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={cn("bg-card p-4 rounded-2xl border border-white/5 transition-all", isInvestmentLocked && "opacity-50 grayscale")}>
                <BarChart4 className="w-4 h-4 text-violet-500 mb-2" />
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">{t("finance.investasi")}</p>
                <p className="text-sm font-black text-white">{isInvestmentLocked ? t("finance.terkunci") : `Rp${financeData?.investment_value?.toLocaleString()}`}</p>
              </div>
              <div className="bg-card p-4 rounded-2xl border border-white/5">
                <BrainCircuit className="w-4 h-4 text-indigo-400 mb-2" />
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">{t("finance.levelTangga")}</p>
                <p className="text-sm font-black text-white">Level {ladderLevel}</p>
              </div>
            </div>

            {/* SECTION: ANGGARAN BULANAN (BUDGETING) */}
            <div className="bg-zinc-900/40 p-5 rounded-3xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">{t("finance.anggaranBulanan")}</h4>
                  <p className="text-[8px] text-zinc-500 mt-0.5">{t("finance.anggaranSub")}</p>
                </div>
                <button onClick={() => setIsBudgetModalOpen(true)} className="py-1.5 px-3 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-xl text-[8px] font-bold text-primary uppercase tracking-wider transition-all">
                  {t("finance.tambahAnggaran")}
                </button>
              </div>

              <div className="space-y-3">
                {budgets.map((b) => {
                  const spentPct = Math.min((b.spent / b.limit) * 100, 100);
                  let progressColor = "bg-emerald-500";
                  if (spentPct > 90) progressColor = "bg-rose-500";
                  else if (spentPct > 70) progressColor = "bg-amber-500";

                  return (
                    <div key={b.id} className="p-3 bg-zinc-950/40 rounded-2xl border border-white/5 space-y-2 relative group transition-all hover:border-white/10">
                      <button onClick={() => handleDeleteBudget(b.id)} className="absolute top-3 right-3 text-zinc-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-white">{b.category}</p>
                          <span className="inline-block text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-1 bg-zinc-900 text-zinc-400 border border-white/5">
                            {b.isRecurring ? t("finance.berulang") : t("finance.tidakBerulang")}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-white">Rp{b.spent.toLocaleString()} / Rp{b.limit.toLocaleString()}</p>
                          <p className="text-[8px] text-zinc-500 mt-0.5">{t("finance.sisa")}: Rp{(b.limit - b.spent).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div className={cn("h-full transition-all duration-500 rounded-full", progressColor)} style={{ width: `${spentPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION: DANA GOAL FINANSIAL */}
            <div className="bg-zinc-900/40 p-5 rounded-3xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">{t("finance.danaGoal")}</h4>
                  <p className="text-[8px] text-zinc-500 mt-0.5">{t("finance.danaGoalSub")}</p>
                </div>
                <button onClick={() => setIsGoalModalOpen(true)} className="py-1.5 px-3 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-xl text-[8px] font-bold text-primary uppercase tracking-wider transition-all">
                  {t("finance.tambahGoal")}
                </button>
              </div>

              <div className="space-y-3">
                {goals.map((g) => {
                  const goalPct = Math.min((g.current / g.target) * 100, 100);
                  return (
                    <div key={g.id} className="p-3.5 bg-zinc-950/40 rounded-2xl border border-white/5 space-y-3 relative group transition-all hover:border-white/10">
                      <button onClick={() => handleDeleteGoal(g.id)} className="absolute top-3.5 right-3.5 text-zinc-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-white">{g.title}</p>
                          <div className="flex items-center gap-1 mt-1 text-[8px] text-zinc-500">
                            <Calendar className="w-3 h-3 text-zinc-600" />
                            <span>{t("finance.targetWaktu")}: {new Date(g.deadline).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { month: "short", year: "numeric" })}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-white">Rp{g.current.toLocaleString()} / Rp{g.target.toLocaleString()}</p>
                          <p className="text-[8px] text-primary mt-0.5 font-bold">{goalPct.toFixed(0)}%</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${goalPct}%` }} />
                      </div>

                      {/* AI CFO Evaluation Box */}
                      <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-2.5 flex items-start gap-2">
                        <BrainCircuit className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-[9px] text-indigo-300/90 leading-relaxed">
                          <strong className="text-indigo-200">{t("finance.aiReview")}:</strong> {g.aiReview}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "analytics" && (
          <AnalyticsDashboard 
            financeData={financeData} 
            transactions={filteredTransactions} 
            budgets={budgets} 
            t={t} 
            lang={lang} 
          />
        )}
        
        {activeTab === "history" && (
          <div className="space-y-2 animate-in fade-in duration-500">
            {filteredTransactions.length === 0 ? (
              <p className="text-[10px] text-zinc-500 italic py-8 text-center bg-zinc-900/10 rounded-2xl border border-white/5">
                {lang === "id" ? "Belum ada riwayat transaksi pada periode ini." : "No transaction history in this period."}
              </p>
            ) : (
              filteredTransactions.map((tx: any) => (
                <div key={tx.id} className="flex justify-between p-4 bg-card rounded-2xl border border-white/5 transition-all hover:border-white/10">
                  <div className="flex items-center gap-3">
                    {tx.type === "INCOME" ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
                    <div>
                      <p className="text-xs font-bold text-white">{tx.description || tx.category}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[8px] text-zinc-500 uppercase font-bold">{tx.category}</span>
                        <span className="text-[8px] text-zinc-600 font-medium">·</span>
                        <span className="text-[8px] text-zinc-500 font-medium">
                          {tx.date ? new Date(tx.date).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { day: "numeric", month: "short", year: "numeric" }) : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-white">Rp{tx.amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL TRANSAKSI */}
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAddTransaction={handleLocalAddTransaction} 
        defaultType={modalType}
        customCategories={customCategories}
        onAddCustomCategory={handleAddCustomCategory}
        onEditCustomCategory={handleEditCustomCategory}
        onDeleteCustomCategory={handleDeleteCustomCategory}
        lang={lang}
        financeData={financeData}
        isSurvival={financeData?.total_debt > 0 || (usersCore?.financial_state_id === "Survival")}
      />

      {/* MODAL ANGGARAN */}
      <AddBudgetModal 
        isOpen={isBudgetModalOpen} 
        onClose={() => setIsBudgetModalOpen(false)} 
        onAddBudget={handleAddBudget} 
        t={t}
        lang={lang}
      />

      {/* MODAL GOAL */}
      <AddGoalModal 
        isOpen={isGoalModalOpen} 
        onClose={() => setIsGoalModalOpen(false)} 
        onAddGoal={handleAddGoal} 
        t={t}
        lang={lang}
      />
    </div>
  );
}
