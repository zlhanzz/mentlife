"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { 
  TrendingUp, Shield, AlertTriangle, LineChart, Target, Plus, X 
} from "lucide-react";

const colorMaps = {
  primary: {
    bg: "bg-primary/10 text-primary border-primary/20",
    selected: "bg-primary/15 text-primary border-primary/30 shadow-primary/5",
    hover: "hover:border-primary/40",
    gradient: "from-primary/15 to-primary/5",
    borderActive: "focus:border-primary focus:ring-primary/25",
    buttonBg: "bg-primary text-primary-foreground",
    text: "text-primary"
  },
  emerald: {
    bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    selected: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30 shadow-emerald-500/5",
    hover: "hover:border-emerald-500/40",
    gradient: "from-emerald-500/15 to-emerald-500/5",
    borderActive: "focus:border-emerald-500 focus:ring-emerald-500/25",
    buttonBg: "bg-emerald-500 text-white",
    text: "text-emerald-500"
  },
  amber: {
    bg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    selected: "bg-amber-500/15 text-amber-500 border-amber-500/30 shadow-amber-500/5",
    hover: "hover:border-amber-500/40",
    gradient: "from-amber-500/15 to-amber-500/5",
    borderActive: "focus:border-amber-500 focus:ring-amber-500/25",
    buttonBg: "bg-amber-500 text-white",
    text: "text-amber-500"
  },
  sky: {
    bg: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    selected: "bg-sky-500/15 text-sky-500 border-sky-500/30 shadow-sky-500/5",
    hover: "hover:border-sky-500/40",
    gradient: "from-sky-500/15 to-sky-500/5",
    borderActive: "focus:border-sky-500 focus:ring-sky-500/25",
    buttonBg: "bg-sky-500 text-white",
    text: "text-sky-500"
  },
  indigo: {
    bg: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    selected: "bg-indigo-500/15 text-indigo-500 border-indigo-500/30 shadow-indigo-500/5",
    hover: "hover:border-indigo-500/40",
    gradient: "from-indigo-500/15 to-indigo-500/5",
    borderActive: "focus:border-indigo-500 focus:ring-indigo-500/25",
    buttonBg: "bg-indigo-500 text-white",
    text: "text-indigo-500"
  },
  rose: {
    bg: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    selected: "bg-rose-500/15 text-rose-500 border-rose-500/30 shadow-rose-500/5",
    hover: "hover:border-rose-500/40",
    gradient: "from-rose-500/15 to-rose-500/5",
    borderActive: "focus:border-rose-500 focus:ring-rose-500/25",
    buttonBg: "bg-rose-500 text-white",
    text: "text-rose-500"
  },
  violet: {
    bg: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    selected: "bg-violet-500/15 text-violet-500 border-violet-500/30 shadow-violet-500/5",
    hover: "hover:border-violet-500/40",
    gradient: "from-violet-500/15 to-violet-500/5",
    borderActive: "focus:border-violet-500 focus:ring-violet-500/25",
    buttonBg: "bg-violet-500 text-white",
    text: "text-violet-500"
  }
};

// Reusable Finance Section Card
interface FinanceSectionProps {
  title: string;
  icon: any;
  colorClass: keyof typeof colorMaps;
  children: React.ReactNode;
}

export function FinanceSection({
  title,
  icon: Icon,
  colorClass,
  children
}: FinanceSectionProps) {
  const colors = colorMaps[colorClass];

  return (
    <div className="bg-card/45 backdrop-blur-md border border-border/20 rounded-3xl p-5 space-y-4 hover:border-border/40 transition-all duration-300 shadow-md">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-border/10">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center ${colors.text} border border-border/10`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-black text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// Reusable Rupiah Number Input with automatic separator
interface RupiahInputProps {
  label: string;
  value: string; // Raw numerical string
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function RupiahInput({
  label,
  value,
  onChange,
  placeholder = "0",
  required = false
}: RupiahInputProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric digits
    const rawVal = e.target.value.replace(/\D/g, "");
    onChange(rawVal);
  };

  const displayValue = value ? new Intl.NumberFormat("id-ID").format(Number(value)) : "";

  return (
    <div className="space-y-1.5 flex-1 min-w-[200px]">
      <label className="text-xs font-bold text-muted-foreground block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-xs font-extrabold text-muted-foreground/60 select-none">Rp</span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleTextChange}
          placeholder={placeholder}
          className="w-full h-11 pl-9 pr-3.5 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary transition-colors font-medium placeholder:text-muted-foreground/45"
        />
      </div>
    </div>
  );
}

// Reusable Interactive Chips with optional custom tag input
interface InteractiveChipsProps {
  label?: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  colorClass: keyof typeof colorMaps;
  isMulti?: boolean;
  customPlaceholder?: string;
}

export function InteractiveChips({
  label,
  options,
  selected,
  onToggle,
  colorClass,
  isMulti = true,
  customPlaceholder
}: InteractiveChipsProps) {
  const [customInput, setCustomInput] = useState("");
  const colors = colorMaps[colorClass];

  const allOptions = Array.from(new Set([...options, ...selected]));

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onToggle(trimmed);
      setCustomInput("");
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-bold text-muted-foreground block">{label}</label>}
      
      <div className="flex flex-wrap gap-2">
        {allOptions.map(option => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`text-xs px-3.5 py-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? `${colors.selected} font-bold`
                  : `border-border/30 text-muted-foreground bg-background/35 hover:bg-background/80 ${colors.hover}`
              }`}
            >
              <span>{option}</span>
              {isSelected && isMulti && (
                <span className="opacity-80 hover:opacity-100">
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {customPlaceholder && (
        <form onSubmit={handleAddCustom} className="flex gap-2 max-w-sm pt-1">
          <input
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            placeholder={customPlaceholder}
            className={`flex-1 h-9 px-3 rounded-xl border border-border/50 bg-background/40 text-xs focus:outline-none ${colors.borderActive} transition-all placeholder:text-muted-foreground/60`}
          />
          <button
            type="submit"
            className={`h-9 w-9 ${colors.buttonBg} rounded-xl flex items-center justify-center hover:opacity-95 active:scale-95 transition-all shadow-sm`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}


// Reusable Toggle Switch Component
interface ToggleRowProps {
  label: string;
  subtitle?: string;
  value: boolean;
  onChange: (val: boolean) => void;
}

export function ToggleRow({
  label,
  subtitle,
  value,
  onChange
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between p-3.5 border border-border/20 rounded-2xl bg-background/40 hover:border-border/30 transition-colors">
      <div className="pr-4">
        <p className="text-xs font-bold text-foreground">{label}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 focus:outline-none ${value ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

interface FinanceProfileTabProps {
  // Cashflow
  income: string;
  setIncome: (val: string) => void;
  expenses: string;
  setExpenses: (val: string) => void;

  // Liquid Assets
  liquidSavings: string;
  setLiquidSavings: (val: string) => void;
  otherAssets: string;
  setOtherAssets: (val: string) => void;

  // Debt
  hasDebt: boolean;
  setHasDebt: (val: boolean) => void;
  debtHighInterest: string;
  setDebtHighInterest: (val: string) => void;
  debtProductive: string;
  setDebtProductive: (val: string) => void;
  debtZeroInterest: string;
  setDebtZeroInterest: (val: string) => void;

  // Investment
  hasInvestments: boolean;
  setHasInvestments: (val: boolean) => void;
  investmentValue: string;
  setInvestmentValue: (val: string) => void;
  investmentInstruments: string[];
  setInvestmentInstruments: React.Dispatch<React.SetStateAction<string[]>>;

  // Risk Profile
  riskProfile: "konservatif" | "moderat" | "agresif";
  setRiskProfile: (val: "konservatif" | "moderat" | "agresif") => void;
}

export default function FinanceProfileTab({
  income,
  setIncome,
  expenses,
  setExpenses,

  liquidSavings,
  setLiquidSavings,
  otherAssets,
  setOtherAssets,

  hasDebt,
  setHasDebt,
  debtHighInterest,
  setDebtHighInterest,
  debtProductive,
  setDebtProductive,
  debtZeroInterest,
  setDebtZeroInterest,

  hasInvestments,
  setHasInvestments,
  investmentValue,
  setInvestmentValue,
  investmentInstruments,
  setInvestmentInstruments,

  riskProfile,
  setRiskProfile
}: FinanceProfileTabProps) {

  const { lang } = useApp();

  // Multi-select toggle helpers
  const toggleMultiSelect = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setList(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  // Static options
  const defaultInstruments = lang === "id"
    ? ["Saham", "Reksadana", "Emas", "Kripto", "Properti", "SBN/Obligasi"]
    : ["Stocks", "Mutual Funds", "Gold", "Crypto", "Property", "Bonds/Government Securities"];

  return (
    <div className="space-y-6">
      {/* 1. Cashflow & Runway */}
      <FinanceSection title="Cashflow & Runway" icon={TrendingUp} colorClass="primary">
        <div className="flex flex-wrap gap-4">
          <RupiahInput
            label={lang === "id" ? "Rata-rata Pemasukan Bulanan (Rp)" : "Average Monthly Income (Rp)"}
            value={income}
            onChange={setIncome}
            required
          />
          <RupiahInput
            label={lang === "id" ? "Pengeluaran Wajib/Dasar Bulanan (Rp)" : "Fixed/Basic Monthly Expenses (Rp)"}
            value={expenses}
            onChange={setExpenses}
            required
          />
        </div>
      </FinanceSection>

      {/* 2. Liquid Assets (Safety Net) */}
      <FinanceSection 
        title={lang === "id" ? "Aset Likuid (Jaring Pengaman)" : "Liquid Assets (Safety Net)"} 
        icon={Shield} 
        colorClass="emerald"
      >
        <div className="flex flex-wrap gap-4">
          <RupiahInput
            label={lang === "id" ? "Total Tabungan Tunai / Likuid (Rp)" : "Total Cash / Liquid Savings (Rp)"}
            value={liquidSavings}
            onChange={setLiquidSavings}
          />
          <RupiahInput
            label={lang === "id" ? "Aset Lancar Lainnya (Opsional)" : "Other Current Assets (Optional)"}
            value={otherAssets}
            onChange={setOtherAssets}
          />
        </div>
      </FinanceSection>

      {/* 3. Utang (Debt) */}
      <FinanceSection title={lang === "id" ? "Utang" : "Debt"} icon={AlertTriangle} colorClass="rose">
        <ToggleRow
          label={lang === "id" ? "Apakah kamu memiliki utang/cicilan aktif?" : "Do you have active debt/installments?"}
          subtitle={
            lang === "id" 
              ? "Aktifkan untuk merinci cicilan aktif agar AI dapat memetakan risiko finansialmu." 
              : "Enable to detail active installments so AI can map your financial risk."
          }
          value={hasDebt}
          onChange={setHasDebt}
        />
        
        {hasDebt && (
          <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <RupiahInput
                label={lang === "id" ? "Utang Berbunga Tinggi" : "High-Interest Debt"}
                placeholder={lang === "id" ? "Pinjol/CC/Paylater" : "Paylater/CC/Online Loan"}
                value={debtHighInterest}
                onChange={setDebtHighInterest}
              />
              <RupiahInput
                label={lang === "id" ? "Utang Aset / Produktif" : "Asset / Productive Debt"}
                placeholder={lang === "id" ? "KPR/Kendaraan/Bisnis" : "Mortgage/Vehicle/Business Loan"}
                value={debtProductive}
                onChange={setDebtProductive}
              />
              <RupiahInput
                label={lang === "id" ? "Utang Tanpa Bunga" : "Interest-Free Debt"}
                placeholder={lang === "id" ? "Keluarga/Teman" : "Family/Friends"}
                value={debtZeroInterest}
                onChange={setDebtZeroInterest}
              />
            </div>
          </div>
        )}
      </FinanceSection>

      {/* 4. Portofolio Investasi */}
      <FinanceSection 
        title={lang === "id" ? "Portofolio Investasi" : "Investment Portfolio"} 
        icon={LineChart} 
        colorClass="violet"
      >
        <ToggleRow
          label={lang === "id" ? "Apakah saat ini kamu sudah memiliki portofolio investasi atau simpanan aset masa depan?" : "Do you currently have an investment portfolio or future asset savings?"}
          subtitle={
            lang === "id" 
              ? "AI mendeteksi fase kemakmuranmu berdasarkan alokasi pertahanan vs investasi." 
              : "AI detects your prosperity phase based on defense vs investment allocation."
          }
          value={hasInvestments}
          onChange={setHasInvestments}
        />

        {hasInvestments && (
          <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-wrap gap-4">
              <RupiahInput
                label={lang === "id" ? "Total Estimasi Nilai Investasi (Rp)" : "Total Estimated Investment Value (Rp)"}
                placeholder={lang === "id" ? "Total seluruh aset investasi" : "Total of all investment assets"}
                value={investmentValue}
                onChange={setInvestmentValue}
              />
            </div>
            
            <InteractiveChips
              label={lang === "id" ? "Instrumen yang Dimiliki" : "Owned Instruments"}
              options={defaultInstruments}
              selected={investmentInstruments}
              onToggle={item => toggleMultiSelect(investmentInstruments, setInvestmentInstruments, item)}
              colorClass="violet"
              customPlaceholder={lang === "id" ? "Tambah instrumen kustom..." : "Add custom instrument..."}
            />
          </div>
        )}
      </FinanceSection>

      {/* 5. Profil Risiko */}
      <FinanceSection title={lang === "id" ? "Profil Risiko" : "Risk Profile"} icon={Target} colorClass="amber">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground block">
            {lang === "id" ? "Profil Risiko Investasi" : "Investment Risk Profile"}
          </label>
          <select
            value={riskProfile}
            onChange={(e) => setRiskProfile(e.target.value as any)}
            className="w-full h-11 px-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary transition-colors font-medium"
          >
            <option value="konservatif">
              {lang === "id" ? "Konservatif (Aman)" : "Conservative (Safe)"}
            </option>
            <option value="moderat">
              {lang === "id" ? "Moderat (Seimbang)" : "Moderate (Balanced)"}
            </option>
            <option value="agresif">
              {lang === "id" ? "Agresif (High-Risk)" : "Aggressive (High-Risk)"}
            </option>
          </select>
        </div>
      </FinanceSection>
    </div>
  );
}
