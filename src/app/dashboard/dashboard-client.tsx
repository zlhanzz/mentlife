"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import { sendChatMessageAction } from "@/features/dashboard/actions";
import { logoutAction } from "@/features/auth/actions";
import { AIRecommendations, DecisionProjectionResult } from "@/services/ai";
import { useApp } from "@/context/app-context";
import {
  Home, Wallet, Briefcase, MessageCircle, UserCircle,
  ChevronRight, Lock, AlertTriangle, TrendingUp, Zap,
  Battery, BatteryLow, BatteryMedium, BatteryFull, Send,
  Shield, Clock
} from "lucide-react";
import ProfileTab from "./profile-tab";
import FinanceTab from "./finance-tab";
import CareerTab from "./career-tab";
import { evaluateFinancialLadder, getCurrencyConfig, getFinancialMode, getCashflowHealth } from "@/services/financial-ladder";
import { ProfileData, FinancialProfileData, UsersCoreData } from "@/types/profile";

interface DashboardClientProps {
  profile: ProfileData;
  finance: FinancialProfileData;
  usersCore: UsersCoreData;
  aiRecs: AIRecommendations;
  initialChats: Array<{ role: "user" | "assistant"; content: string }>;
  initialProjections: Array<{ id: string; title: string; description: string; horizon_years: number; projection_output: DecisionProjectionResult }>;
  initialTransactions: Array<{ id: string; type: "INCOME" | "EXPENSE" | "ALLOCATION"; category: string; amount: number; description: string; created_at: string; date?: string }>;
  initialTasks: Array<{ id: string; title: string; due_date: string | null; completed: boolean; category: string }>;
}

export default function DashboardClient({ profile, finance, usersCore, aiRecs, initialChats, initialTransactions, initialTasks }: DashboardClientProps) {
  const { theme, setTheme, lang, setLang, t } = useApp();
  const [tab, setTab] = useState<"home" | "catat" | "karir" | "tanya" | "profil">("home");
  const [isPending, startTransition] = useTransition();
  const [vibeLevel, setVibeLevel] = useState<number>(3); // 1-5 energy scale

  const [chats, setChats] = useState(initialChats);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chats]);

  const currencyConf = getCurrencyConfig(usersCore.country_code);
  const currencySymbol = currencyConf.symbol;

  const fmtCustom = (n: number) => {
    const locale = usersCore.country_code === 'ID' ? 'id-ID' : usersCore.country_code === 'SG' ? 'en-SG' : 'en-US';
    return `${currencySymbol}${Math.abs(n).toLocaleString(locale)}`;
  };

  // Layer 2: Evaluate Financial Mode (Runway-based State Machine)
  const financialMode = getFinancialMode({
    liquidSavings: finance.liquid_savings || 0,
    emergencyFundCurrent: finance.emergency_fund_current || 0,
    fixedExpenses: finance.fixed_expenses || 0,
    monthlyIncome: finance.monthly_income || 0,
    totalDebt: finance.total_debt || 0,
    isSandwichGen: usersCore.is_sandwich_gen || false,
    maritalStatus: usersCore.marital_status || 'single',
    countryCode: usersCore.country_code || 'ID',
    investmentValue: finance.investment_value || 0,
    majorLifeGoals: usersCore.major_life_goals || [],
    ownedAssets: usersCore.owned_assets || [],
    rentByChoice: usersCore.rent_by_choice || false,
  });

  // Layer 2: Evaluate 7-step Ladder
  const ladderState = evaluateFinancialLadder({
    liquidSavings: finance.liquid_savings || 0,
    emergencyFundCurrent: finance.emergency_fund_current || 0,
    fixedExpenses: finance.fixed_expenses || 0,
    monthlyIncome: finance.monthly_income || 0,
    totalDebt: finance.total_debt || 0,
    isSandwichGen: usersCore.is_sandwich_gen || false,
    maritalStatus: usersCore.marital_status || 'single',
    countryCode: usersCore.country_code || 'ID',
    investmentValue: finance.investment_value || 0,
    majorLifeGoals: usersCore.major_life_goals || [],
    ownedAssets: usersCore.owned_assets || [],
    rentByChoice: usersCore.rent_by_choice || false,
  });

  // Layer 2: Evaluate Cashflow Health (separate from Runway)
  const cashflowHealth = getCashflowHealth({
    liquidSavings: finance.liquid_savings || 0,
    emergencyFundCurrent: finance.emergency_fund_current || 0,
    fixedExpenses: finance.fixed_expenses || 0,
    monthlyIncome: finance.monthly_income || 0,
    totalDebt: finance.total_debt || 0,
    isSandwichGen: usersCore.is_sandwich_gen || false,
    maritalStatus: usersCore.marital_status || 'single',
    countryCode: usersCore.country_code || 'ID',
    investmentValue: finance.investment_value || 0,
    majorLifeGoals: usersCore.major_life_goals || [],
    ownedAssets: usersCore.owned_assets || [],
    rentByChoice: usersCore.rent_by_choice || false,
  });

  const sisa = Math.max(0, finance.monthly_income - finance.fixed_expenses);
  const isSurvival = financialMode.isRedAlert;

  // Vibe Check: reduce missions if energy is low
  const vibeEmojis = ["😴", "😓", "😐", "😊", "🔥"];
  const activeMissionsCount = vibeLevel <= 2 ? 1 : 3;

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim(); setChatInput("");
    setChats(prev => [...prev, { role: "user", content: msg }]); setChatLoading(true);
    const res = await sendChatMessageAction(msg, chats); setChatLoading(false);
    if (res.success && res.data) setChats(prev => [...prev, { role: "assistant", content: res.data!.reply }]);
  };
  const handleLogout = () => startTransition(async () => { await logoutAction(); });

  const tabTitles: Record<string, string> = {
    home: lang === "id" ? "Beranda" : "Home",
    catat: lang === "id" ? "Keuangan" : "Finance",
    karir: lang === "id" ? "Karir" : "Career",
    tanya: lang === "id" ? "Mentor AI" : "AI Mentor",
    profil: lang === "id" ? "Profil" : "Profile",
  };

  const stepsList = [
    { level: 1, name: "Bebas Hutang (Debt Snowball)", color: "text-amber-500", bg: "bg-amber-500" },
    { level: 2, name: "Dana Darurat (Emergency Fund)", color: "text-blue-500", bg: "bg-blue-500" },
    { level: 3, name: "Investasi Konsisten 20%", color: "text-violet-500", bg: "bg-violet-500" },
    { level: 4, name: "Dana Goal Hidup Besar", color: "text-indigo-500", bg: "bg-indigo-500" },
    { level: 5, name: "Bebas KPR / Properti", color: "text-emerald-500", bg: "bg-emerald-500" },
    { level: 6, name: "Kekayaan Abadi & Warisan", color: "text-teal-500", bg: "bg-teal-500" },
  ];

  // Survival Mode Quick Cash Missions
  const survivalMissions = [
    { label: "Identifikasi 1 sumber income darurat hari ini", sub: "Jual aset, jasa cepat, atau minta bantuan", done: false, action: () => setTab("tanya") },
    { label: "Potong 1 pengeluaran variabel sekarang", sub: "Langganan tidak terpakai, hiburan, dll", done: false, action: () => setTab("catat") },
    { label: "Tanya AI: strategi bertahan hidup minggu ini", sub: "Crisis Manager mode aktif", done: initialChats.length > 0, action: () => setTab("tanya") },
  ];

  // Normal Mode Daily Missions (reduced if vibe is low)
  const normalMissions = [
    { label: lang === "id" ? "Catat semua transaksi hari ini" : "Record all today's transactions", sub: lang === "id" ? "Bantu AI menganalisis pola pengeluaranmu" : "Help AI analyze spending", done: initialTransactions.some(t => (t.created_at || t.date || "").startsWith(new Date().toISOString().split("T")[0])), action: () => setTab("catat") },
    { label: lang === "id" ? "Perbarui kondisi keuangan" : "Update financial condition", sub: lang === "id" ? "Simpanan, hutang, atau dana darurat berubah?" : "Changes in savings, debt?", done: false, action: () => setTab("catat") },
    { label: lang === "id" ? "Diskusi dengan AI Mentor" : "Chat with AI Mentor", sub: lang === "id" ? "Tanya strategi atau minta evaluasi" : "Ask for strategy or evaluation", done: initialChats.length > 0, action: () => setTab("tanya") },
  ];

  const missions = isSurvival ? survivalMissions : normalMissions.slice(0, activeMissionsCount);

  // Runway color coding
  const runwayColor = financialMode.runwayMonths < 1 ? "rose" :
    financialMode.runwayMonths < 3 ? "rose" :
    financialMode.runwayMonths < 6 ? "amber" : "emerald";
  const runwayBg = `bg-${runwayColor}-500`;
  const runwayText = `text-${runwayColor}-500`;

  // Theme-adaptive Greeting Hero styles
  const isLightTheme = theme === "theme-light";
  const heroCardBg = isLightTheme
    ? "bg-gradient-to-br from-primary/10 via-primary/5 to-card border border-primary/15"
    : "bg-gradient-to-br from-primary/20 via-card/70 to-card border border-primary/20";
  const heroCardTextDate = isLightTheme ? "text-muted-foreground/80" : "text-white/60";
  const heroCardTextTitle = isLightTheme ? "text-foreground" : "text-white";
  const heroCardBadge = isLightTheme
    ? "bg-primary/10 text-primary"
    : "bg-white/10 text-white";
  const heroCardTextDesc = isLightTheme ? "text-muted-foreground/90 font-medium" : "text-white/70";
  const heroCardDecoCircle = isLightTheme ? "bg-primary/5" : "bg-white/5";

  // Chat quick actions based on mode
  const chatQuickActions = isSurvival ? [
    "Saya butuh uang minggu ini, apa yang bisa saya lakukan?",
    "Bantu saya potong pengeluaran sekarang",
    "Apa prioritas finansial darurat saya?",
  ] : financialMode.mode === "Pertumbuhan" ? [
    "Analisis peluang Ikigai dan karir saya",
    "Bagaimana cara scaling penghasilan saya?",
    "Rekomendasikan instrumen investasi untuk saya",
  ] : [
    t("chat.q1"), t("chat.q2"), t("chat.q3")
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* SURVIVAL RED ALERT BANNER (styled with premium theme colors instead of rose red) */}
      {isSurvival && tab === "home" && (
        <div className="sticky top-0 z-30 bg-primary/10 border-b border-primary/20 backdrop-blur px-4 py-2.5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary animate-pulse shrink-0" />
          <p className="text-[11px] font-black text-primary flex-1">
            🚨 MODE SURVIVAL AKTIF — Runway {financialMode.runwayMonths.toFixed(1)} bulan
          </p>
          <button onClick={() => setTab("tanya")} className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-lg font-bold shrink-0 hover:bg-primary/30 transition-colors">
            Minta Bantuan
          </button>
        </div>
      )}

      {/* HEADER */}
      {tab !== "profil" && (
        <header className={`sticky ${isSurvival && tab === "home" ? "top-[41px]" : "top-0"} z-20 bg-card/95 backdrop-blur border-b border-border/20 px-4 py-3.5`}>
          <div className="flex items-center justify-between">
            <h1 className="text-base font-black text-foreground">{tabTitles[tab]}</h1>
            {tab === "home" && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${
                isSurvival ? "bg-primary/15 text-primary" :
                financialMode.mode === "Pertumbuhan" ? "bg-emerald-500/15 text-emerald-500" :
                financialMode.mode === "Kebebasan" ? "bg-teal-500/15 text-teal-500" :
                "bg-amber-500/15 text-amber-500"
              }`}>
                <span>{financialMode.modeLabel.split(" ")[0]}</span>
                <span>{financialMode.mode}</span>
              </div>
            )}
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto pb-24">

        {/* ===== BERANDA ===== */}
        {tab === "home" && (
          <div className="space-y-4 pb-2">

            {/* ── GREETING HERO ── */}
            <div className="mx-4 mt-4">
              <div className={`relative rounded-3xl overflow-hidden ${heroCardBg} p-5 shadow-xl ${isSurvival ? "shadow-primary/30 ring-2 ring-primary/35" : "shadow-primary/20"}`}>
                <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full ${heroCardDecoCircle}`} />
                <div className={`absolute -bottom-6 -left-4 w-24 h-24 rounded-full ${heroCardDecoCircle}`} />
                <div className="relative">
                  <p className={`text-[11px] font-semibold ${heroCardTextDate} mb-0.5`}>
                    {new Date().toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  <div className="flex items-start justify-between gap-2">
                    <h1 className={`text-xl font-black ${heroCardTextTitle}`}>
                      {isSurvival ? "⚠️ Alert" : lang === "id" ? "Halo" : "Hi"}, {profile.full_name.split(" ")[0]}! {isSurvival ? "" : "👋"}
                    </h1>
                    <div className={`flex gap-1 items-center ${heroCardBadge} px-2.5 py-1 rounded-xl text-[9px] font-black shrink-0 mt-1`}>
                      <span>Lv.{profile.level}</span>
                      <span className="opacity-40">·</span>
                      <span>{profile.xp} XP</span>
                    </div>
                  </div>
                  <p className={`text-xs ${heroCardTextDesc} mt-1.5 leading-relaxed`}>
                    {isSurvival
                      ? financialMode.modeDescription
                      : aiRecs.targetGoal}
                  </p>

                </div>
              </div>
            </div>

            {/* ── FINANCIAL PULSE ── */}
            <div className="mx-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Financial Pulse
                </p>
              </div>

              {/* Kesehatan Runway */}
              {(() => {
                const rm = financialMode.runwayMonths;
                const runwayColor = rm < 3 ? "rose" : rm < 6 ? "amber" : "emerald";
                const runwayStatus = rm < 3 ? "Kritis" : rm < 6 ? "Aman" : "Ideal";
                
                const borderClass = runwayColor === "rose" 
                  ? "border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.06)]" 
                  : runwayColor === "amber" 
                  ? "border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.06)]" 
                  : "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.06)]";

                const textClass = runwayColor === "rose" ? "text-rose-500" : runwayColor === "amber" ? "text-amber-500" : "text-emerald-500";
                const bgBadgeClass = runwayColor === "rose" ? "bg-rose-500/10" : runwayColor === "amber" ? "bg-amber-500/10" : "bg-emerald-500/10";

                return (
                  <div className={`bg-card/60 border backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between ${borderClass} transition-all duration-300 hover:scale-[1.005]`}>
                    {/* Top line: Header, Badge & Value sebaris */}
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Shield className={`w-4 h-4 ${textClass} shrink-0`} />
                          <h3 className="text-xs font-black text-foreground">Runway</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${bgBadgeClass} ${textClass}`}>
                            • {runwayStatus}
                          </span>
                        </div>
                        <span className="text-[9px] text-muted-foreground/60 mt-1 block">Bertahan tanpa income</span>
                      </div>
                      <div className="flex items-baseline shrink-0">
                        <span className={`text-base font-black leading-none ${textClass}`}>{rm.toFixed(1)}</span>
                        <span className="text-[9px] text-muted-foreground/60 ml-1 font-semibold">bln</span>
                      </div>
                    </div>

                    {/* Bottom Line: Ticks spanning full width */}
                    <div className="flex justify-between items-center w-full mt-4 text-[10px] font-black border-t border-border/10 pt-2">
                      <span className={rm < 3 ? "text-rose-500 font-extrabold" : "text-rose-500/50"}>Kritis (&lt;3)</span>
                      <span className={rm >= 3 && rm < 6 ? "text-amber-500 font-extrabold" : "text-amber-500/50"}>Aman (3-6)</span>
                      <span className={rm >= 6 ? "text-emerald-500 font-extrabold" : "text-emerald-500/50"}>Ideal (&gt;6)</span>
                    </div>
                  </div>
                );
              })()}

              {/* Kesehatan Cashflow */}
              {(() => {
                const cf = cashflowHealth;
                const savingsRate = Math.round(Math.max(0, cf.cashflowRatio) * 100);
                const cfColor = cf.color;
                const cfStatus = cfColor === "rose" ? "Beresiko" : cfColor === "amber" ? "Aman" : "Ideal";
                
                const borderClass = cfColor === "rose" 
                  ? "border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.06)]" 
                  : cfColor === "amber" 
                  ? "border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.06)]" 
                  : "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.06)]";

                const dotColor = cfColor === "rose" ? "bg-rose-500" : cfColor === "amber" ? "bg-amber-500" : "bg-emerald-500";
                const textClass = cfColor === "rose" ? "text-rose-500" : cfColor === "amber" ? "text-amber-500" : "text-emerald-500";
                const bgBadgeClass = cfColor === "rose" ? "bg-rose-500/10" : cfColor === "amber" ? "bg-amber-500/10" : "bg-emerald-500/10";
                const pct = cf.cashflowScore;

                return (
                  <div className={`bg-card/60 border backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between ${borderClass} transition-all duration-300 hover:scale-[1.005]`}>
                    {/* Top line: Header, Badge & Value sebaris */}
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <TrendingUp className={`w-4 h-4 ${textClass} shrink-0`} />
                          <h3 className="text-xs font-black text-foreground">Cashflow</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${bgBadgeClass} ${textClass}`}>
                            • {cfStatus}
                          </span>
                        </div>
                        <span className="text-[9px] text-muted-foreground/60 mt-1 block">Surplus dari income</span>
                      </div>
                      <div className="flex items-baseline shrink-0">
                        <span className={`text-base font-black leading-none ${textClass}`}>{savingsRate}%</span>
                        <span className="text-[9px] text-muted-foreground/60 ml-1 font-semibold">surplus</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-muted/20 rounded-full overflow-hidden mt-3 mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${dotColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Bottom Line: Ticks spanning full width */}
                    <div className="flex justify-between items-center w-full mt-1 text-[10px] font-black">
                      <span className={cfColor === "rose" ? "text-rose-500 font-extrabold" : "text-rose-500/50"}>Beresiko</span>
                      <span className={cfColor === "amber" ? "text-amber-500 font-extrabold" : "text-amber-500/50"}>Aman</span>
                      <span className={cfColor === "emerald" ? "text-emerald-500 font-extrabold" : "text-emerald-500/50"}>Ideal</span>
                    </div>
                  </div>
                );
              })()}

              {/* Cashflow Analysis explanation */}
              <div className="p-4 bg-card border border-border/20 rounded-2xl text-[11px] text-muted-foreground leading-relaxed shadow-sm">
                <span className="font-black text-foreground block mb-1">💡 Analisis Cashflow:</span>
                {cashflowHealth.reason}
              </div>
            </div>

            {/* ── 7 TANGGA KEUANGAN — ALWAYS VISIBLE (primary feature) ── */}
            <div className="mx-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Peta Jalan Finansial — 6 Tangga
                </p>
                <span className="text-[10px] font-bold text-primary">
                  {ladderState.level === 0 ? "Persiapan: Tangga 0" : `Tangga ${ladderState.level} / 6`}
                </span>
              </div>

              {/* ACTIVE STEP CARD — prominent */}
              <div className="rounded-2xl border-2 p-4 mb-3 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border-primary/30">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black text-base bg-primary text-primary-foreground">
                    {ladderState.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-black text-foreground">
                        {ladderState.levelName}
                      </p>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 bg-primary/15 text-primary">SEKARANG</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{ladderState.description}</p>
                  </div>
                </div>

                {/* Progress bar for current step (hidden for Tangga 0) */}
                {ladderState.targetAmount > 0 && ladderState.level > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground">Progres Tangga Ini</span>
                      <span className="text-primary">{ladderState.progressPercentage}% · {fmtCustom(ladderState.currentAmount)} / {fmtCustom(ladderState.targetAmount)}</span>
                    </div>
                    <div className="w-full h-2.5 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-primary"
                        style={{ width: `${ladderState.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Required action */}
                <div className="mt-3 p-2.5 rounded-xl text-[10px] leading-relaxed bg-background/60 text-muted-foreground border border-border/10">
                  <span className="font-black text-foreground block mb-0.5">⚡ Langkah Wajib:</span>
                  {ladderState.actionRequired}
                </div>

                {/* Survival / Tangga 0: compact crisis actions */}
                {ladderState.level === 0 ? (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setTab("karir")}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-all">
                      <Briefcase className="w-3.5 h-3.5" />
                      Mulai Cari Kerja
                    </button>
                    <button onClick={() => { setChatInput("Bagaimana cara menghasilkan uang tambahan dengan cepat dari skill saya?"); setTab("tanya"); }}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold active:scale-95 transition-all">
                      <Zap className="w-3.5 h-3.5" />
                      Cari Income Cepat
                    </button>
                  </div>
                ) : isSurvival ? (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { setChatInput("Saya butuh uang tunai minggu ini. Bantu saya buat rencana darurat berdasarkan skill dan aset yang saya punya."); setTab("tanya"); }}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-all">
                      <Zap className="w-3.5 h-3.5" />
                      Rencana Darurat
                    </button>
                    <button onClick={() => setTab("catat")}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold active:scale-95 transition-all">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Cek Cashflow
                    </button>
                  </div>
                ) : null}
              </div>

              {/* ROADMAP TRACK — semua 6 tangga terlihat */}
              <div className="bg-card border border-border/20 rounded-2xl overflow-hidden">
                {/* Tangga 0 (Income Starter) - Hanya muncul jika aktif Tangga 0 */}
                {ladderState.level === 0 && (
                  <div className="flex items-center gap-3 px-4 py-3 relative bg-primary/5 border-b border-border/8">
                    {/* Connector line down to Tangga 1 */}
                    <div className="absolute left-[29px] top-[44px] w-0.5 h-4 z-0 bg-border/20" />
                    {/* Step number circle */}
                    <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black text-[10px] bg-primary text-white ring-4 ring-primary/20">
                      0
                    </div>
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        Tangga 0: Income Starter
                      </p>
                    </div>
                    {/* Status badge */}
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">AKTIF</span>
                  </div>
                )}
                {stepsList.map(({ level, name, bg, color }, idx) => {
                  const isDone = level < ladderState.level;
                  const isCurrent = level === ladderState.level;
                  const isNext = level === ladderState.level + 1;
                  const isLocked = level > ladderState.level + 1;
                  const isLast = idx === stepsList.length - 1;
                  return (
                    <div key={level} className={`flex items-center gap-3 px-4 py-3 relative ${
                      isCurrent ? "bg-primary/5" :
                      isDone ? "opacity-75" : isLocked ? "opacity-60" : ""
                    } ${!isLast ? "border-b border-border/8" : ""}`}>
                      {/* Connector line */}
                      {!isLast && (
                        <div className={`absolute left-[29px] top-[44px] w-0.5 h-4 z-0 ${
                          isDone ? "bg-emerald-500/50" : "bg-border/20"
                        }`} />
                      )}
                      {/* Step number circle */}
                      <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black text-[10px] transition-all ${
                        isDone ? "bg-emerald-500 text-white" :
                        isCurrent ? `${bg} text-white ring-4 ring-primary/15` :
                        isNext ? "border-2 border-dashed border-primary/50 text-primary bg-primary/5" :
                        "border border-border/40 text-muted-foreground/50 bg-muted/5"
                      }`}>
                        {isDone ? "✓" : level}
                      </div>
                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${
                          isCurrent ? "text-foreground" :
                          isDone ? "text-muted-foreground/70 line-through decoration-muted-foreground/30" :
                          isNext ? "text-foreground/80 font-bold" :
                          "text-muted-foreground/60"
                        }`}>
                          {name}
                        </p>
                      </div>
                      {/* Status badge */}
                      {isCurrent && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 bg-primary/10 text-primary">AKTIF</span>
                      )}
                      {isDone && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 shrink-0">✓ Selesai</span>
                      )}
                      {isNext && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/5 text-primary/70 shrink-0 border border-primary/10">Berikutnya →</span>
                      )}
                      {isLocked && (
                        <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>



            {/* ── DAILY VIBE CHECK ── */}
            {!isSurvival && (
              <div className="mx-4">
                <div className="bg-card border border-border/20 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-black text-foreground">Daily Vibe Check</p>
                      <p className="text-[10px] text-muted-foreground">Energimu hari ini? AI akan menyesuaikan beban misi.</p>
                    </div>
                    <span className="text-2xl">{vibeEmojis[vibeLevel - 1]}</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button key={v} onClick={() => setVibeLevel(v)}
                        className={`flex-1 h-8 rounded-xl text-[11px] font-black transition-all ${vibeLevel === v
                          ? v <= 2 ? "bg-rose-500 text-white" : v === 3 ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                          : "bg-muted/40 text-muted-foreground"
                        }`}>
                        {v}
                      </button>
                    ))}
                  </div>
                  {vibeLevel <= 2 && (
                    <p className="text-[10px] text-rose-400 mt-2 font-semibold">
                      ⚠️ Energi rendah terdeteksi — misi harian dikurangi jadi 1 tugas saja.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── MISI HARIAN ── */}
            <div className="mx-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {isSurvival ? "🚨 Misi Prioritas Darurat" : lang === "id" ? `Misi Harian (${activeMissionsCount} Tugas)` : "Daily Missions"}
                </p>
                {vibeLevel <= 2 && !isSurvival && (
                  <span className="text-[9px] text-rose-400 font-bold">Mode Hemat Energi</span>
                )}
              </div>
              <div className="bg-card border border-border/20 rounded-2xl overflow-hidden divide-y divide-border/10">
                {missions.map((mission, i) => (
                  <button key={i} onClick={mission.action}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 active:bg-muted/30 transition-colors text-left">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${mission.done ? "bg-emerald-500 border-emerald-500" : "border-border/50"}`}>
                      {mission.done && <span className="text-[10px] text-white font-black">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${mission.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{mission.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{mission.sub}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* ── AI INSIGHT — hidden in Survival Mode (replaced by Crisis Panel) ── */}
            {!isSurvival && (
              <div className="mx-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                  {lang === "id" ? "Insight AI Hari Ini" : "Today's AI Insight"}
                </p>
                <div className="bg-gradient-to-br from-violet-500/10 to-primary/5 border border-violet-500/20 rounded-2xl p-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageCircle className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-foreground mb-1">MentLife AI</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{aiRecs.advice}</p>
                      <p className="text-[10px] text-violet-400 font-semibold mt-2 italic">"{aiRecs.dailyInsight}"</p>
                      <button onClick={() => setTab("tanya")}
                        className="mt-3 text-[10px] font-bold text-violet-400 flex items-center gap-1 hover:text-violet-300 transition-colors">
                        {lang === "id" ? "Tanya lebih lanjut" : "Ask more"} <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── REKOMENDASI IKIGAI — only in Stabilitas/Pertumbuhan/Kebebasan ── */}
            {!isSurvival && !financialMode.lockedFeatures.includes("investment_module") && aiRecs.sideHustles?.length > 0 && (
              <div className="mx-4 pb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                  {lang === "id" ? "Rekomendasi Ikigai-mu" : "Your Ikigai Recommendations"}
                </p>
                <div className="space-y-2">
                  {aiRecs.sideHustles.slice(0, 2).map((sh, i) => (
                    <div key={i} className="bg-card border border-border/20 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-bold text-foreground flex-1">{sh.title}</p>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${sh.difficulty === "Mudah" ? "bg-emerald-500/10 text-emerald-500" : sh.difficulty === "Sedang" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"}`}>{sh.difficulty}</span>
                          <span className="text-[9px] font-bold text-primary">Ikigai {sh.ikigaiMatch}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-emerald-500 font-bold mb-1.5">{sh.estimatedIncome}/bulan</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{sh.description}</p>
                      {sh.ikigaiAnalysis && (
                        <div className="mt-2 pt-2 border-t border-border/10">
                          <p className="text-[10px] text-primary/70 italic">{sh.ikigaiAnalysis}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ===== CATAT ===== */}
        {tab === "catat" && (
          <FinanceTab
            initialTransactions={initialTransactions}
            monthlyIncome={finance.monthly_income}
            fixedExpenses={finance.fixed_expenses}
            totalDebt={finance.total_debt}
            debtDetails={finance.debt_details || ""}
            emergencyFundCurrent={finance.emergency_fund_current}
            emergencyFundTarget={finance.emergency_fund_target}
            liquidSavings={finance.liquid_savings}
            investmentValue={finance.investment_value}
            usersCore={usersCore}
            financialMode={financialMode}
          />
        )}

        {/* ===== KARIR ===== */}
        {tab === "karir" && (
          <CareerTab
            profile={profile}
            aiRecs={aiRecs}
            initialTasks={initialTasks}
            usersCore={usersCore}
            ladderLevel={ladderState.level}
          />
        )}

        {/* ===== TANYA AI ===== */}
        {tab === "tanya" && (
          <div className="flex flex-col h-[calc(100vh-128px)]">
            <div className="px-4 pt-4 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-foreground">
                    {isSurvival ? "🚨 Mode Krisis — Manajer Darurat" : t("chat.title")}
                  </h2>
                  <p className="text-[10px] text-muted-foreground">
                    {isSurvival ? `Runway: ${financialMode.runwayMonths.toFixed(1)} bulan · Fokus cashflow darurat` : t("chat.subtitle")}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
              {chats.length === 0 && (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-primary/10">
                    <MessageCircle className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {isSurvival ? "Apa situasi darurat keuanganmu?" : t("chat.greeting")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isSurvival ? "Ceritakan kondisimu, AI akan langsung buat rencana taktis." : t("chat.greeting.sub")}
                  </p>
                  <div className="mt-4 space-y-2">
                    {chatQuickActions.map(q => (
                      <button key={q} onClick={() => setChatInput(q)}
                        className="block w-full text-left text-xs bg-muted/40 hover:bg-muted/70 border border-border/30 rounded-xl px-3 py-2.5 transition-colors">
                        <Send className="w-3 h-3 inline mr-1.5 text-primary" />{q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chats.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border border-border/30 text-foreground rounded-tl-none"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && <div className="flex justify-start"><div className="bg-card border border-border/30 px-4 py-3 rounded-2xl rounded-tl-none text-xs text-muted-foreground italic animate-pulse">{t("chat.typing")}</div></div>}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendChat} className="px-4 py-3 border-t border-border/20 flex gap-2 shrink-0">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder={isSurvival ? "Ceritakan situasimu sekarang..." : t("chat.placeholder")}
                disabled={chatLoading}
                className="flex-1 h-11 px-4 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary" />
              <button type="submit" disabled={chatLoading || !chatInput.trim()}
                className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">
                <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* ===== PROFIL ===== */}
        {tab === "profil" && (
          <ProfileTab
            profile={profile}
            finance={finance}
            usersCore={usersCore}
            extendedProfile={{}}
          />
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 max-w-md mx-auto bg-card/95 backdrop-blur border-t border-border/20 px-1 py-2 flex justify-around z-20">
        {([
          { id: "home", Icon: Home, label: lang === "id" ? "Beranda" : "Home" },
          { id: "catat", Icon: Wallet, label: lang === "id" ? "Keuangan" : "Finance" },
          { id: "karir", Icon: Briefcase, label: lang === "id" ? "Karir" : "Career" },
          { id: "tanya", Icon: MessageCircle, label: "Mentor" },
          { id: "profil", Icon: UserCircle, label: lang === "id" ? "Profil" : "Profile" },
        ] as const).map(({ id, Icon, label }) => (
          <button key={id} onClick={() => setTab(id as any)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative ${tab === id ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-semibold">{label}</span>
            {id === "tanya" && isSurvival && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
