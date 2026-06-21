"use client";
import { useState, useTransition, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import HomeTab from "./HomeTab";
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
import SupabaseHealthCheck from "@/components/supabase-health-check";
import SupabaseConnectionStatus from "@/components/supabase-connection-status";
import LocaleSwitcher from "@/components/locale-switcher";

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
  const { theme, setTheme, lang, setLang } = useApp();
  const tDash = useTranslations("dashboard");
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

  // Layer 2: Memoized financial calculations (prevents re-computation on every render)
  const financialDetails = useMemo(() => ({
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
  }), [finance.liquid_savings, finance.emergency_fund_current, finance.fixed_expenses, finance.monthly_income, finance.total_debt, finance.investment_value, usersCore.is_sandwich_gen, usersCore.marital_status, usersCore.country_code, usersCore.major_life_goals, usersCore.owned_assets, usersCore.rent_by_choice]);

  const financialMode = useMemo(() => getFinancialMode(financialDetails), [financialDetails]);
  const ladderState = useMemo(() => evaluateFinancialLadder(financialDetails), [financialDetails]);
  const cashflowHealth = useMemo(() => getCashflowHealth(financialDetails), [financialDetails]);

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

  // Survival Mode Quick Cash Missions
  const survivalMissions = [
    { label: "Identifikasi 1 sumber income darurat hari ini", sub: "Jual aset, jasa cepat, atau minta bantuan", done: false, action: () => setTab("tanya") },
    { label: "Potong 1 pengeluaran variabel sekarang", sub: "Langganan tidak terpakai, hiburan, dll", done: false, action: () => setTab("catat") },
    { label: "Tanya AI: strategi bertahan hidup minggu ini", sub: "Crisis Manager mode aktif", done: initialChats.length > 0, action: () => setTab("tanya") },
  ];

  // Normal Mode Daily Missions (reduced if vibe is low)
  const normalMissions = [
    { label: tDash("missions.recordToday"), sub: tDash("missions.recordTodaySub"), done: initialTransactions.some(t => (t.created_at || t.date || "").startsWith(new Date().toISOString().split("T")[0])), action: () => setTab("catat") },
    { label: tDash("missions.updateFinance"), sub: tDash("missions.updateFinanceSub"), done: false, action: () => setTab("catat") },
    { label: tDash("missions.chatAI"), sub: tDash("missions.chatAISub"), done: initialChats.length > 0, action: () => setTab("tanya") },
  ];

  const missions = isSurvival ? survivalMissions : normalMissions.slice(0, activeMissionsCount);

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
    tDash("chat.q1"), tDash("chat.q2"), tDash("chat.q3")
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
            <div className="flex items-center gap-2">
              <LocaleSwitcher />
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
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto pb-24">

        {/* ===== BERANDA ===== */}
        {tab === "home" && (
          <HomeTab
            profile={profile}
            finance={finance}
            usersCore={usersCore}
            aiRecs={aiRecs}
            financialMode={financialMode}
            ladderState={ladderState}
            cashflowHealth={cashflowHealth}
            isSurvival={isSurvival}
            vibeLevel={vibeLevel}
            setVibeLevel={setVibeLevel}
            activeMissionsCount={activeMissionsCount}
            missions={missions}
            setTab={setTab}
            chatInput={chatInput}
            setChatInput={setChatInput}
            fmtCustom={fmtCustom}
            heroCardBg={heroCardBg}
            heroCardTextDate={heroCardTextDate}
            heroCardTextTitle={heroCardTextTitle}
            heroCardBadge={heroCardBadge}
            heroCardTextDesc={heroCardTextDesc}
            heroCardDecoCircle={heroCardDecoCircle}
            initialChatsCount={initialChats.length}
            initialTransactionsHasToday={initialTransactions.some(t => (t.created_at || t.date || "").startsWith(new Date().toISOString().split("T")[0]))}
          />
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
                    {isSurvival ? "🚨 Mode Krisis — Manajer Darurat" : tDash("chat.title")}
                  </h2>
                  <p className="text-[10px] text-muted-foreground">
                    {isSurvival ? `Runway: ${financialMode.runwayMonths.toFixed(1)} bulan · Fokus cashflow darurat` : tDash("chat.subtitle")}
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
                    {isSurvival ? "Apa situasi darurat keuanganmu?" : tDash("chat.greeting")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isSurvival ? "Ceritakan kondisimu, AI akan langsung buat rencana taktis." : tDash("chat.greetingSub")}
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
              {chats.map((msg, i) => {
                // Parser Markdown sederhana untuk menangani cetak tebal (**) & garis baru
                const renderFormattedContent = (text: string) => {
                  if (msg.role === "user") return text;
                  
                  const parts = text.split(/(\*\*[^*]+\*\*)/g);
                  return parts.map((part, index) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return <strong key={index} className="font-extrabold text-white underline decoration-primary/40">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  });
                };

                return (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border border-border/30 text-zinc-200 rounded-tl-none font-medium"}`}>
                      {renderFormattedContent(msg.content)}
                    </div>
                  </div>
                );
              })}
              {chatLoading && <div className="flex justify-start"><div className="bg-card border border-border/30 px-4 py-3 rounded-2xl rounded-tl-none text-xs text-muted-foreground italic animate-pulse">{tDash("chat.typing")}</div></div>}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendChat} className="px-4 py-3 border-t border-border/20 flex gap-2 shrink-0">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder={isSurvival ? "Ceritakan situasimu sekarang..." : tDash("chat.placeholder")}
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

      {/* Supabase Connection Status */}
      <div className="px-4 py-2">
        <SupabaseConnectionStatus />
      </div>
    </div>
  );
}
