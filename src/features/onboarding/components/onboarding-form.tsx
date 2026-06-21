"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { saveOnboardingDraft, loadOnboardingDraft, clearOnboardingDraft, curateStepAction, welcomeAnalysisAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User, Award, Heart, Target, Wallet, Users,
  ArrowRight, ArrowLeft, Loader2, Sparkles, Check,
  Shield, TrendingUp, Skull, BrainCircuit, Send,
  MapPin, Cake, Home, Laptop, Clock, Sun, Briefcase, Zap, GraduationCap, Pencil
} from "lucide-react";

interface ChatBubble { id: string; sender: "mentor" | "user"; content: string; type?: string; editStep?: number; }

function calcAge(birth: string): number {
  if (!birth) return 0;
  const d = new Date(birth);
  if (isNaN(d.getTime())) return 0;
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a;
}

function computeTangga(income: number, expenses: number, debt: number, savings: number) {
  const cashflow = income - expenses;
  const runway = expenses > 0 ? savings / expenses : 0;
  if (income === 0 && savings < 10_000_000) return { level: 0, name: "Income Starter", desc: "Fokus: amankan sumber pemasukan pertama.", icon: "zap", color: "amber" };
  if (debt > 0) return { level: 1, name: "Bebas Hutang", desc: "Fokus: lunasi seluruh hutang konsumtif agresif.", icon: "skull", color: "rose" };
  if (savings < expenses * 3) return { level: 2, name: "Dana Darurat", desc: "Fokus: bangun dana darurat 3-6x pengeluaran.", icon: "shield", color: "amber" };
  if (cashflow > 0 && runway >= 6) return { level: 3, name: "Investasi 20%", desc: "Fokus: alokasi 20% pendapatan ke investasi.", icon: "trending-up", color: "emerald" };
  return { level: 2, name: "Dana Darurat", desc: "Fokus: perkuat dana darurat sebelum investasi.", icon: "shield", color: "amber" };
}

function computeMode(income: number, expenses: number, savings: number, debt: number) {
  const cashflow = income - expenses;
  const runway = expenses > 0 ? savings / expenses : 0;
  if (cashflow < 0 || runway < 3) return { label: "🚨 Mode Survival", desc: "Runway kritis. Fokus absolut pada cashflow.", color: "rose" };
  if (runway >= 6 && debt === 0 && cashflow > 0) return { label: "📈 Mode Pertumbuhan", desc: "Fondasi solid. Saatnya ekspansi.", color: "emerald" };
  return { label: "🏗️ Mode Stabilitas", desc: "Fondasi belum beton. Perkuat dana darurat.", color: "amber" };
}

function getUnderstandingScore(s: any): number {
  let score = 0;
  if (s?.fullName?.trim()) score += 5;
  if (s?.birthDate) score += 4;
  if (s?.domicile?.trim()) score += 5;
  if (s?.dependents) score += 4;
  if (s?.gender) score += 4;
  if (s?.insurance) score += 4;
  if (s?.livingSituation) score += 5;
  if (s?.lifeGoal?.trim()) score += 6;
  if (s?.skills?.length > 0) score += 8;
  if (s?.experience?.trim()) score += 5;
  if (s?.hobbies?.length > 0) score += 5;
  if (s?.interests?.length > 0) score += 5;
  if (s?.formalStatus) score += 5;
  if (s?.educationHistory?.length > 0) score += 5;
  if (s?.careerGoal?.trim()) score += 5;
  if (s?.primaryFocus?.trim()) score += 5;
  if (s?.dailyFreeHours) score += 5;
  if (s?.income) score += 6;
  if (s?.expenses) score += 5;
  if (s?.liquidSavings) score += 5;
  if (s?.investmentExperience?.length > 0) score += 3;
  if (s?.workDevices?.length > 0) score += 5;
  if (s?.deviceBrands && Object.keys(s.deviceBrands as Record<string, string>).some(k => (s.deviceBrands as Record<string, string>)[k]?.trim())) score += 3;
  if (s?.mobilityAssets?.length > 0) score += 5;
  return Math.min(Math.round((score / 129) * 100), 100);
}

function getUC(s: number) { if (s < 30) return "text-rose-500"; if (s < 60) return "text-amber-500"; if (s < 80) return "text-emerald-500"; return "text-emerald-600"; }
function getUBg(s: number) { if (s < 30) return "bg-rose-500"; if (s < 60) return "bg-amber-500"; if (s < 80) return "bg-emerald-500"; return "bg-emerald-600"; }
function getULabel(s: number) { if (s < 30) return "Perlu Dilengkapi"; if (s < 60) return "Cukup Lengkap"; if (s < 80) return "Sangat Lengkap"; return "Sempurna"; }
function getInsights(s: any): string[] {
  const r: string[] = [];
  if (s?.skills?.length >= 2) r.push(`AI memahami keahlian: ${s.skills.slice(0, 3).join(", ")}`);
  if (s?.lifeGoal?.trim()) r.push("AI mengetahui tujuan hidup Anda sebagai North Star compass");
  if (s?.income) r.push(`AI menganalisis arus keuangan Rp ${Number(s.income).toLocaleString("id-ID")}/bulan`);
  return r.slice(0, 3);
}

function TanggaIcon({ icon, className }: { icon: string; className?: string }) {
  if (icon === "skull") return <Skull className={className} />;
  if (icon === "shield") return <Shield className={className} />;
  if (icon === "trending-up") return <TrendingUp className={className} />;
  return <Zap className={className} />;
}

function SectionDivider({ icon: Icon, label, color = "text-muted-foreground" }: { icon: React.ElementType; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 my-2">
      <div className="flex-1 h-px bg-border/40" />
      <span className={`text-[9px] font-black uppercase tracking-widest ${color} flex items-center gap-1.5`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}

export default function OnboardingForm({ initialName }: { initialName: string }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const tOb = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const tAn = useTranslations("analysis");
  const tTg = useTranslations("tangga");

  // Preset arrays from translations
  const SKILL_PRESETS = Object.values(tOb.raw("presets.skills")) as string[];
  const HOBBY_PRESETS = Object.values(tOb.raw("presets.hobbies")) as string[];
  const INTEREST_PRESETS = Object.values(tOb.raw("presets.interests")) as string[];
  const FORMAL_STATUS_OPTIONS = Object.values(tOb.raw("presets.formalStatus")) as string[];
  const WORK_DEVICE_OPTIONS = Object.values(tOb.raw("presets.workDevice")) as string[];
  const MOBILITY_OPTIONS = Object.values(tOb.raw("presets.mobility")) as string[];
  const FREE_HOURS_OPTIONS = Object.values(tOb.raw("presets.freeHours")) as string[];
  const DEPENDENT_OPTIONS = Object.values(tOb.raw("presets.dependents")) as string[];
  const INVESTMENT_EXPERIENCE_OPTIONS = Object.values(tOb.raw("presets.investmentExperience")) as string[];
  const EDUCATION_PRESETS = Object.values(tOb.raw("presets.education")) as string[];
  const GENDER_OPTIONS = Object.values(tOb.raw("presets.gender")) as string[];
  const INSURANCE_OPTIONS = Object.values(tOb.raw("presets.insurance")) as string[];
  const livingOptions = Object.entries(tOb.raw("presets.living") as Record<string, string>);
  const [currentStep, setCurrentStep] = useState(0);
  const [subStep, setSubStep] = useState(0); // sub-step within current main step (Steps 1, 2)
  const [financeSubStep, setFinanceSubStep] = useState(0); // sub-step within Step 3 (finance)
  const [careerSubStep, setCareerSubStep] = useState(0); // sub-step within Step 4 (career)
  const [livingSubStep, setLivingSubStep] = useState(0); // sub-step within Step 5 (living)
  const [detectingGeo, setDetectingGeo] = useState(false);

  // Step 0: Name + Birth Date + Domicile + Dependents + Gender + Insurance
  const [name, setName] = useState(initialName || "");
  const [birthDate, setBirthDate] = useState("");
  const [domicile, setDomicile] = useState("");
  const [dependents, setDependents] = useState("");
  const [gender, setGender] = useState("");
  const [insurance, setInsurance] = useState("");
  const [identitySubStep, setIdentitySubStep] = useState(0); // 0: name+date+domicile, 1: dependents, 2: gender, 3: insurance

  // Step 1: Skills & Experience
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [skillStory, setSkillStory] = useState("");
  const [customSkill, setCustomSkill] = useState("");

  // Step 2: Hobbies & Interests
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [hobbyStory, setHobbyStory] = useState("");
  const [customHobby, setCustomHobby] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interestStory, setInterestStory] = useState("");
  const [customInterest, setCustomInterest] = useState("");

  // Step 3: Financial Details
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [totalDebt, setTotalDebt] = useState("");
  const [debtHighInterest, setDebtHighInterest] = useState("");
  const [debtProductive, setDebtProductive] = useState("");
  const [debtZeroInterest, setDebtZeroInterest] = useState("");
  const [liquidSavings, setLiquidSavings] = useState("");
  const [investmentValue, setInvestmentValue] = useState("");
  const [investmentExperience, setInvestmentExperience] = useState<string[]>([]);
  const [riskProfile, setRiskProfile] = useState("moderat");

  // Step 4: Career & Goals
  const [formalStatus, setFormalStatus] = useState("");
  const [customCareerStatus, setCustomCareerStatus] = useState("");
  const [careerState, setCareerState] = useState("");
  // Status-specific detail fields
  const [companyName, setCompanyName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessField, setBusinessField] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [studyMajor, setStudyMajor] = useState("");
  const [freelanceField, setFreelanceField] = useState("");
  const [desiredRole, setDesiredRole] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [lifeGoal, setLifeGoal] = useState("");
  const [primaryFocus, setPrimaryFocus] = useState("");
  const [dailyFreeHours, setDailyFreeHours] = useState("2");
  const [educationHistory, setEducationHistory] = useState<string[]>([]);
  const [customEducation, setCustomEducation] = useState("");

  // Step 5: Living & Assets
  const [livingSituation, setLivingSituation] = useState("");
  const [workDevices, setWorkDevices] = useState<string[]>([]);
  const [deviceBrands, setDeviceBrands] = useState<Record<string, string>>({});
  const [mobilityAssets, setMobilityAssets] = useState<string[]>([]);

  const [chatHistory, setChatHistory] = useState<ChatBubble[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState(0);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isResuming, setIsResuming] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [chatHistory]);

  // Reset transition guard after any step change — allows next submission
  useEffect(() => { setIsTransitioning(false); }, [currentStep, subStep, financeSubStep, careerSubStep, livingSubStep, identitySubStep]);

  // Computed financial metrics (component-level for Step 6 JSX)
  const numIncome = Number(income || 0);
  const numExpenses = Number(expenses || 0);
  const numDebt = (Number(debtHighInterest) || 0) + (Number(debtProductive) || 0) + (Number(debtZeroInterest) || 0);
  const numSavings = Number(liquidSavings || 0);
  const numInvestment = Number(investmentValue || 0);

  // Load draft on mount — resume from where user left off
  useEffect(() => {
    const DRAFT_LS_KEY = "mentlife_onboarding_draft";
    (async () => {
      try {
        const res = await loadOnboardingDraft();
        let draft = res.draft;
        // Fallback: try localStorage if Supabase has no draft
        if (!draft) {
          try {
            const raw = localStorage.getItem(DRAFT_LS_KEY);
            if (raw) {
              draft = JSON.parse(raw);
              console.log("Draft restored from localStorage");
            }
          } catch {}
        }
        if (draft) {
          const d = draft.draft_data as Record<string, unknown>;
          // Populate all form state from draft
          if (d.name) setName(d.name as string);
          if (d.birthDate) setBirthDate(d.birthDate as string);
          if (d.domicile) setDomicile(d.domicile as string);
          if (d.dependents) setDependents(d.dependents as string);
          if (d.gender) setGender(d.gender as string);
          if (d.insurance) setInsurance(d.insurance as string);
          if (d.selectedSkills) setSelectedSkills(d.selectedSkills as string[]);
          if (d.customSkill) setCustomSkill(d.customSkill as string);
          if (d.experience) setExperience(d.experience as string);
          if (d.skillStory) setSkillStory(d.skillStory as string);
          if (d.selectedHobbies) setSelectedHobbies(d.selectedHobbies as string[]);
          if (d.customHobby) setCustomHobby(d.customHobby as string);
          if (d.hobbyStory) setHobbyStory(d.hobbyStory as string);
          if (d.selectedInterests) setSelectedInterests(d.selectedInterests as string[]);
          if (d.customInterest) setCustomInterest(d.customInterest as string);
          if (d.interestStory) setInterestStory(d.interestStory as string);
          if (d.income) setIncome(d.income as string);
          if (d.expenses) setExpenses(d.expenses as string);
          if (d.liquidSavings) setLiquidSavings(d.liquidSavings as string);
          if (d.investmentValue) setInvestmentValue(d.investmentValue as string);
          if (d.debtHighInterest) setDebtHighInterest(d.debtHighInterest as string);
          if (d.debtProductive) setDebtProductive(d.debtProductive as string);
          if (d.debtZeroInterest) setDebtZeroInterest(d.debtZeroInterest as string);
          if (d.emergencyFundTarget) { /* framework auto-calc, no state needed */ }
          if (d.investmentExperience) setInvestmentExperience(d.investmentExperience as string[]);
          if (d.riskProfile) setRiskProfile(d.riskProfile as string);
          if (d.formalStatus) setFormalStatus(d.formalStatus as string);
          if (d.customCareerStatus) setCustomCareerStatus(d.customCareerStatus as string);
          if (d.careerState) setCareerState(d.careerState as string);
          if (d.companyName) setCompanyName(d.companyName as string);
          if (d.jobRole) setJobRole(d.jobRole as string);
          if (d.businessName) setBusinessName(d.businessName as string);
          if (d.businessField) setBusinessField(d.businessField as string);
          if (d.universityName) setUniversityName(d.universityName as string);
          if (d.studyMajor) setStudyMajor(d.studyMajor as string);
          if (d.freelanceField) setFreelanceField(d.freelanceField as string);
          if (d.desiredRole) setDesiredRole(d.desiredRole as string);
          if (d.educationHistory) setEducationHistory(d.educationHistory as string[]);
          if (d.customEducation) setCustomEducation(d.customEducation as string);
          if (d.careerGoal) setCareerGoal(d.careerGoal as string);
          if (d.lifeGoal) setLifeGoal(d.lifeGoal as string);
          if (d.primaryFocus) setPrimaryFocus(d.primaryFocus as string);
          if (d.dailyFreeHours) setDailyFreeHours(d.dailyFreeHours as string);
          if (d.livingSituation) setLivingSituation(d.livingSituation as string);
          if (d.workDevices) setWorkDevices(d.workDevices as string[]);
          if (d.deviceBrands) setDeviceBrands(d.deviceBrands as Record<string, string>);
          if (d.mobilityAssets) setMobilityAssets(d.mobilityAssets as string[]);
          if (draft.ai_insights?.length) setAiInsights(draft.ai_insights);
          // Advance to saved step
          const savedSub = (draft as unknown as Record<string, unknown>).sub_step as number ?? 0;
          setCurrentStep(draft.current_step);
          setSubStep(savedSub);
          if (draft.current_step === 0) {
            setIdentitySubStep(savedSub);
          }
          if (draft.current_step === 3) {
            setFinanceSubStep(savedSub);
          }
          if (draft.current_step === 4) {
            setCareerSubStep(savedSub);
          }
          if (draft.current_step === 5) {
            setLivingSubStep(savedSub);
          }
          // Build chat history from draft
          const savedName = (d.name as string) || initialName || "Mentee";
          const history: ChatBubble[] = [
            { id: "w1", sender: "mentor", content: "Halo! Selamat datang kembali di Mentlife. Saya melihat Anda sudah memulai onboarding sebelumnya. Mari kita lanjutkan." },
          ];
          // Replay completed steps as chat bubbles
          const step = draft.current_step;
          if (step >= 1 && d.name) {
            const genStr = d.gender ? `, Gender: ${d.gender}` : "";
            const insStr = d.insurance ? `, Asuransi: ${d.insurance}` : "";
            history.push({ id: "r0", sender: "user", content: `Nama: ${d.name}, Lahir: ${d.birthDate || "—"}, Domisili: ${d.domicile || "—"}${genStr}${insStr}`, editStep: 0 });
            history.push({ id: "r0m", sender: "mentor", content: `Salam kenal, ${d.name}! Untuk menyusun strategi yang tepat, saya perlu memahami potensi Anda. Apa saja keahlian yang Anda kuasai?` });
          }
          if (step >= 2 && (d.selectedSkills as string[])?.length) {
            history.push({ id: "r1", sender: "user", content: `Keahlian: ${(d.selectedSkills as string[]).join(", ")}. Pengalaman: ${d.experience || "—"}`, editStep: 1 });
            history.push({ id: "r1m", sender: "mentor", content: "Luar biasa! Untuk menemukan titik temu Ikigai, hobi apa saja yang Anda cintai dan topik apa yang menarik minat Anda?" });
          }
          if (step >= 3 && (d.selectedHobbies as string[])?.length) {
            history.push({ id: "r2", sender: "user", content: `Hobi: ${(d.selectedHobbies as string[]).join(", ")}. Minat: ${(d.selectedInterests as string[]).join(", ")}`, editStep: 2 });
            history.push({ id: "r2m", sender: "mentor", content: "Data profil sangat lengkap. Sekarang, mari kita mulai estimasi kondisi keuangan Anda. Angka ini bersifat perkiraan awal — nanti akan diperbarui otomatis saat Anda aktif mencatat keuangan di aplikasi." });
          }
          if (step >= 4 && d.income) {
            const inc = Number(d.income || 0);
            const exp = Number(d.expenses || 0);
            const sav = Number(d.liquidSavings || 0);
            let debtStr = "";
            const dh = Number(d.debtHighInterest || 0);
            const dp = Number(d.debtProductive || 0);
            const dz = Number(d.debtZeroInterest || 0);
            if (dh > 0 || dp > 0 || dz > 0) debtStr = `, Total Hutang: Rp ${(dh + dp + dz).toLocaleString("id-ID")}`;
            const efStr = d.income ? "" : ""; // framework auto-calc emergency fund
            const depStr = d.dependents ? `, Tanggungan: ${d.dependents}` : "";
            history.push({ id: "r3", sender: "user", content: `Pendapatan: Rp ${inc.toLocaleString("id-ID")}/bln, Pengeluaran: Rp ${exp.toLocaleString("id-ID")}/bln, Tabungan: Rp ${sav.toLocaleString("id-ID")}${depStr}${debtStr}${efStr}`, editStep: 3 });
            history.push({ id: "r3m", sender: "mentor", content: "Data keuangan tercatat. Sekarang, mari kita bahas karir dan tujuan Anda. Apa status karir Anda saat ini?" });
          }
          if (step >= 5 && (d.formalStatus || d.careerState)) {
            const eduStr = (d.educationHistory as string[])?.length ? `, Pendidikan: ${(d.educationHistory as string[]).join(", ")}` : "";
            history.push({ id: "r4", sender: "user", content: `Status: ${d.formalStatus || d.careerState}${eduStr}. Fokus: ${d.primaryFocus || "—"}. Goal: ${d.careerGoal || "—"}. Kapasitas: ${d.dailyFreeHours || "2"} jam/hari.`, editStep: 4 });
            history.push({ id: "r4m", sender: "mentor", content: "Hampir selesai! Di mana Anda tinggal saat ini?" });
          }
          if (step >= 6 && d.livingSituation) {
            const brands = d.deviceBrands as Record<string, string> | undefined;
            const brandStr = brands && Object.entries(brands).some(([, v]) => v?.trim())
              ? ` Merek: ${Object.entries(brands).filter(([, v]) => v?.trim()).map(([k, v]) => `${k}: ${v}`).join(", ")}`
              : "";
            history.push({ id: "r5", sender: "user", content: `Tinggal: ${d.livingSituation}. Perangkat: ${(d.workDevices as string[] || []).join(", ") || "—"}${brandStr}. Mobilitas: ${(d.mobilityAssets as string[] || []).join(", ") || "—"}`, editStep: 5 });
            history.push({ id: "r5m", sender: "mentor", content: `Sempurna, ${savedName}! Semua data telah terkumpul. Berdasarkan seluruh data Anda, sistem telah menentukan posisi Tangga Finansial dan strategi prioritas Anda secara otomatis.` });
          }
          // Add saved AI insights
          if (draft.ai_insights?.length) {
            draft.ai_insights.forEach((insight: string, i: number) => {
              history.push({ id: `ai_${i}`, sender: "mentor", content: `💡 ${insight}` });
            });
          }
          setChatHistory(history);
        } else {
          // No draft — start fresh
          setChatHistory([
            { id: "w1", sender: "mentor", content: "Halo! Selamat datang di Mentlife. Saya AI Mentor pribadi Anda yang akan membimbing Anda menyusun strategi keuangan & karir terbaik." },
            { id: "w2", sender: "mentor", content: "Sebelum kita mulai, boleh saya tahu nama panggilan, tanggal lahir, dan kota domisili Anda saat ini?", type: "text" }
          ]);
        }
      } catch {
        setChatHistory([
          { id: "w1", sender: "mentor", content: "Halo! Selamat datang di Mentlife. Saya AI Mentor pribadi Anda yang akan membimbing Anda menyusun strategi keuangan & karir terbaik." },
          { id: "w2", sender: "mentor", content: "Sebelum kita mulai, boleh saya tahu nama panggilan, tanggal lahir, dan kota domisili Anda saat ini?", type: "text" }
        ]);
      } finally {
        setIsResuming(false);
      }
    })();
  }, []);

  const toggleSkill = (item: string) => setSelectedSkills(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item]);
  const toggleHobby = (item: string) => setSelectedHobbies(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item]);
  const toggleInterest = (item: string) => setSelectedInterests(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item]);
  const toggleDevice = (item: string) => setWorkDevices(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item]);
  const toggleMobility = (item: string) => setMobilityAssets(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item]);
  const toggleInvestmentExp = (item: string) => setInvestmentExperience(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item]);
  const toggleEducation = (item: string) => setEducationHistory(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item]);
  const addCustomEducation = () => { const v = customEducation.trim(); if (v && !educationHistory.includes(v)) { setEducationHistory(p => [...p, v]); setCustomEducation(""); } };

  const addCustomSkill = () => {
    const v = customSkill.trim();
    if (v && !selectedSkills.includes(v)) { setSelectedSkills(p => [...p, v]); setCustomSkill(""); }
  };
  const addCustomHobby = () => {
    const v = customHobby.trim();
    if (v && !selectedHobbies.includes(v)) { setSelectedHobbies(p => [...p, v]); setCustomHobby(""); }
  };
  const addCustomInterest = () => {
    const v = customInterest.trim();
    if (v && !selectedInterests.includes(v)) { setSelectedInterests(p => [...p, v]); setCustomInterest(""); }
  };

  const handleDetectGeo = () => {
    if (!navigator.geolocation) return;
    setDetectingGeo(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=10`, { headers: { "Accept-Language": "id" } });
        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.municipality || addr.village || addr.state || "";
          const country = addr.country || "";
          setDomicile(city && country ? `${city}, ${country}` : country || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        }
      } catch { setDomicile("Jakarta, Indonesia"); }
      finally { setDetectingGeo(false); }
    }, () => { setDetectingGeo(false); alert("Gagal deteksi lokasi. Ketik manual."); }, { timeout: 10000 });
  };

  const advanceStep = (msg: string, step?: number): boolean => {
    if (isTransitioning) return false;
    setIsTransitioning(true);
    setChatHistory(prev => [...prev, { id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, sender: "user", content: msg, editStep: step }]);
    return true;
  };

  // Advance to next sub-step within current main step
  const nextSubStep = useCallback((mentorMsg: string, nextSub: number, nextMainStep?: number) => {
    setTimeout(() => {
      setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: mentorMsg }]);
      if (nextMainStep !== undefined) {
        setCurrentStep(nextMainStep);
        setSubStep(0);
      } else {
        setSubStep(nextSub);
      }
    }, 600);
  }, []);

  // Collect all current form data into a draft object
  const collectDraftData = useCallback((): Record<string, unknown> => ({
    name, birthDate, domicile, dependents, gender, insurance,
    selectedSkills, experience, skillStory, customSkill,
    selectedHobbies, hobbyStory, customHobby, selectedInterests, interestStory, customInterest,
    income, expenses, liquidSavings, investmentValue, debtHighInterest, debtProductive, debtZeroInterest,
    investmentExperience, riskProfile,
    formalStatus, customCareerStatus, careerState, companyName, jobRole, businessName, businessField,
    universityName, studyMajor, freelanceField, desiredRole,
    educationHistory, customEducation,
    careerGoal, lifeGoal, primaryFocus, dailyFreeHours,
    livingSituation, workDevices, deviceBrands, mobilityAssets,
  }), [name, birthDate, domicile, dependents, gender, insurance,
    selectedSkills, experience, skillStory, customSkill,
    selectedHobbies, hobbyStory, customHobby, selectedInterests, interestStory, customInterest,
    income, expenses, liquidSavings, investmentValue, debtHighInterest, debtProductive, debtZeroInterest,
    investmentExperience, riskProfile,
    formalStatus, customCareerStatus, careerState, companyName, jobRole, businessName, businessField,
    universityName, studyMajor, freelanceField, desiredRole,
    educationHistory, customEducation,
    careerGoal, lifeGoal, primaryFocus, dailyFreeHours,
    livingSituation, workDevices, deviceBrands, mobilityAssets]);

  // Auto-save draft after each step transition (no AI call — saves tokens)
  // Dual storage: Supabase (primary) + localStorage (fallback if DB table missing)
  const DRAFT_LS_KEY = "mentlife_onboarding_draft";
  const saveDraft = useCallback((nextStep: number, nextSub?: number) => {
    setIsSavingDraft(true);
    const draftData = collectDraftData();
    try {
      const payload = { current_step: nextStep, sub_step: nextSub ?? 0, draft_data: draftData, ai_insights: aiInsights };
      localStorage.setItem(DRAFT_LS_KEY, JSON.stringify(payload));
    } catch {}
    saveOnboardingDraft(nextStep, draftData)
      .catch(() => {})
      .finally(() => setIsSavingDraft(false));
  }, [collectDraftData, aiInsights]);

  // Edit a previous user message — go back to that step, truncate chat after it
  const editBubble = useCallback((step: number) => {
    if (step < 0 || step > currentStep) return;
    setCurrentStep(step);
    setSubStep(0);
    if (step === 3) setFinanceSubStep(0);
    if (step === 4) setCareerSubStep(0);
    if (step === 5) setLivingSubStep(0);
    setChatHistory(prev => {
      const idx = prev.findIndex(b => b.editStep === step && b.sender === "user");
      if (idx >= 0) return prev.slice(0, idx);
      return prev;
    });
    setTimeout(() => {
      const draftData = collectDraftData();
      try {
        localStorage.setItem(DRAFT_LS_KEY, JSON.stringify({ current_step: step, sub_step: 0, draft_data: draftData, ai_insights: aiInsights }));
      } catch {}
      saveOnboardingDraft(step, draftData).catch(() => {});
    }, 100);
  }, [currentStep, collectDraftData, aiInsights]);

  // Step 0 -> 1 (Identity → Skills)
  // 0.0: Name+Date+Domicile → 0.1: Gender → 0.2: Insurance → Step 1
  const handleSendIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (identitySubStep === 0) {
      if (!name.trim()) return;
      if (!advanceStep(`Nama: ${name}, Lahir: ${birthDate || "—"}, Domisili: ${domicile || "—"}`, 0)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.identity.genderQuestion") }]);
        setIdentitySubStep(1);
        saveDraft(0, 1);
      }, 600);
    } else if (identitySubStep === 1) {
      if (!advanceStep(`Gender: ${gender || "—"}`, 0)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.identity.insuranceQuestion") }]);
        setIdentitySubStep(2);
        saveDraft(0, 2);
      }, 600);
    } else if (identitySubStep === 2) {
      if (!advanceStep(`Asuransi: ${insurance || "—"}`, 0)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.identity.greetingSkills", { name }) }]);
        setCurrentStep(1);
        setIdentitySubStep(0);
        saveDraft(1, 0);
      }, 800);
    }
  };

  // Step 1: Skills sub-step handlers
  // 1.0: Select skills → 1.1: Experience → 1.2: Story → Step 2
  const handleSendSkills = (e: React.FormEvent) => {
    e.preventDefault();
    if (subStep === 0) {
      // Sub-step 0: Skills selected → ask experience
      if (selectedSkills.length === 0) return;
      if (!advanceStep(`Keahlian: ${selectedSkills.join(", ")}`, 1)) return;
      nextSubStep(tOb("steps.skills.experienceFollowUp"), 1);
      saveDraft(1, 1);
    } else if (subStep === 1) {
      // Sub-step 1: Experience entered → ask story
      if (!experience.trim()) return;
      if (!advanceStep(`Pengalaman: ${experience}`, 1)) return;
      nextSubStep(tOb("steps.skills.storyFollowUp"), 2);
      saveDraft(1, 2);
    } else if (subStep === 2) {
      // Sub-step 2: Story (optional) → advance to Step 2
      if (!advanceStep(`Cerita tambahan: ${skillStory || "—"}`, 1)) return;
      nextSubStep(tOb("steps.hobbies.transition"), 0, 2);
      saveDraft(2, 0);
    }
  };

  const skipSkillStory = () => {
    if (!advanceStep(tOb("steps.skills.storySkipped"), 1)) return;
    nextSubStep(tOb("steps.hobbies.transition"), 0, 2);
    saveDraft(2, 0);
  };

  // Step 2: Hobbies sub-step handlers
  // 2.0: Select hobbies → 2.1: Select interests → 2.2: Story → Step 3
  const handleSendHobbies = (e: React.FormEvent) => {
    e.preventDefault();
    if (subStep === 0) {
      if (selectedHobbies.length === 0) return;
      if (!advanceStep(`Hobi: ${selectedHobbies.join(", ")}`, 2)) return;
      nextSubStep(tOb("steps.hobbies.interestFollowUp"), 1);
      saveDraft(2, 1);
    } else if (subStep === 1) {
      if (selectedInterests.length === 0) return;
      if (!advanceStep(`Minat: ${selectedInterests.join(", ")}`, 2)) return;
      nextSubStep(tOb("steps.hobbies.storyFollowUp"), 2);
      saveDraft(2, 2);
    } else if (subStep === 2) {
      if (!advanceStep(`Cerita tambahan: ${hobbyStory || "—"}`, 2)) return;
      nextSubStep(tOb("steps.hobbies.financeTransition"), 0, 3);
      saveDraft(3, 0);
    }
  };

  const skipHobbyStory = () => {
    if (!advanceStep(tOb("steps.hobbies.storySkipped"), 2)) return;
    nextSubStep(tOb("steps.hobbies.financeTransition"), 0, 3);
    saveDraft(3, 0);
  };

  // Step 3: Financial sub-step handlers (one question at a time)
  // 3.0: Income → 3.1: Expenses → 3.2: Savings → 3.3: Dependents → 3.4: Debt → 3.5: Investment → 3.6: Investment Exp → 3.7: Risk → Step 4
  const handleSendFinancialsSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (financeSubStep === 0) {
      if (!income) return;
      if (!advanceStep(`Estimasi pemasukan: Rp ${Number(income).toLocaleString("id-ID")}/bulan`, 3)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.finance.expenseQuestion") }]);
        setFinanceSubStep(1);
        saveDraft(3, 1);
      }, 600);
    } else if (financeSubStep === 1) {
      if (!expenses) return;
      if (!advanceStep(`Estimasi pengeluaran: Rp ${Number(expenses).toLocaleString("id-ID")}/bulan`, 3)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.finance.savingsQuestion") }]);
        setFinanceSubStep(2);
        saveDraft(3, 2);
      }, 600);
    } else if (financeSubStep === 2) {
      if (!advanceStep(`Tabungan: Rp ${Number(liquidSavings || 0).toLocaleString("id-ID")}`, 3)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.finance.dependentsQuestion") }]);
        setFinanceSubStep(3);
        saveDraft(3, 3);
      }, 600);
    } else if (financeSubStep === 3) {
      if (!advanceStep(`Tanggungan: ${dependents || "Tidak ada"}`, 3)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.finance.debtQuestion") }]);
        setFinanceSubStep(4);
        saveDraft(3, 4);
      }, 600);
    } else if (financeSubStep === 4) {
      // Debt — redesigned: submit total + breakdown
      if (Number(debtHighInterest) > 0 || Number(debtProductive) > 0 || Number(debtZeroInterest) > 0) {
        const total = (Number(debtHighInterest) || 0) + (Number(debtProductive) || 0) + (Number(debtZeroInterest) || 0);
        setTotalDebt(String(total));
        if (!advanceStep(`Hutang: Rp ${total.toLocaleString("id-ID")}`, 3)) return;
      } else {
        if (!advanceStep("Hutang: — (tidak ada)", 3)) return;
      }
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.finance.investmentQuestion") }]);
        setFinanceSubStep(5);
        saveDraft(3, 5);
      }, 600);
    } else if (financeSubStep === 5) {
      if (!advanceStep(`Estimasi nilai investasi: Rp ${Number(investmentValue || 0).toLocaleString("id-ID")}`, 3)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.finance.investmentExpQuestion") }]);
        setFinanceSubStep(6);
        saveDraft(3, 6);
      }, 600);
    } else if (financeSubStep === 6) {
      if (!advanceStep(`Pengalaman investasi: ${investmentExperience.length > 0 ? investmentExperience.join(", ") : "Belum pernah"}`, 3)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.finance.riskQuestion") }]);
        setFinanceSubStep(7);
        saveDraft(3, 7);
      }, 600);
    } else if (financeSubStep === 7) {
      // Risk profile — final finance sub-step
      let str = `Pemasukan: Rp ${Number(income).toLocaleString("id-ID")}/bln, Pengeluaran: Rp ${Number(expenses).toLocaleString("id-ID")}/bln, Tabungan: Rp ${Number(liquidSavings || 0).toLocaleString("id-ID")}`;
      if (Number(debtHighInterest) > 0 || Number(debtProductive) > 0 || Number(debtZeroInterest) > 0) {
        const total = (Number(debtHighInterest) || 0) + (Number(debtProductive) || 0) + (Number(debtZeroInterest) || 0);
        str += `, Hutang: Rp ${total.toLocaleString("id-ID")}`;
      }
      if (Number(investmentValue) > 0) {
        str += `, Investasi: Rp ${Number(investmentValue).toLocaleString("id-ID")}`;
      }
      str += `, Risiko: ${riskProfile}`;
      if (!advanceStep(str, 3)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.career.intro") }]);
        setCurrentStep(4);
        setSubStep(0);
        setFinanceSubStep(0);
        saveDraft(4, 0);
      }, 800);
    }
  };

  const skipDebt = () => {
    if (!advanceStep("Hutang: — (tidak ada / dilewati)", 3)) return;
    setTimeout(() => {
      setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: "Apakah Anda sudah memiliki investasi? (saham, reksadana, crypto, emas, dll). Isi 0 jika belum." }]);
      setFinanceSubStep(5);
      saveDraft(3, 5);
    }, 600);
  };

  // Step 4: Career sub-step handlers (one question at a time, dynamic follow-ups)
  // 4.0: Status → 4.1: Detail → 4.2: Education History → 4.3: Target Karir → 4.4: Fokus → 4.5: Waktu Luang → 4.6: Tujuan Hidup → Step 5
  const getCareerFollowUp = (status: string): string => {
    const s = status.toLowerCase();
    if (s.includes("karyawan")) return tOb("steps.career.followUps.karyawan");
    if (s.includes("pengusaha") || s.includes("wirausaha")) return tOb("steps.career.followUps.pengusaha");
    if (s.includes("mahasiswa")) return tOb("steps.career.followUps.mahasiswa");
    if (s.includes("freelance")) return tOb("steps.career.followUps.freelance");
    if (s.includes("menganggur") || s.includes("mencari")) return tOb("steps.career.followUps.menganggur");
    return tOb("steps.career.followUps.default", { status });
  };

  const handleSendCareerSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (careerSubStep === 0) {
      const status = customCareerStatus.trim() || formalStatus;
      if (!status) return;
      const displayStatus = customCareerStatus.trim() || formalStatus;
      if (!advanceStep(`Status: ${displayStatus}`, 4)) return;
      setCareerState(displayStatus);
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: getCareerFollowUp(displayStatus) }]);
        setCareerSubStep(1);
        saveDraft(4, 1);
      }, 600);
    } else if (careerSubStep === 1) {
      // Status-specific detail
      const s = (customCareerStatus.trim() || formalStatus).toLowerCase();
      let detailStr = "";
      if (s.includes("karyawan")) {
        if (!companyName.trim() || !jobRole.trim()) return;
        detailStr = `Perusahaan: ${companyName}, Posisi: ${jobRole}`;
      } else if (s.includes("pengusaha") || s.includes("wirausaha")) {
        if (!businessName.trim() || !businessField.trim()) return;
        detailStr = `Bisnis: ${businessName}, Bidang: ${businessField}`;
      } else if (s.includes("mahasiswa")) {
        if (!universityName.trim() || !studyMajor.trim()) return;
        detailStr = `Kampus: ${universityName}, Jurusan: ${studyMajor}`;
      } else if (s.includes("freelance")) {
        if (!freelanceField.trim()) return;
        detailStr = `Bidang freelance: ${freelanceField}`;
      } else if (s.includes("menganggur") || s.includes("mencari")) {
        if (!desiredRole.trim()) return;
        detailStr = `Posisi yang diincar: ${desiredRole}`;
      } else {
        if (!companyName.trim()) return;
        detailStr = `Detail: ${companyName}`;
      }
      if (!advanceStep(detailStr, 4)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.career.educationQuestion") }]);
        setCareerSubStep(2);
        saveDraft(4, 2);
      }, 600);
    } else if (careerSubStep === 2) {
      // Education History
      if (!advanceStep(`Pendidikan: ${educationHistory.length > 0 ? educationHistory.join(", ") : "—"}`, 4)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.career.careerGoalQuestion") }]);
        setCareerSubStep(3);
        saveDraft(4, 3);
      }, 600);
    } else if (careerSubStep === 3) {
      if (!careerGoal.trim()) return;
      if (!advanceStep(`Target karir: ${careerGoal}`, 4)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.career.focusQuestion") }]);
        setCareerSubStep(4);
        saveDraft(4, 4);
      }, 600);
    } else if (careerSubStep === 4) {
      if (!primaryFocus.trim()) return;
      if (!advanceStep(`Fokus utama: ${primaryFocus}`, 4)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.career.hoursQuestion") }]);
        setCareerSubStep(5);
        saveDraft(4, 5);
      }, 600);
    } else if (careerSubStep === 5) {
      if (!advanceStep(`Kapasitas eksekusi: ${dailyFreeHours} jam/hari`, 4)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.career.lifeGoalQuestion") }]);
        setCareerSubStep(6);
        saveDraft(4, 6);
      }, 600);
    } else if (careerSubStep === 6) {
      // Life goal — final career sub-step
      if (!advanceStep(`Tujuan hidup: ${lifeGoal || "— (dilewati)"}`, 4)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.living.intro") }]);
        setCurrentStep(5);
        setSubStep(0);
        setCareerSubStep(0);
        saveDraft(5, 0);
      }, 800);
    }
  };

  const skipLifeGoal = () => {
    if (!advanceStep(tOb("steps.career.lifeGoalSkipped"), 4)) return;
    setTimeout(() => {
      setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.living.intro") }]);
      setCurrentStep(5);
      setSubStep(0);
      setCareerSubStep(0);
      saveDraft(5, 0);
    }, 800);
  };

  // Step 5: Living sub-step handlers (one question at a time)
  // 5.0: Living Situation → 5.1: Work Devices → 5.2: Device Brands → 5.3: Mobility → Step 6 (Review)
  const handleSendLivingSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (livingSubStep === 0) {
      if (!livingSituation) return;
      if (!advanceStep(`Tempat tinggal: ${livingOptions.find(([k]) => k === livingSituation)?.[1] || livingSituation}`, 5)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.living.deviceQuestion") }]);
        setLivingSubStep(1);
        saveDraft(5, 1);
      }, 600);
    } else if (livingSubStep === 1) {
      if (workDevices.length === 0) return;
      if (!advanceStep(`Perangkat: ${workDevices.join(", ")}`, 5)) return;
      // Clear brands for deselected devices
      setDeviceBrands(prev => {
        const cleaned: Record<string, string> = {};
        workDevices.forEach(d => { if (prev[d]) cleaned[d] = prev[d]; });
        return cleaned;
      });
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.living.brandQuestion") }]);
        setLivingSubStep(2);
        saveDraft(5, 2);
      }, 600);
    } else if (livingSubStep === 2) {
      // Device brands — optional, can skip
      const brandSummary = workDevices.map(d => `${d}: ${deviceBrands[d] || "—"}`).join(", ");
      if (!advanceStep(`Merek perangkat: ${brandSummary}`, 5)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.living.mobilityQuestion") }]);
        setLivingSubStep(3);
        saveDraft(5, 3);
      }, 600);
    } else if (livingSubStep === 3) {
      if (mobilityAssets.length === 0) return;
      if (!advanceStep(`Mobilitas: ${mobilityAssets.join(", ")}`, 5)) return;
      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `m_${Date.now()}`, sender: "mentor", content: tOb("steps.living.completion", { name }) }]);
        setCurrentStep(6);
        setSubStep(0);
        setLivingSubStep(0);
        saveDraft(6, 0);
        // Single batch AI curation — all data at once, 1 API call total
        curateStepAction(6, {
          name, birthDate, domicile, dependents, gender, insurance,
          skills: selectedSkills, experience,
          hobbies: selectedHobbies, interests: selectedInterests,
          income: numIncome, expenses: numExpenses,
          savings: numSavings, investment: numInvestment, debt: numDebt,
          investmentExperience,
          formalStatus, educationHistory, careerGoal, lifeGoal,
          dailyFreeHours: Number(dailyFreeHours),
          livingSituation,
          workDevices, deviceBrands, mobilityAssets,
        }).then(curation => {
          setAiInsights([curation.insight]);
        }).catch(() => {});
      }, 800);
    }
  };

  // Futuristic AI analysis → call Gemini → save data → redirect to /welcome
  const handleStartAnalysis = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setAnalysisPhase(0);

    // Build welcome data object
    const welcomeData: Record<string, unknown> = {
      name, birthDate, domicile, dependents, gender, insurance,
      skills: selectedSkills, experience, skillStory,
      hobbies: selectedHobbies, hobbyStory, interests: selectedInterests, interestStory,
      formalStatus, customCareerStatus, careerState: customCareerStatus.trim() || formalStatus,
      companyName, jobRole, businessName, businessField,
      universityName, studyMajor, freelanceField, desiredRole,
      careerGoal, educationHistory, primaryFocus, dailyFreeHours: Number(dailyFreeHours),
      income: numIncome, expenses: numExpenses,
      savings: numSavings, investment: numInvestment, debt: numDebt,
      debtHighInterest, debtProductive, debtZeroInterest,
      investmentExperience, riskProfile,
      livingSituation, workDevices, deviceBrands, mobilityAssets,
      lifeGoal,
      tangga: { level: tangga.level, name: tangga.name, desc: tangga.desc, icon: tangga.icon, color: tangga.color },
      mode: { label: mode.label, desc: mode.desc, color: mode.color },
      understandingScore,
      insights,
      aiInsights,
    };

    // Phase progression: scanning different data dimensions
    const phases = [0, 1, 2, 3, 4, 5];
    let idx = 0;

    // Start AI analysis in parallel with animation
    const aiPromise = welcomeAnalysisAction({
      name,
      birthDate,
      domicile,
      dependents,
      skills: selectedSkills,
      experience,
      hobbies: selectedHobbies,
      interests: selectedInterests,
      income: numIncome,
      expenses: numExpenses,
      savings: numSavings,
      investment: numInvestment,
      debt: numDebt,
      debtHighInterest,
      debtProductive,
      debtZeroInterest,
      investmentExperience,
      riskProfile,
      formalStatus,
      careerGoal,
      lifeGoal,
      dailyFreeHours: Number(dailyFreeHours),
      livingSituation,
      workDevices,
      deviceBrands,
      mobilityAssets,
      gender,
      insurance,
      tanggaLevel: tangga.level,
      tanggaName: tangga.name,
      mode: mode.label,
    }).catch(() => null);

    // Animate phases while AI works
    const phaseInterval = setInterval(() => {
      idx++;
      if (idx < phases.length) {
        setAnalysisPhase(phases[idx]);
      } else {
        clearInterval(phaseInterval);
      }
    }, 700);

    // Wait for AI to finish (minimum 4.2s for animation)
    const [aiResult] = await Promise.all([
      aiPromise,
      new Promise(resolve => setTimeout(resolve, phases.length * 700)),
    ]);

    // Store AI analysis result in localStorage
    console.log("[Client] AI result:", aiResult);
    if (aiResult) {
      welcomeData.aiWelcomeAnalysis = aiResult;
    }

    try { localStorage.setItem("mentlife_welcome_data", JSON.stringify(welcomeData)); } catch {}

    // Redirect to welcome page
    setTimeout(() => { router.push("/welcome"); }, 500);
  };

  // Computed values for Live Profile Sheet
  const age = birthDate ? calcAge(birthDate) : 0;
  const understandingScore = getUnderstandingScore({
    fullName: name, birthDate, domicile, dependents, gender, insurance, livingSituation, lifeGoal,
    skills: selectedSkills, experience, hobbies: selectedHobbies, interests: selectedInterests,
    formalStatus, educationHistory, careerGoal, primaryFocus, dailyFreeHours, income, expenses, liquidSavings,
    investmentExperience, workDevices, deviceBrands, mobilityAssets
  });
  const insights = getInsights({ skills: selectedSkills, lifeGoal, income });

  // System-determined Tangga & Mode
  const tangga = computeTangga(numIncome, numExpenses, numDebt, numSavings);
  const mode = computeMode(numIncome, numExpenses, numSavings, numDebt);

  const tanggaColorMap: Record<string, string> = { rose: "text-rose-500", amber: "text-amber-500", emerald: "text-emerald-500" };
  const tanggaBgMap: Record<string, string> = { rose: "bg-rose-500/10 border-rose-500/20", amber: "bg-amber-500/10 border-amber-500/20", emerald: "bg-emerald-500/10 border-emerald-500/20" };
  const tanggaTextMap: Record<string, string> = { rose: "text-rose-500", amber: "text-amber-500", emerald: "text-emerald-500" };

  return (
    <div className="w-full flex flex-col h-dvh bg-background text-foreground overflow-hidden">
      <div className="border-border/30 bg-card/40 backdrop-blur-2xl flex flex-col overflow-hidden h-full max-w-lg mx-auto w-full sm:rounded-3xl sm:my-2 sm:border sm:h-[calc(100dvh-16px)]">

        {/* Header — compact */}
        <div className="py-2 px-3 border-b border-border/10 flex items-center gap-2.5 shrink-0">
          <div className="bg-primary/15 p-1.5 rounded-xl ring-1 ring-primary/20">
            <BrainCircuit className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black truncate">{tOb("header.title")}</p>
            <p className="text-[9px] text-muted-foreground">{tOb("header.subtitle")}</p>
          </div>
          <span className="text-[9px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold shrink-0">Lv.{currentStep}/6</span>
          {isSavingDraft && (
            <span className="text-[9px] text-muted-foreground flex items-center gap-1 shrink-0">
              <Loader2 className="w-3 h-3 animate-spin" />
            </span>
          )}
          {isResuming && (
            <span className="text-[9px] text-primary flex items-center gap-1 shrink-0">
              <Loader2 className="w-3 h-3 animate-spin" />
            </span>
          )}
        </div>

        {/* Live Profile Sheet — single row, full-width progress */}
        <div className="mx-3 mt-2 px-3.5 py-2.5 rounded-xl border border-border/30 bg-muted/15 flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold truncate">{name || tCommon("calonMentee")}</p>
              <p className="text-[8px] text-muted-foreground font-medium">Lv.{currentStep}/6</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BrainCircuit className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">{tOb("profileSheet.aiUnderstanding")}</span>
            <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden border border-border/20 min-w-0">
              <div className={`h-full rounded-full transition-all duration-500 ${getUBg(understandingScore)}`} style={{ width: `${understandingScore}%` }} />
            </div>
            <span className={`text-xs font-black tabular-nums shrink-0 ${getUC(understandingScore)}`}>{understandingScore}%</span>
          </div>
        </div>

        {/* Chat Bubbles */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin min-h-0">
          {chatHistory.map((bubble, idx) => {
            // Section dividers between major topic areas
            const showFinanceDivider = bubble.id === "r3" || bubble.id === "r2m";
            const showCareerDivider = bubble.id === "r4" || bubble.id === "r3m";
            return (
              <div key={`wrap_${bubble.id}`}>
                {showFinanceDivider && <SectionDivider icon={Wallet} label={tOb("sectionDividers.finance")} color="text-emerald-500" />}
                {showCareerDivider && <SectionDivider icon={Briefcase} label={tOb("sectionDividers.career")} color="text-blue-400" />}
                <div className={`group relative flex items-start gap-2.5 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300 ${bubble.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                  <div className={`p-1.5 rounded-lg shrink-0 ${bubble.sender === "user" ? "bg-primary/20 text-primary" : "bg-card border border-border/20 text-foreground"}`}>
                    {bubble.sender === "user" ? <User className="w-3.5 h-3.5" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                  </div>
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${bubble.sender === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card/75 border border-border/30 text-foreground rounded-tl-none"}`}>
                    {bubble.content}
                  </div>
                  {/* Edit button on user bubbles — always visible (mobile-first), brighter on hover (desktop) */}
                  {bubble.sender === "user" && bubble.editStep !== undefined && bubble.editStep <= currentStep && (
                    <button
                      type="button"
                      onClick={() => editBubble(bubble.editStep!)}
                      className="absolute -bottom-2 right-0 opacity-40 hover:opacity-100 transition-opacity bg-card border border-border/50 rounded-full p-1.5 shadow-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                      title={tCommon("editAnswer")}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-3 pb-3 pt-2 border-t border-border/10 bg-card/20 shrink-0">

          {/* STEP 0: Identity sub-step */}
          {currentStep === 0 && identitySubStep === 0 && (
            <form onSubmit={handleSendIdentity} className="space-y-2 animate-in fade-in duration-300">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground/50"><User className="w-3.5 h-3.5" /></span>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder={tOb("steps.identity.namePlaceholder")} required
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground/50"><Cake className="w-3.5 h-3.5" /></span>
                  <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                    className="w-[150px] h-10 pl-9 pr-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground/50"><MapPin className="w-3.5 h-3.5" /></span>
                  <input value={domicile} onChange={e => setDomicile(e.target.value)} placeholder={tOb("steps.identity.domicilePlaceholder")} required
                    className="w-full h-10 pl-9 pr-10 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                  <button type="button" onClick={handleDetectGeo} disabled={detectingGeo}
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-primary disabled:opacity-50">
                    {detectingGeo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <Button type="submit" size="icon" className="h-10 w-10 rounded-xl shrink-0"><Send className="w-4 h-4" /></Button>
              </div>
            </form>
          )}

          {currentStep === 0 && identitySubStep === 1 && (
            <form onSubmit={handleSendIdentity} className="space-y-2 animate-in fade-in duration-300">
              <div className="flex gap-2">
                {GENDER_OPTIONS.map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${gender === g ? "bg-primary/20 text-primary border-primary" : "bg-background text-muted-foreground border-border/80 hover:border-border"}`}>
                    {g}
                  </button>
                ))}
              </div>
              <Button type="submit" disabled={!gender} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
            </form>
          )}

          {currentStep === 0 && identitySubStep === 2 && (
            <form onSubmit={handleSendIdentity} className="space-y-2 animate-in fade-in duration-300">
              <div className="flex flex-wrap gap-1.5 p-1.5 border border-border/40 rounded-xl">
                {INSURANCE_OPTIONS.map(opt => (
                  <button key={opt} type="button" onClick={() => setInsurance(opt)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${insurance === opt ? "bg-primary/20 text-primary border-primary" : "bg-background text-muted-foreground border-border/80 hover:border-border"}`}>
                    {opt}
                  </button>
                ))}
              </div>
              <Button type="submit" disabled={!insurance} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
            </form>
          )}

          {/* STEP 1: Skills & Experience — sub-step flow */}
          {currentStep === 1 && subStep === 0 && (
            <form onSubmit={handleSendSkills} className="animate-in fade-in duration-300 flex flex-col" style={{ maxHeight: "280px" }}>
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedSkills.map(skill => (
                      <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                        className="px-2 py-1 rounded-lg text-[9px] font-bold bg-primary text-primary-foreground border border-primary flex items-center gap-1">
                        {skill} <span className="opacity-60 hover:opacity-100">&times;</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1 p-1.5 border border-border/40 rounded-xl">
                  {SKILL_PRESETS.map(skill => {
                    const active = selectedSkills.includes(skill);
                    return (
                      <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${active ? "bg-primary/20 text-primary border-primary" : "bg-background text-muted-foreground border-border/80 hover:border-border"}`}>
                        {skill}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-1.5">
                  <input value={customSkill} onChange={e => setCustomSkill(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomSkill(); } }}
                    placeholder={tOb("steps.skills.addCustom")}
                    className="flex-1 h-9 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                  <button type="button" onClick={addCustomSkill}
                    className="h-9 px-3 rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/30 hover:bg-primary/20 transition-colors">
                    {tCommon("add")}
                  </button>
                </div>
              </div>
              <div className="shrink-0 pt-2">
                <Button type="submit" disabled={selectedSkills.length === 0} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
              </div>
            </form>
          )}

          {currentStep === 1 && subStep === 1 && (
            <form onSubmit={handleSendSkills} className="space-y-2 animate-in fade-in duration-300">
              <div className="flex gap-2">
                <input value={experience} onChange={e => setExperience(e.target.value)} placeholder={tOb("steps.skills.placeholder")} required
                  className="flex-1 h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                <Button type="submit" disabled={!experience.trim()} className="h-10 px-4 rounded-xl text-xs font-bold shrink-0">{tCommon("submit")}</Button>
              </div>
            </form>
          )}

          {currentStep === 1 && subStep === 2 && (
            <form onSubmit={handleSendSkills} className="space-y-2 animate-in fade-in duration-300">
              <textarea value={skillStory} onChange={e => setSkillStory(e.target.value.slice(0, 300))} rows={3} maxLength={300}
                placeholder={tOb("steps.skills.storyPlaceholder")}
                className="w-full px-3 py-2 rounded-xl border border-border/40 bg-background text-xs focus:outline-none focus:border-primary resize-none" />
              <div className="flex gap-2">
                <button type="button" onClick={skipSkillStory}
                  className="flex-1 h-10 rounded-xl text-xs font-bold border border-border/60 text-muted-foreground hover:bg-muted transition-colors">
                  {tCommon("skip")}
                </button>
                <Button type="submit" className="h-10 px-4 rounded-xl text-xs font-bold shrink-0">{tCommon("submit")}</Button>
              </div>
            </form>
          )}

          {/* STEP 2: Hobbies & Interests — sub-step flow */}
          {currentStep === 2 && subStep === 0 && (
            <form onSubmit={handleSendHobbies} className="animate-in fade-in duration-300 flex flex-col" style={{ maxHeight: "280px" }}>
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
                {selectedHobbies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedHobbies.map(h => (
                      <button key={h} type="button" onClick={() => toggleHobby(h)}
                        className="px-2 py-1 rounded-lg text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        {h} <span className="opacity-60 hover:opacity-100">&times;</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[8px] font-bold text-muted-foreground uppercase">{tOb("steps.hobbies.hobbyLabel")}</p>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {HOBBY_PRESETS.map(item => {
                    const active = selectedHobbies.includes(item);
                    return (
                      <button key={item} type="button" onClick={() => toggleHobby(item)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-background text-muted-foreground border-border/80 hover:border-border"}`}>
                        {item}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-1.5">
                  <input value={customHobby} onChange={e => setCustomHobby(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomHobby(); } }}
                    placeholder={tOb("steps.hobbies.addCustom")}
                    className="flex-1 h-8 px-3 rounded-lg border border-border/60 bg-background text-[10px] focus:outline-none focus:border-primary" />
                  <button type="button" onClick={addCustomHobby}
                    className="h-8 px-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">
                    {tCommon("add")}
                  </button>
                </div>
              </div>
              <div className="shrink-0 pt-2">
                <Button type="submit" disabled={selectedHobbies.length === 0} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
              </div>
            </form>
          )}

          {currentStep === 2 && subStep === 1 && (
            <form onSubmit={handleSendHobbies} className="animate-in fade-in duration-300 flex flex-col" style={{ maxHeight: "280px" }}>
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
                {selectedInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedInterests.map(i => (
                      <button key={i} type="button" onClick={() => toggleInterest(i)}
                        className="px-2 py-1 rounded-lg text-[9px] font-bold bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center gap-1">
                        {i} <span className="opacity-60 hover:opacity-100">&times;</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[8px] font-bold text-muted-foreground uppercase">{tOb("steps.hobbies.interestLabel")}</p>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {INTEREST_PRESETS.map(item => {
                    const active = selectedInterests.includes(item);
                    return (
                      <button key={item} type="button" onClick={() => toggleInterest(item)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${active ? "bg-violet-500/20 text-violet-400 border-violet-500/30" : "bg-background text-muted-foreground border-border/80 hover:border-border"}`}>
                        {item}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-1.5">
                  <input value={customInterest} onChange={e => setCustomInterest(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomInterest(); } }}
                    placeholder={tOb("steps.hobbies.addCustomInterest")}
                    className="flex-1 h-8 px-3 rounded-lg border border-border/60 bg-background text-[10px] focus:outline-none focus:border-primary" />
                  <button type="button" onClick={addCustomInterest}
                    className="h-8 px-2.5 rounded-lg bg-violet-500/10 text-violet-400 text-[10px] font-bold border border-violet-500/30 hover:bg-violet-500/20 transition-colors">
                    {tCommon("add")}
                  </button>
                </div>
              </div>
              <div className="shrink-0 pt-2">
                <Button type="submit" disabled={selectedInterests.length === 0} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
              </div>
            </form>
          )}

          {currentStep === 2 && subStep === 2 && (
            <form onSubmit={handleSendHobbies} className="space-y-2 animate-in fade-in duration-300">
              <textarea value={hobbyStory} onChange={e => setHobbyStory(e.target.value.slice(0, 300))} rows={3} maxLength={300}
                placeholder={tOb("steps.hobbies.storyQuestion")}
                className="w-full px-3 py-2 rounded-xl border border-border/40 bg-background text-xs focus:outline-none focus:border-primary resize-none" />
              <div className="flex gap-2">
                <button type="button" onClick={skipHobbyStory}
                  className="flex-1 h-10 rounded-xl text-xs font-bold border border-border/60 text-muted-foreground hover:bg-muted transition-colors">
                  {tCommon("skip")}
                </button>
                <Button type="submit" className="h-10 px-4 rounded-xl text-xs font-bold shrink-0">{tCommon("submit")}</Button>
              </div>
            </form>
          )}

          {/* STEP 3: Financial Details — one question at a time */}
          {currentStep === 3 && (
            <>
              {financeSubStep === 0 && (
                <form onSubmit={handleSendFinancialsSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.finance.incomeLabel")}</Label>
                    <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.finance.incomeHelper")}</p>
                    <input type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder={tOb("steps.finance.incomePlaceholder")} required
                      className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                  </div>
                  <Button type="submit" disabled={!income} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                </form>
              )}
              {financeSubStep === 1 && (
                <form onSubmit={handleSendFinancialsSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.finance.expenseLabel")}</Label>
                    <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.finance.expenseHelper")}</p>
                    <input type="number" value={expenses} onChange={e => setExpenses(e.target.value)} placeholder={tOb("steps.finance.expensePlaceholder")} required
                      className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                  </div>
                  <Button type="submit" disabled={!expenses} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                </form>
              )}
              {financeSubStep === 2 && (
                <form onSubmit={handleSendFinancialsSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.finance.savingsLabel")}</Label>
                    <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.finance.savingsHelper")}</p>
                    <input type="number" value={liquidSavings} onChange={e => setLiquidSavings(e.target.value)} placeholder={tOb("steps.finance.savingsPlaceholder")}
                      className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                  </div>
                  <Button type="submit" className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                </form>
              )}
              {financeSubStep === 3 && (
                <form onSubmit={handleSendFinancialsSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="flex flex-wrap gap-1.5 p-1.5 border border-border/40 rounded-xl">
                    {DEPENDENT_OPTIONS.map(opt => (
                      <button key={opt} type="button" onClick={() => setDependents(opt)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${dependents === opt ? "bg-primary/20 text-primary border-primary" : "bg-background text-muted-foreground border-border/80 hover:border-border"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  <Button type="submit" className="w-full h-10 rounded-xl text-xs font-bold">Lanjut</Button>
                </form>
              )}
              {financeSubStep === 4 && (
                <form onSubmit={handleSendFinancialsSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold uppercase text-rose-400">{tOb("steps.finance.debtEstimateLabel")}</Label>
                    <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.finance.debtHelper")}</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-muted-foreground w-24 shrink-0">{tOb("steps.finance.debtHighLabel")}</span>
                        <input type="number" value={debtHighInterest} onChange={e => setDebtHighInterest(e.target.value)} placeholder={tOb("steps.finance.debtHighPlaceholder")}
                          className="flex-1 h-9 px-3 rounded-lg border border-rose-500/30 bg-background text-[10px] focus:outline-none focus:border-rose-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-muted-foreground w-24 shrink-0">{tOb("steps.finance.debtProductiveLabel")}</span>
                        <input type="number" value={debtProductive} onChange={e => setDebtProductive(e.target.value)} placeholder={tOb("steps.finance.debtProductivePlaceholder")}
                          className="flex-1 h-9 px-3 rounded-lg border border-amber-500/30 bg-background text-[10px] focus:outline-none focus:border-amber-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-muted-foreground w-24 shrink-0">{tOb("steps.finance.debtZeroLabel")}</span>
                        <input type="number" value={debtZeroInterest} onChange={e => setDebtZeroInterest(e.target.value)} placeholder={tOb("steps.finance.debtZeroPlaceholder")}
                          className="flex-1 h-9 px-3 rounded-lg border border-border/40 bg-background text-[10px] focus:outline-none focus:border-border" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={skipDebt}
                      className="flex-1 h-10 rounded-xl text-xs font-bold border border-border/60 text-muted-foreground hover:bg-muted transition-colors">
                      {tOb("steps.finance.noDebt")}
                    </button>
                    <Button type="submit" className="h-10 px-4 rounded-xl text-xs font-bold shrink-0">{tCommon("next")}</Button>
                  </div>
                </form>
              )}
              {financeSubStep === 5 && (
                <form onSubmit={handleSendFinancialsSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.finance.investmentLabel")}</Label>
                    <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.finance.investmentHelper")}</p>
                    <input type="number" value={investmentValue} onChange={e => setInvestmentValue(e.target.value)} placeholder={tOb("steps.finance.investmentPlaceholder")}
                      className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                  </div>
                  <Button type="submit" className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                </form>
              )}
              {financeSubStep === 6 && (
                <form onSubmit={handleSendFinancialsSub} className="animate-in fade-in duration-300 flex flex-col" style={{ maxHeight: "280px" }}>
                  <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                    <div className="flex flex-wrap gap-1.5 p-1.5 border border-border/40 rounded-xl">
                      {INVESTMENT_EXPERIENCE_OPTIONS.map(exp => {
                        const active = investmentExperience.includes(exp);
                        return (
                          <button key={exp} type="button" onClick={() => toggleInvestmentExp(exp)}
                            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${active ? "bg-primary/20 text-primary border-primary" : "bg-background text-muted-foreground border-border/80 hover:border-border"}`}>
                            {exp}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="shrink-0 pt-2">
                    <Button type="submit" className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                  </div>
                </form>
              )}
              {financeSubStep === 7 && (
                <form onSubmit={handleSendFinancialsSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.finance.riskLabel")}</Label>
                    <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.finance.riskHelper")}</p>
                    <select value={riskProfile} onChange={e => setRiskProfile(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary">
                      <option value="konservatif">{tOb("steps.finance.riskLabels.konservatif")}</option>
                      <option value="moderat">{tOb("steps.finance.riskLabels.moderat")}</option>
                      <option value="agresif">{tOb("steps.finance.riskLabels.agresif")}</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("done")}</Button>
                </form>
              )}
            </>
          )}

          {/* STEP 4: Career & Goals — one question at a time, dynamic follow-ups */}
          {currentStep === 4 && (
            <>
              {careerSubStep === 0 && (
                <form onSubmit={handleSendCareerSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.career.statusLabel")}</Label>
                    <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.career.statusHelper")}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FORMAL_STATUS_OPTIONS.map(opt => {
                      const active = formalStatus === opt && !customCareerStatus.trim();
                      return (
                        <button key={opt} type="button" onClick={() => { setFormalStatus(opt); setCustomCareerStatus(""); }}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border/80 hover:border-border"}`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input value={customCareerStatus} onChange={e => { setCustomCareerStatus(e.target.value); if (e.target.value.trim()) setFormalStatus(""); }}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (customCareerStatus.trim()) { setFormalStatus(""); } } }}
                      placeholder={tOb("steps.career.customStatusPlaceholder")}
                      className="flex-1 h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                  </div>
                  <Button type="submit" disabled={!formalStatus && !customCareerStatus.trim()} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                </form>
              )}
              {careerSubStep === 1 && (() => {
                const s = (customCareerStatus.trim() || formalStatus).toLowerCase();
                if (s.includes("karyawan")) {
                  return (
                    <form onSubmit={handleSendCareerSub} className="space-y-2 animate-in fade-in duration-300">
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.career.companyLabel")}</Label>
                          <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder={tOb("steps.career.companyPlaceholder")}
                            className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.career.positionLabel")}</Label>
                          <input value={jobRole} onChange={e => setJobRole(e.target.value)} placeholder={tOb("steps.career.positionPlaceholder")}
                            className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                        </div>
                      </div>
                      <Button type="submit" disabled={!companyName.trim() || !jobRole.trim()} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                    </form>
                  );
                }
                if (s.includes("pengusaha") || s.includes("wirausaha")) {
                  return (
                    <form onSubmit={handleSendCareerSub} className="space-y-2 animate-in fade-in duration-300">
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.career.businessNameLabel")}</Label>
                          <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder={tOb("steps.career.businessNamePlaceholder")}
                            className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.career.businessFieldLabel")}</Label>
                          <input value={businessField} onChange={e => setBusinessField(e.target.value)} placeholder={tOb("steps.career.businessFieldPlaceholder")}
                            className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                        </div>
                      </div>
                      <Button type="submit" disabled={!businessName.trim() || !businessField.trim()} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                    </form>
                  );
                }
                if (s.includes("mahasiswa")) {
                  return (
                    <form onSubmit={handleSendCareerSub} className="space-y-2 animate-in fade-in duration-300">
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.career.universityLabel")}</Label>
                          <input value={universityName} onChange={e => setUniversityName(e.target.value)} placeholder={tOb("steps.career.universityPlaceholder")}
                            className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.career.majorLabel")}</Label>
                          <input value={studyMajor} onChange={e => setStudyMajor(e.target.value)} placeholder={tOb("steps.career.majorPlaceholder")}
                            className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                        </div>
                      </div>
                      <Button type="submit" disabled={!universityName.trim() || !studyMajor.trim()} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                    </form>
                  );
                }
                if (s.includes("freelance")) {
                  return (
                    <form onSubmit={handleSendCareerSub} className="space-y-2 animate-in fade-in duration-300">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.career.freelanceLabel")}</Label>
                        <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.career.freelanceHelper")}</p>
                        <input value={freelanceField} onChange={e => setFreelanceField(e.target.value)} placeholder={tOb("steps.career.freelancePlaceholder")}
                          className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                      </div>
                      <Button type="submit" disabled={!freelanceField.trim()} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                    </form>
                  );
                }
                if (s.includes("menganggur") || s.includes("mencari")) {
                  return (
                    <form onSubmit={handleSendCareerSub} className="space-y-2 animate-in fade-in duration-300">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.career.desiredRoleLabel")}</Label>
                        <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.career.desiredRoleHelper")}</p>
                        <input value={desiredRole} onChange={e => setDesiredRole(e.target.value)} placeholder={tOb("steps.career.desiredRolePlaceholder")}
                          className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                      </div>
                      <Button type="submit" disabled={!desiredRole.trim()} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                    </form>
                  );
                }
                // Custom / other status — generic detail
                return (
                  <form onSubmit={handleSendCareerSub} className="space-y-2 animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.career.detailLabel")}</Label>
                      <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.career.detailPlaceholder")}</p>
                      <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder={tOb("steps.career.detailPlaceholder")}
                        className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                    </div>
                    <Button type="submit" disabled={!companyName.trim()} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                  </form>
                );
              })()}
              {careerSubStep === 2 && (
                <form onSubmit={handleSendCareerSub} className="animate-in fade-in duration-300 flex flex-col" style={{ maxHeight: "280px" }}>
                  <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-2">
                    <div className="flex flex-wrap gap-1.5 p-1.5 border border-border/40 rounded-xl">
                      {EDUCATION_PRESETS.map(edu => {
                        const active = educationHistory.includes(edu);
                        return (
                          <button key={edu} type="button" onClick={() => toggleEducation(edu)}
                            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${active ? "bg-primary/20 text-primary border-primary" : "bg-background text-muted-foreground border-border/80 hover:border-border"}`}>
                            {edu}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-1.5">
                      <input value={customEducation} onChange={e => setCustomEducation(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomEducation(); } }}
                        placeholder={tOb("steps.career.educationPlaceholder")}
                        className="flex-1 h-9 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                      <button type="button" onClick={addCustomEducation}
                        className="h-9 px-3 rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/30 hover:bg-primary/20 transition-colors">
                        {tCommon("add")}
                      </button>
                    </div>
                  </div>
                  <div className="shrink-0 pt-2">
                    <Button type="submit" className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                  </div>
                </form>
              )}
              {careerSubStep === 3 && (
                <form onSubmit={handleSendCareerSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.career.careerGoalLabel")}</Label>
                    <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.career.careerGoalHelper")}</p>
                    <input value={careerGoal} onChange={e => setCareerGoal(e.target.value)} placeholder={tOb("steps.career.careerGoalPlaceholder")}
                      className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                  </div>
                  <Button type="submit" disabled={!careerGoal.trim()} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                </form>
              )}
              {careerSubStep === 4 && (
                <form onSubmit={handleSendCareerSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.career.focusLabel")}</Label>
                    <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.career.focusHelper")}</p>
                    <input value={primaryFocus} onChange={e => setPrimaryFocus(e.target.value)} placeholder={tOb("steps.career.focusPlaceholder")}
                      className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary" />
                  </div>
                  <Button type="submit" disabled={!primaryFocus.trim()} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                </form>
              )}
              {careerSubStep === 5 && (
                <form onSubmit={handleSendCareerSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.career.hoursLabel")}</Label>
                    <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.career.hoursHelper")}</p>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                      <select value={dailyFreeHours} onChange={e => setDailyFreeHours(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary appearance-none">
                        {FREE_HOURS_OPTIONS.map((h, i) => (
                          <option key={h} value={["1", "3", "5", "8"][i]}>{h} {tOb("steps.career.perDay")}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                </form>
              )}
              {careerSubStep === 6 && (
                <form onSubmit={handleSendCareerSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.career.lifeGoalLabel")}</Label>
                    <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.career.lifeGoalHelper")}</p>
                    <textarea value={lifeGoal} onChange={e => setLifeGoal(e.target.value.slice(0, 200))} rows={3} maxLength={200}
                      placeholder={tOb("steps.career.lifeGoalPlaceholder")}
                      className="w-full px-3 py-2 rounded-xl border border-border/40 bg-background text-xs focus:outline-none focus:border-primary resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={skipLifeGoal}
                      className="flex-1 h-10 rounded-xl text-xs font-bold border border-border/60 text-muted-foreground hover:bg-muted transition-colors">
                      {tCommon("skip")}
                    </button>
                    <Button type="submit" className="h-10 px-4 rounded-xl text-xs font-bold shrink-0">{tCommon("next")}</Button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* STEP 5: Living & Assets — one question at a time */}
          {currentStep === 5 && (
            <>
              {livingSubStep === 0 && (
                <form onSubmit={handleSendLivingSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.living.livingLabel")}</Label>
                    <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.living.livingHelper")}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(livingOptions).map(([, [val, label]]) => {
                      const active = livingSituation === val;
                      return (
                        <button key={val} type="button" onClick={() => setLivingSituation(val)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${livingSituation === val ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border/80 hover:border-border"}`}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <Button type="submit" disabled={!livingSituation} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                </form>
              )}
              {livingSubStep === 1 && (
                <form onSubmit={handleSendLivingSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.living.deviceLabel")}</Label>
                    <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.living.deviceHelper")}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {WORK_DEVICE_OPTIONS.map(dev => {
                      const active = workDevices.includes(dev);
                      return (
                        <button key={dev} type="button" onClick={() => toggleDevice(dev)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border/80 hover:border-border"}`}>
                          {dev}
                        </button>
                      );
                    })}
                  </div>
                  <Button type="submit" disabled={workDevices.length === 0} className="w-full h-10 rounded-xl text-xs font-bold">{tCommon("next")}</Button>
                </form>
              )}
              {livingSubStep === 2 && (
                <form onSubmit={handleSendLivingSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.living.brandLabel")}</Label>
                    <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.living.brandHelper")}</p>
                  </div>
                  <div className="space-y-1.5">
                    {workDevices.map(dev => (
                      <div key={dev} className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-muted-foreground w-28 shrink-0 truncate">{dev}</span>
                        <input
                          type="text"
                          value={deviceBrands[dev] || ""}
                          onChange={e => setDeviceBrands(prev => ({ ...prev, [dev]: e.target.value }))}
                          placeholder={`${tOb("steps.living.brandPlaceholder")} ${dev.toLowerCase()}...`}
                          className="flex-1 h-9 px-3 rounded-lg border border-border/50 bg-background text-[10px] focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                  <Button type="submit" className="w-full h-10 rounded-xl text-xs font-bold">
                    {workDevices.some(d => deviceBrands[d]?.trim()) ? tCommon("next") : tCommon("skip")}
                  </Button>
                </form>
              )}
              {livingSubStep === 3 && (
                <form onSubmit={handleSendLivingSub} className="space-y-2 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">{tOb("steps.living.mobilityLabel")}</Label>
                    <p className="text-[9px] text-muted-foreground/60 leading-snug">{tOb("steps.living.mobilityHelper")}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {MOBILITY_OPTIONS.map(asset => {
                      const active = mobilityAssets.includes(asset);
                      return (
                        <button key={asset} type="button" onClick={() => toggleMobility(asset)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border/80 hover:border-border"}`}>
                          {asset}
                        </button>
                      );
                    })}
                  </div>
                  <Button type="submit" disabled={mobilityAssets.length === 0} className="w-full h-10 rounded-xl text-xs font-bold">{tOb("steps.living.confirmNext")}</Button>
                </form>
              )}
            </>
          )}

          {/* STEP 6: AI Analysis Loading → redirect to /welcome */}
          {currentStep === 6 && !isAnalyzing && (
            <div className="flex flex-col items-center py-8 animate-in zoom-in-95 duration-500">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-amber-500" />
              </div>
              <p className="text-sm font-black text-foreground mb-1">{tAn("readyTitle")}</p>
              <p className="text-[10px] text-muted-foreground text-center mb-6 max-w-[260px]">{tAn("readyDesc")}</p>
              <form id="onboarding-final-form" onSubmit={handleStartAnalysis} className="w-full space-y-2">
                {/* Hidden form fields — submitted from /welcome page */}
                <input type="hidden" name="fullName" value={name} />
                <input type="hidden" name="displayName" value={name} />
                <input type="hidden" name="birthDate" value={birthDate} />
                <input type="hidden" name="domicile" value={domicile} />
                <input type="hidden" name="dependents" value={dependents} />
                <input type="hidden" name="gender" value={gender} />
                <input type="hidden" name="insurance" value={insurance} />
                <input type="hidden" name="livingSituation" value={livingSituation} />
                <input type="hidden" name="lifeGoal" value={lifeGoal} />
                <input type="hidden" name="skills" value={selectedSkills.join(",")} />
                <input type="hidden" name="experience" value={experience} />
                <input type="hidden" name="skillStory" value={skillStory} />
                <input type="hidden" name="hobbies" value={selectedHobbies.join(",")} />
                <input type="hidden" name="hobbyStory" value={hobbyStory} />
                <input type="hidden" name="interests" value={selectedInterests.join(",")} />
                <input type="hidden" name="interestStory" value={interestStory} />
                <input type="hidden" name="formalStatus" value={formalStatus} />
                <input type="hidden" name="customCareerStatus" value={customCareerStatus} />
                <input type="hidden" name="careerState" value={customCareerStatus.trim() || formalStatus} />
                <input type="hidden" name="companyName" value={companyName} />
                <input type="hidden" name="jobRole" value={jobRole} />
                <input type="hidden" name="businessName" value={businessName} />
                <input type="hidden" name="businessField" value={businessField} />
                <input type="hidden" name="universityName" value={universityName} />
                <input type="hidden" name="studyMajor" value={studyMajor} />
                <input type="hidden" name="freelanceField" value={freelanceField} />
                <input type="hidden" name="desiredRole" value={desiredRole} />
                <input type="hidden" name="careerGoal" value={careerGoal} />
                <input type="hidden" name="educationHistory" value={educationHistory.join(",")} />
                <input type="hidden" name="primaryFocus" value={primaryFocus} />
                <input type="hidden" name="dailyFreeHours" value={dailyFreeHours} />
                <input type="hidden" name="monthlyIncome" value={income} />
                <input type="hidden" name="fixedExpenses" value={expenses} />
                <input type="hidden" name="liquidSavings" value={liquidSavings} />
                <input type="hidden" name="investmentValue" value={investmentValue} />
                <input type="hidden" name="totalDebt" value={String(numDebt)} />
                <input type="hidden" name="debtHighInterest" value={debtHighInterest} />
                <input type="hidden" name="debtProductive" value={debtProductive} />
                <input type="hidden" name="debtZeroInterest" value={debtZeroInterest} />
                <input type="hidden" name="investmentExperience" value={investmentExperience.join(",")} />
                <input type="hidden" name="riskProfile" value={riskProfile} />
                <input type="hidden" name="workDevices" value={workDevices.join(",")} />
                <input type="hidden" name="deviceBrands" value={JSON.stringify(deviceBrands)} />
                <input type="hidden" name="mobilityAssets" value={mobilityAssets.join(",")} />
                <input type="hidden" name="financialPath" value={`Tangga ${tangga.level}: ${tangga.name}`} />

                <div className="flex gap-2">
                  <Button type="button" onClick={() => { setCurrentStep(5); setLivingSubStep(0); }}
                    className="h-12 w-12 rounded-xl bg-muted/50 border border-border/30 text-muted-foreground hover:bg-muted shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button type="submit"
                    className="flex-1 h-12 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all">
                    <><span>{tAn("startAnalysis")}</span><BrainCircuit className="w-4 h-4" /></>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Full-screen AI Analysis Loading */}
          {currentStep === 6 && isAnalyzing && (
            <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center animate-in fade-in duration-500">
              {/* Background glow effects */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl" />

              {/* Futuristic pulsing orb */}
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full bg-primary/20 animate-ping absolute inset-0" />
                <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse absolute inset-0" style={{ animationDelay: "0.5s" }} />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/40">
                  <BrainCircuit className="w-11 h-11 text-primary-foreground animate-pulse" />
                </div>
                {/* Orbiting dots */}
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                </div>
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: "4s", animationDirection: "reverse" }}>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-2 h-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
                </div>
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: "5s" }}>
                  <div className="absolute top-1/2 right-0 translate-x-2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                </div>
              </div>

              {/* Title */}
              <p className="text-base font-black text-foreground mb-1">{tAn("analyzingTitle")}</p>
              <p className="text-[11px] text-muted-foreground mb-8">{tAn("analyzingDesc")}</p>

              {/* Scanning phases */}
              <div className="w-full max-w-[320px] space-y-2.5 px-4">
                {([
                  { label: tAn("scanning.0"), icon: User },
                  { label: tAn("scanning.1"), icon: Wallet },
                  { label: tAn("scanning.2"), icon: Award },
                  { label: tAn("scanning.3"), icon: Briefcase },
                  { label: tAn("scanning.4"), icon: Target },
                  { label: tAn("scanning.5"), icon: Sparkles },
                ] as const).map((item, i) => {
                  const Icon = item.icon;
                  const isActive = analysisPhase === i;
                  const isDone = analysisPhase > i;
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${
                      isActive ? "bg-primary/10 border border-primary/30 scale-[1.02]" : isDone ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-card/30 border border-border/10 opacity-40"
                    }`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isActive ? "bg-primary/20 text-primary" : isDone ? "bg-emerald-500/20 text-emerald-400" : "bg-muted/30 text-muted-foreground"
                      }`}>
                        {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-[11px] font-semibold transition-all duration-300 ${
                        isActive ? "text-primary" : isDone ? "text-emerald-400" : "text-muted-foreground"
                      }`}>{item.label}</span>
                      {isActive && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-auto" />}
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-[320px] mt-6 px-4">
                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary via-cyan-400 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${((analysisPhase + 1) / 6) * 100}%` }} />
                </div>
                <p className="text-[9px] text-muted-foreground/60 text-center mt-2">{Math.round(((analysisPhase + 1) / 6) * 100)}% {tAn("percentComplete")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
