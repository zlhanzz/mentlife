"use client";

import { useState, useEffect, useActionState, startTransition } from "react";
import { submitOnboardingAction, OnboardingState } from "@/features/onboarding/actions";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight, Loader2, Check, BrainCircuit,
  Shield, TrendingUp, Skull, Zap, ArrowLeft
} from "lucide-react";
import { useTranslations } from "next-intl";

const initialState: OnboardingState = { success: false, message: "" };

// ── Utility functions (mirrored from onboarding-form for standalone page) ──
function TanggaIcon({ icon, className }: { icon: string; className?: string }) {
  if (icon === "skull") return <Skull className={className} />;
  if (icon === "shield") return <Shield className={className} />;
  if (icon === "trending-up") return <TrendingUp className={className} />;
  return <Zap className={className} />;
}

// ── AI Welcome Analysis (from Gemini) ──
interface AIWelcomeAnalysis {
  greeting: string;
  diagnosis: string;
  solution: string;
}

interface WelcomeData {
  name: string;
  birthDate: string;
  domicile: string;
  dependents: string;
  gender: string;
  insurance: string;
  skills: string[];
  experience: string;
  skillStory: string;
  hobbies: string[];
  hobbyStory: string;
  interests: string[];
  interestStory: string;
  formalStatus: string;
  customCareerStatus: string;
  careerState: string;
  companyName: string;
  jobRole: string;
  businessName: string;
  businessField: string;
  universityName: string;
  studyMajor: string;
  freelanceField: string;
  desiredRole: string;
  careerGoal: string;
  educationHistory: string[];
  primaryFocus: string;
  dailyFreeHours: number;
  income: number;
  expenses: number;
  savings: number;
  investment: number;
  debt: number;
  debtHighInterest: string;
  debtProductive: string;
  debtZeroInterest: string;
  investmentExperience: string[];
  riskProfile: string;
  livingSituation: string;
  workDevices: string[];
  deviceBrands: Record<string, string>;
  mobilityAssets: string[];
  lifeGoal: string;
  tangga: { level: number; name: string; desc: string; icon: string; color: string };
  mode: { label: string; desc: string; color: string };
  understandingScore: number;
  insights: string[];
  aiInsights: string[];
}

export default function WelcomePage() {
  const [state, formAction, isPending] = useActionState(submitOnboardingAction, initialState);
  const [data, setData] = useState<WelcomeData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIWelcomeAnalysis | null>(null);
  const [mounted, setMounted] = useState(false);

  const tw = useTranslations("welcome");
  const tc = useTranslations("common");
  const ti = useTranslations("welcome.insight");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mentlife_welcome_data");
      if (raw) {
        const parsed = JSON.parse(raw);
        setData(parsed);
        if (parsed.aiWelcomeAnalysis) {
          setAiAnalysis(parsed.aiWelcomeAnalysis);
        }
      }
    } catch {}
    setMounted(true);
  }, []);

  if (!mounted || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const {
    name, income, expenses, savings, investment, debt,
    tangga, mode, aiInsights,
  } = data;

  const numIncome = Number(income || 0);
  const numExpenses = Number(expenses || 0);
  const numSavings = Number(savings || 0);
  const numInvestment = Number(investment || 0);
  const numDebt = Number(debt || 0);
  const runway = numExpenses > 0 ? (numSavings / numExpenses).toFixed(1) : "0";

  const tanggaColorMap: Record<string, string> = { rose: "text-rose-500", amber: "text-amber-500", emerald: "text-emerald-500" };
  const tanggaBgMap: Record<string, string> = { rose: "bg-rose-500/10 border-rose-500/20", amber: "bg-amber-500/10 border-amber-500/20", emerald: "bg-emerald-500/10 border-emerald-500/20" };
  const tanggaTextMap: Record<string, string> = { rose: "text-rose-500", amber: "text-amber-500", emerald: "text-emerald-500" };

  // Build FormData for submission
  const buildFormData = () => {
    const fd = new FormData();
    fd.append("fullName", name);
    fd.append("displayName", name);
    fd.append("birthDate", data.birthDate || "");
    fd.append("domicile", data.domicile || "");
    fd.append("dependents", data.dependents || "");
    fd.append("gender", data.gender || "");
    fd.append("insurance", data.insurance || "");
    fd.append("livingSituation", data.livingSituation || "");
    fd.append("lifeGoal", data.lifeGoal || "");
    fd.append("skills", (data.skills || []).join(","));
    fd.append("experience", data.experience || "");
    fd.append("skillStory", data.skillStory || "");
    fd.append("hobbies", (data.hobbies || []).join(","));
    fd.append("hobbyStory", data.hobbyStory || "");
    fd.append("interests", (data.interests || []).join(","));
    fd.append("interestStory", data.interestStory || "");
    fd.append("formalStatus", data.formalStatus || "");
    fd.append("customCareerStatus", data.customCareerStatus || "");
    fd.append("careerState", data.careerState || "");
    fd.append("companyName", data.companyName || "");
    fd.append("jobRole", data.jobRole || "");
    fd.append("businessName", data.businessName || "");
    fd.append("businessField", data.businessField || "");
    fd.append("universityName", data.universityName || "");
    fd.append("studyMajor", data.studyMajor || "");
    fd.append("freelanceField", data.freelanceField || "");
    fd.append("desiredRole", data.desiredRole || "");
    fd.append("careerGoal", data.careerGoal || "");
    fd.append("educationHistory", (data.educationHistory || []).join(","));
    fd.append("primaryFocus", data.primaryFocus || "");
    fd.append("dailyFreeHours", String(data.dailyFreeHours || 2));
    fd.append("monthlyIncome", String(data.income || 0));
    fd.append("fixedExpenses", String(data.expenses || 0));
    fd.append("liquidSavings", String(data.savings || 0));
    fd.append("investmentValue", String(data.investment || 0));
    fd.append("totalDebt", String(numDebt));
    fd.append("debtHighInterest", data.debtHighInterest || "0");
    fd.append("debtProductive", data.debtProductive || "0");
    fd.append("debtZeroInterest", data.debtZeroInterest || "0");
    fd.append("investmentExperience", (data.investmentExperience || []).join(","));
    fd.append("riskProfile", data.riskProfile || "");
    fd.append("workDevices", (data.workDevices || []).join(","));
    fd.append("deviceBrands", JSON.stringify(data.deviceBrands || {}));
    fd.append("mobilityAssets", (data.mobilityAssets || []).join(","));
    fd.append("financialPath", `Tangga ${tangga.level}: ${tangga.name}`);
    return fd;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => formAction(buildFormData()));
  };

  // Use AI-generated analysis from Gemini, or fallback if unavailable
  const analysis: AIWelcomeAnalysis = aiAnalysis || {
    greeting: `${tw("fallback.greeting").replace("!", "")} ${name}!`,
    diagnosis: tw("fallback.diagnosis"),
    solution: tw("fallback.solution"),
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between shrink-0">
        <button onClick={() => window.history.back()} className="w-9 h-9 rounded-xl bg-muted/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-black text-foreground">Mentlife</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5">

        {/* ── AI Welcome Section ── */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: "200ms" }}>
          {/* Animated orb */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 animate-pulse absolute inset-0" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <Sparkles className="w-9 h-9 text-white" />
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: "4s" }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: "5s", animationDirection: "reverse" }}>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
              </div>
            </div>
          </div>

          {/* Welcome badge */}
          <div className="text-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              <Check className="w-3 h-3" /> {tw("badge")}
            </span>
          </div>

          {/* ── Financial Metrics Grid ── */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="bg-card/50 border border-border/20 rounded-xl p-3">
              <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider">{tw("metrics.income")}</p>
              <p className="text-sm font-extrabold text-foreground mt-0.5">Rp {numIncome.toLocaleString("id-ID")}</p>
              <p className="text-[8px] text-muted-foreground/60">{tw("metrics.perMonth")}</p>
            </div>
            <div className="bg-card/50 border border-border/20 rounded-xl p-3">
              <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider">{tw("metrics.expenses")}</p>
              <p className="text-sm font-extrabold text-foreground mt-0.5">Rp {numExpenses.toLocaleString("id-ID")}</p>
              <p className="text-[8px] text-muted-foreground/60">{tw("metrics.perMonth")}</p>
            </div>
            <div className="bg-card/50 border border-border/20 rounded-xl p-3">
              <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider">{tw("metrics.savings")}</p>
              <p className="text-sm font-extrabold text-emerald-500 mt-0.5">Rp {numSavings.toLocaleString("id-ID")}</p>
            </div>
            <div className="bg-card/50 border border-border/20 rounded-xl p-3">
              <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider">{tw("metrics.runway")}</p>
              <p className={`text-sm font-extrabold mt-0.5 ${numExpenses > 0 && numSavings / numExpenses < 3 ? "text-rose-400" : "text-foreground"}`}>
                {runway} {tw("metrics.perMonth")}
              </p>
            </div>
            {numDebt > 0 && (
              <div className="col-span-2 bg-card/50 border border-rose-500/20 rounded-xl p-3">
                <p className="text-[8px] text-rose-400/80 uppercase font-bold tracking-wider">{tw("metrics.debt")}</p>
                <p className="text-sm font-extrabold text-rose-400 mt-0.5">Rp {numDebt.toLocaleString("id-ID")}</p>
              </div>
            )}
            {numInvestment > 0 && (
              <div className="col-span-2 bg-card/50 border border-emerald-500/20 rounded-xl p-3">
                <p className="text-[8px] text-emerald-500/80 uppercase font-bold tracking-wider">{tw("metrics.investment")}</p>
                <p className="text-sm font-extrabold text-emerald-500 mt-0.5">Rp {numInvestment.toLocaleString("id-ID")}</p>
              </div>
            )}
          </div>

          {/* AI Analysis card — diagnosis + solution */}
          <div className="bg-gradient-to-br from-primary/5 via-card to-card border border-primary/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-wider">{tw("mentor.title")}</span>
            </div>
            <p className="text-xs text-foreground font-bold">{analysis.greeting}</p>
            <div className="space-y-2.5">
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{tw("mentor.diagnosis")}</p>
                <p className="text-[11px] text-foreground/90 leading-relaxed">{analysis.diagnosis}</p>
              </div>
              <div className="pt-2 border-t border-border/10">
                <p className="text-[9px] font-bold text-primary uppercase tracking-wider mb-1">{tw("mentor.solution")}</p>
                <p className="text-[11px] text-foreground/90 leading-relaxed">{analysis.solution}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tangga Card ── */}
        <div className={`relative overflow-hidden rounded-2xl border ${tanggaBgMap[tangga.color]} p-4 animate-in fade-in duration-500`} style={{ animationDelay: "400ms" }}>
          <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl ${tangga.color === "rose" ? "bg-rose-500/20" : tangga.color === "emerald" ? "bg-emerald-500/20" : "bg-amber-500/20"}`} />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${tangga.color === "rose" ? "bg-rose-500/20" : tangga.color === "emerald" ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
                <TanggaIcon icon={tangga.icon} className={`w-6 h-6 ${tanggaColorMap[tangga.color]}`} />
              </div>
              <div>
                <p className={`text-sm font-black ${tanggaColorMap[tangga.color]}`}>{tangga.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{tangga.desc}</p>
              </div>
            </div>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${tanggaBgMap[tangga.color]} ${tanggaTextMap[tangga.color]}`}>
              {tw("tangga")} {tangga.level}
            </span>
          </div>
          <div className="relative mt-3 flex items-center gap-1.5 text-[10px]">
            <span className={`font-bold ${tanggaTextMap[mode.color]}`}>{mode.label}</span>
            <span className="text-muted-foreground/70">— {mode.desc}</span>
          </div>
        </div>

        {/* ── AI Insight ── */}
        {aiInsights.length > 0 && (
          <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/[0.02] border border-amber-500/15 rounded-xl p-4 animate-in fade-in duration-500" style={{ animationDelay: "500ms" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-black text-amber-500/80">{ti("title")}</span>
            </div>
            {aiInsights.map((insight, i) => (
              <p key={i} className="text-[11px] text-muted-foreground leading-relaxed italic">
                &ldquo;{insight}&rdquo;
              </p>
            ))}
          </div>
        )}

        {/* ── Error state ── */}
        {state?.message && !state.success && !isPending && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-semibold text-center">
            {state.message}
          </div>
        )}

        {/* ── Final CTA ── */}
        <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: "600ms" }}>
          <Button type="submit" disabled={isPending}
            className="w-full h-14 rounded-xl font-bold text-base bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-black shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all">
            {isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {tc("syncing")}</>
            ) : (
              <><span>{tc("openDashboard")}</span><ArrowRight className="w-5 h-5" /></>
            )}
          </Button>
          <p className="text-[9px] text-muted-foreground/50 text-center mt-2">{tc("dashboardSyncDesc")}</p>
        </form>
      </div>
    </div>
  );
}
