"use client";

import { memo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useApp } from "@/context/app-context";
import {
  Home, Wallet, Briefcase, MessageCircle, UserCircle,
  ChevronRight, Lock, AlertTriangle, TrendingUp, Zap,
  Battery, BatteryLow, BatteryMedium, BatteryFull, Send,
  Shield, Clock
} from "lucide-react";
import { FinancialLadderState, FinancialModeState, CashflowHealthState } from "@/services/financial-ladder";
import { AIRecommendations } from "@/services/ai";
import { ProfileData, FinancialProfileData, UsersCoreData } from "@/types/profile";

interface HomeTabProps {
  profile: ProfileData;
  finance: FinancialProfileData;
  usersCore: UsersCoreData;
  aiRecs: AIRecommendations;
  financialMode: FinancialModeState;
  ladderState: FinancialLadderState;
  cashflowHealth: CashflowHealthState;
  isSurvival: boolean;
  vibeLevel: number;
  setVibeLevel: (v: number) => void;
  activeMissionsCount: number;
  missions: Array<{ label: string; sub: string; done: boolean; action: () => void }>;
  setTab: (t: any) => void;
  chatInput: string;
  setChatInput: (s: string) => void;
  fmtCustom: (n: number) => string;
  heroCardBg: string;
  heroCardTextDate: string;
  heroCardTextTitle: string;
  heroCardBadge: string;
  heroCardTextDesc: string;
  heroCardDecoCircle: string;
  initialChatsCount: number;
  initialTransactionsHasToday: boolean;
}

function HomeTab({
  profile, finance, usersCore, aiRecs, financialMode, ladderState, cashflowHealth,
  isSurvival, vibeLevel, setVibeLevel, activeMissionsCount, missions,
  setTab, chatInput, setChatInput, fmtCustom,
  heroCardBg, heroCardTextDate, heroCardTextTitle, heroCardBadge, heroCardTextDesc, heroCardDecoCircle,
  initialChatsCount, initialTransactionsHasToday,
}: HomeTabProps) {
  const { lang } = useApp();
  const tDash = useTranslations("dashboard");
  const locale = useLocale();

  const vibeEmojis = ["😴", "😓", "😐", "😊", "🔥"];

  const stepsList = [
    { level: 1, name: "Bebas Hutang (Debt Snowball)", color: "text-amber-500", bg: "bg-amber-500" },
    { level: 2, name: "Dana Darurat (Emergency Fund)", color: "text-blue-500", bg: "bg-blue-500" },
    { level: 3, name: "Investasi Konsisten 20%", color: "text-violet-500", bg: "bg-violet-500" },
    { level: 4, name: "Dana Goal Hidup Besar", color: "text-indigo-500", bg: "bg-indigo-500" },
    { level: 5, name: "Bebas KPR / Properti", color: "text-emerald-500", bg: "bg-emerald-500" },
    { level: 6, name: "Kekayaan Abadi & Warisan", color: "text-teal-500", bg: "bg-teal-500" },
  ];

  return (
    <div className="space-y-4 pb-2">

      {/* ── GREETING HERO ── */}
      <div className="mx-4 mt-4">
        <div className={`relative rounded-3xl overflow-hidden ${heroCardBg} p-5 shadow-xl ${isSurvival ? "shadow-primary/30 ring-2 ring-primary/35" : "shadow-primary/20"}`}>
          <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full ${heroCardDecoCircle}`} />
          <div className={`absolute -bottom-6 -left-4 w-24 h-24 rounded-full ${heroCardDecoCircle}`} />
          <div className="relative">
            <p className={`text-[11px] font-semibold ${heroCardTextDate} mb-0.5`}>
              {new Date().toLocaleDateString(locale === "id" ? "id-ID" : locale === "ar" ? "ar-SA" : locale === "jp" ? "ja-JP" : locale === "kr" ? "ko-KR" : locale === "ms" ? "ms-MY" : "en-US", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <div className="flex items-start justify-between gap-2">
              <h1 className={`text-xl font-black ${heroCardTextTitle}`}>
                {isSurvival ? "⚠️ Alert" : tDash("home.greeting").split(" ")[0]}, {profile.full_name.split(" ")[0]}! {isSurvival ? "" : "👋"}
              </h1>
              <div className={`flex gap-1 items-center ${heroCardBadge} px-2.5 py-1 rounded-xl text-[9px] font-black shrink-0 mt-1`}>
                <span>Lv.{profile.level}</span>
                <span className="opacity-40">·</span>
                <span>{profile.xp} XP</span>
              </div>
            </div>
            <p className={`text-xs ${heroCardTextDesc} mt-1.5 leading-relaxed`}>
              {isSurvival ? financialMode.modeDescription : aiRecs.targetGoal}
            </p>
          </div>
        </div>
      </div>

      {/* ── AI UNDERSTANDING & KNOWLEDGE INDICATOR ── */}
      {(() => {
        let score = 0;
        const maxScore = 150;
        if (profile.full_name?.trim()) score += 10;
        if (usersCore.display_name?.trim()) score += 10;
        if (usersCore.birth_date) score += 10;
        if (usersCore.gender) score += 10;
        if (usersCore.domicile?.trim()) score += 10;
        if (usersCore.living_situation) score += 10;
        if (usersCore.marital_status) score += 10;
        if (usersCore.dependents_count >= 0) score += 10;
        if (usersCore.life_goal?.trim() || profile.life_goal?.trim()) score += 10;
        if (profile.background?.trim()) score += 10;
        if (profile.skills && profile.skills.length > 0) score += 10;
        if (profile.hobbies && profile.hobbies.length > 0) score += 10;
        if (finance.liquid_savings > 0) score += 10;
        if (finance.investment_value > 0) score += 10;
        if (finance.emergency_fund_current > 0) score += 10;
        const finalScore = Math.min(Math.round((score / maxScore) * 100), 100);

        const getColor = (s: number) => s < 30 ? "text-rose-500" : s < 60 ? "text-amber-500" : s < 80 ? "text-emerald-500" : "text-emerald-600";
        const getBgColor = (s: number) => s < 30 ? "bg-rose-500" : s < 60 ? "bg-amber-500" : s < 80 ? "bg-emerald-500" : "bg-emerald-600";
        const getLabel = (s: number) => s < 30 ? tDash("home.completeness.needsCompletion") : s < 60 ? tDash("home.completeness.moderatelyComplete") : s < 80 ? tDash("home.completeness.veryComplete") : tDash("home.completeness.perfect");

        return (
          <div className="mx-4 bg-card/40 backdrop-blur border border-border/20 rounded-2xl p-3.5 shadow-sm hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-foreground">
                    {tDash("home.aiUnderstanding")}
                  </p>
                  <p className="text-[9px] text-muted-foreground leading-none">{getLabel(finalScore)}</p>
                </div>
              </div>
              <span className={`text-sm font-black ${getColor(finalScore)}`}>{finalScore}%</span>
            </div>
            <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden mt-2.5">
              <div className={`h-full rounded-full transition-all duration-500 ${getBgColor(finalScore)}`} style={{ width: `${finalScore}%` }} />
            </div>
            {finalScore < 70 && (
              <div className="mt-2.5 flex justify-between items-center bg-primary/5 rounded-xl p-2 border border-primary/10">
                <p className="text-[9px] text-muted-foreground">
                  {tDash("home.completeProfile")}
                </p>
                <button onClick={() => setTab("profil")} className="text-[9px] font-bold text-primary bg-primary/15 px-2 py-0.5 rounded hover:bg-primary/25 transition-colors">
                  {tDash("home.complete")}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── FINANCIAL PULSE ── */}
      <div className="mx-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Financial Pulse</p>
        </div>

        {/* Runway Health */}
        {(() => {
          const rm = financialMode.runwayMonths;
          const runwayColor = rm < 3 ? "rose" : rm < 6 ? "amber" : "emerald";
          const runwayStatus = rm < 3 ? "Kritis" : rm < 6 ? "Aman" : "Ideal";
          const borderClass = runwayColor === "rose" ? "border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.06)]" : runwayColor === "amber" ? "border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.06)]" : "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.06)]";
          const textClass = runwayColor === "rose" ? "text-rose-500" : runwayColor === "amber" ? "text-amber-500" : "text-emerald-500";
          const bgBadgeClass = runwayColor === "rose" ? "bg-rose-500/10" : runwayColor === "amber" ? "bg-amber-500/10" : "bg-emerald-500/10";

          return (
            <div className={`bg-card/60 border backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between ${borderClass} transition-all duration-300 hover:scale-[1.005]`}>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${textClass} shrink-0`} />
                    <h3 className="text-xs font-black text-foreground">Runway</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${bgBadgeClass} ${textClass}`}>• {runwayStatus}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground/60 mt-1 block">Bertahan tanpa income</span>
                </div>
                <div className="flex items-baseline shrink-0">
                  <span className={`text-base font-black leading-none ${textClass}`}>{rm.toFixed(1)}</span>
                  <span className="text-[9px] text-muted-foreground/60 ml-1 font-semibold">bln</span>
                </div>
              </div>
              <div className="flex justify-between items-center w-full mt-4 text-[10px] font-black border-t border-border/10 pt-2">
                <span className={rm < 3 ? "text-rose-500 font-extrabold" : "text-rose-500/50"}>Kritis (&lt;3)</span>
                <span className={rm >= 3 && rm < 6 ? "text-amber-500 font-extrabold" : "text-amber-500/50"}>Aman (3-6)</span>
                <span className={rm >= 6 ? "text-emerald-500 font-extrabold" : "text-emerald-500/50"}>Ideal (&gt;6)</span>
              </div>
            </div>
          );
        })()}

        {/* Cashflow Health */}
        {(() => {
          const cf = cashflowHealth;
          const savingsRate = Math.round(Math.max(0, cf.cashflowRatio) * 100);
          const cfColor = cf.color;
          const cfStatus = cfColor === "rose" ? "Beresiko" : cfColor === "amber" ? "Aman" : "Ideal";
          const borderClass = cfColor === "rose" ? "border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.06)]" : cfColor === "amber" ? "border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.06)]" : "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.06)]";
          const dotColor = cfColor === "rose" ? "bg-rose-500" : cfColor === "amber" ? "bg-amber-500" : "bg-emerald-500";
          const textClass = cfColor === "rose" ? "text-rose-500" : cfColor === "amber" ? "text-amber-500" : "text-emerald-500";
          const bgBadgeClass = cfColor === "rose" ? "bg-rose-500/10" : cfColor === "amber" ? "bg-amber-500/10" : "bg-emerald-500/10";
          const pct = cf.cashflowScore;

          return (
            <div className={`bg-card/60 border backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between ${borderClass} transition-all duration-300 hover:scale-[1.005]`}>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`w-4 h-4 ${textClass} shrink-0`} />
                    <h3 className="text-xs font-black text-foreground">Cashflow</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${bgBadgeClass} ${textClass}`}>• {cfStatus}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground/60 mt-1 block">Surplus dari income</span>
                </div>
                <div className="flex items-baseline shrink-0">
                  <span className={`text-base font-black leading-none ${textClass}`}>{savingsRate}%</span>
                  <span className="text-[9px] text-muted-foreground/60 ml-1 font-semibold">surplus</span>
                </div>
              </div>
              <div className="w-full h-1 bg-muted/20 rounded-full overflow-hidden mt-3 mb-2">
                <div className={`h-full rounded-full transition-all duration-700 ${dotColor}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between items-center w-full mt-1 text-[10px] font-black">
                <span className={cfColor === "rose" ? "text-rose-500 font-extrabold" : "text-rose-500/50"}>Beresiko</span>
                <span className={cfColor === "amber" ? "text-amber-500 font-extrabold" : "text-amber-500/50"}>Aman</span>
                <span className={cfColor === "emerald" ? "text-emerald-500 font-extrabold" : "text-emerald-500/50"}>Ideal</span>
              </div>
            </div>
          );
        })()}

        <div className="p-4 bg-card border border-border/20 rounded-2xl text-[11px] text-muted-foreground leading-relaxed shadow-sm">
          <span className="font-black text-foreground block mb-1">💡 Analisis Cashflow:</span>
          {cashflowHealth.reason}
        </div>
      </div>

      {/* ── 7 TANGGA KEUANGAN ── */}
      <div className="mx-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Peta Jalan Finansial — 6 Tangga</p>
          <span className="text-[10px] font-bold text-primary">{ladderState.level === 0 ? "Persiapan: Tangga 0" : `Tangga ${ladderState.level} / 6`}</span>
        </div>

        <div className="rounded-2xl border-2 p-4 mb-3 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border-primary/30">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black text-base bg-primary text-primary-foreground">{ladderState.level}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-black text-foreground">{ladderState.levelName}</p>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 bg-primary/15 text-primary">SEKARANG</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{ladderState.description}</p>
            </div>
          </div>

          {ladderState.targetAmount > 0 && ladderState.level > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-muted-foreground">Progres Tangga Ini</span>
                <span className="text-primary">{ladderState.progressPercentage}% · {fmtCustom(ladderState.currentAmount)} / {fmtCustom(ladderState.targetAmount)}</span>
              </div>
              <div className="w-full h-2.5 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700 bg-primary" style={{ width: `${ladderState.progressPercentage}%` }} />
              </div>
            </div>
          )}

          <div className="mt-3 p-2.5 rounded-xl text-[10px] leading-relaxed bg-background/60 text-muted-foreground border border-border/10">
            <span className="font-black text-foreground block mb-0.5">⚡ Langkah Wajib:</span>
            {ladderState.actionRequired}
          </div>

          {ladderState.level === 0 ? (
            <div className="flex gap-2 mt-3">
              <button onClick={() => setTab("karir")} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-all">
                <Briefcase className="w-3.5 h-3.5" />Mulai Cari Kerja
              </button>
              <button onClick={() => { setChatInput("Bagaimana cara menghasilkan uang tambahan dengan cepat dari skill saya?"); setTab("tanya"); }} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold active:scale-95 transition-all">
                <Zap className="w-3.5 h-3.5" />Cari Income Cepat
              </button>
            </div>
          ) : isSurvival ? (
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setChatInput("Saya butuh uang tunai minggu ini. Bantu saya buat rencana darurat berdasarkan skill dan aset yang saya punya."); setTab("tanya"); }} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-all">
                <Zap className="w-3.5 h-3.5" />Rencana Darurat
              </button>
              <button onClick={() => setTab("catat")} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold active:scale-95 transition-all">
                <TrendingUp className="w-3.5 h-3.5" />Cek Cashflow
              </button>
            </div>
          ) : null}
        </div>

        {/* Roadmap Track */}
        <div className="bg-card border border-border/20 rounded-2xl overflow-hidden">
          {ladderState.level === 0 && (
            <div className="flex items-center gap-3 px-4 py-3 relative bg-primary/5 border-b border-border/8">
              <div className="absolute left-[29px] top-[44px] w-0.5 h-4 z-0 bg-border/20" />
              <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black text-[10px] bg-primary text-white ring-4 ring-primary/20">0</div>
              <div className="flex-1 min-w-0"><p className="text-xs font-bold text-foreground truncate">Tangga 0: Income Starter</p></div>
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
              <div key={level} className={`flex items-center gap-3 px-4 py-3 relative ${isCurrent ? "bg-primary/5" : isDone ? "opacity-75" : isLocked ? "opacity-60" : ""} ${!isLast ? "border-b border-border/8" : ""}`}>
                {!isLast && <div className={`absolute left-[29px] top-[44px] w-0.5 h-4 z-0 ${isDone ? "bg-emerald-500/50" : "bg-border/20"}`} />}
                <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black text-[10px] transition-all ${isDone ? "bg-emerald-500 text-white" : isCurrent ? `${bg} text-white ring-4 ring-primary/15` : isNext ? "border-2 border-dashed border-primary/50 text-primary bg-primary/5" : "border border-border/40 text-muted-foreground/50 bg-muted/5"}`}>
                  {isDone ? "✓" : level}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${isCurrent ? "text-foreground" : isDone ? "text-muted-foreground/70 line-through decoration-muted-foreground/30" : isNext ? "text-foreground/80 font-bold" : "text-muted-foreground/60"}`}>{name}</p>
                </div>
                {isCurrent && <span className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 bg-primary/10 text-primary">AKTIF</span>}
                {isDone && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 shrink-0">✓ Selesai</span>}
                {isNext && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/5 text-primary/70 shrink-0 border border-primary/10">Berikutnya →</span>}
                {isLocked && <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
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
                <button key={v} onClick={() => setVibeLevel(v)} className={`flex-1 h-8 rounded-xl text-[11px] font-black transition-all ${vibeLevel === v ? (v <= 2 ? "bg-rose-500 text-white" : v === 3 ? "bg-amber-500 text-white" : "bg-emerald-500 text-white") : "bg-muted/40 text-muted-foreground"}`}>{v}</button>
              ))}
            </div>
            {vibeLevel <= 2 && <p className="text-[10px] text-rose-400 mt-2 font-semibold">⚠️ Energi rendah terdeteksi — misi harian dikurangi jadi 1 tugas saja.</p>}
          </div>
        </div>
      )}

      {/* ── MISI HARIAN ── */}
      <div className="mx-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {isSurvival ? "🚨 Misi Prioritas Darurat" : tDash("home.dailyMissions", { count: activeMissionsCount })}
          </p>
          {vibeLevel <= 2 && !isSurvival && <span className="text-[9px] text-rose-400 font-bold">Mode Hemat Energi</span>}
        </div>
        <div className="bg-card border border-border/20 rounded-2xl overflow-hidden divide-y divide-border/10">
          {missions.map((mission, i) => (
            <button key={i} onClick={mission.action} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 active:bg-muted/30 transition-colors text-left">
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

      {/* ── AI INSIGHT ── */}
      {!isSurvival && (
        <div className="mx-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
            {tDash("home.aiInsightToday")}
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
                <button onClick={() => setTab("tanya")} className="mt-3 text-[10px] font-bold text-violet-400 flex items-center gap-1 hover:text-violet-300 transition-colors">
                  {tDash("home.askMore")} <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REKOMENDASI IKIGAI ── */}
      {!isSurvival && !financialMode.lockedFeatures.includes("investment_module") && aiRecs.sideHustles?.length > 0 && (
        <div className="mx-4 pb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
            {tDash("home.ikigaiRecommendations")}
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
  );
}

export default memo(HomeTab);
