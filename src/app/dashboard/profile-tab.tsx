"use client";

import { useState, useTransition } from "react";
import { updateProfileAction, updateSandboxAction } from "@/features/dashboard/actions";
import { logoutAction } from "@/features/auth/actions";
import { useApp } from "@/context/app-context";
import {
  User, Briefcase, Star, Wallet, Menu,
  LogOut, Save, Plus, BrainCircuit, Heart, Target, Shield, Zap, MapPin, Accessibility, Laptop, Milestone, Info, Loader2,
  ChevronDown
} from "lucide-react";
import { ProfileProgress, SectionHeader, SectionTabs, ToggleList, FinancialInputGroup, InfoBanner, ActionButton } from "./profile-components";
import { cn } from "@/lib/utils";
import { ProfileData, FinancialProfileData, UsersCoreData } from "@/types/profile";
import CareerProfileTab from "./CareerProfileTab";
import FinanceProfileTab from "./FinanceProfileTab";

const SKILL_LIST = ["Programming", "Graphic Design", "Copywriting", "Video Editing", "Sales & Marketing", "Data Analysis", "Teaching/Mentoring", "Excel/Admin", "Public Speaking", "Content Creator", "Social Media", "Photography", "Desain Interior", "Memasak", "Musik", "Bahasa Asing", "Customer Service", "Akuntansi", "Desain Fashion", "Animasi/Ilustrasi"];
const HOBBY_LIST = ["Gaming", "Writing/Blogging", "Photography", "Cooking/Baking", "Fitness/Gym", "Art/Drawing", "Traveling", "Musik/Bernyanyi", "Membaca", "Berkebun", "DIY/Craft", "Hiking/Outdoor", "Dancing", "Podcasting", "Streaming", "Fashion", "Otomotif", "Coding/Tech", "Film/Sinema", "Olahraga"];
const INTEREST_LIST = ["Bisnis Online", "Kecerdasan Buatan (AI)", "Personal Finance", "E-commerce", "Kesehatan & Wellness", "Investasi & Saham", "Teknologi", "Pendidikan", "Lingkungan", "Politik & Sosial", "Seni & Cultur", "Parenting", "Kuliner", "Traveling", "Gaming Industry", "Media & Hiburan"];
const IKIGAI_PASSION_LIST = ["Kreativitas", "Membantu Orang", "Belajar Baru", "Kemandirian", "Pengakuan", "Kebebasan", "Keseimbangan Hidup"];
const IKIGAI_PROFESSION_LIST = ["Kerja Keras", "Konsistensi", "Adaptif", "Kolaboratif", "Inovatif", "Pemecah Masalah", "Leadership"];
const IKIGAI_MISSION_LIST = ["Memberdayakan Orang", "Menciptakan Perubahan", "Meningkatkan Kualitas Hidup", "Mendorong Pertumbuhan", "Menciptakan Nilai"];
const IKIGAI_VOCATION_LIST = ["Karir Utama", "Side Hustle", "Volunteer", "Mentoring", "Komunitas"];
const CHALLENGE_LIST = ["Sulit Menabung", "Arah Karir Tidak Jelas", "Burnout & Kelelahan", "Kurang Disiplin", "Waktu Terbatas", "Sumber Daya Minim", "Kurang Motivasi"];
const MOTIVATION_LIST = ["Pengakuan", "Pendapatan", "Kebahagiaan", "Kesehatan", "Kemandirian", "Pertumbuhan", "Dampak Sosial"];



interface ProfileTabProps {
  profile: ProfileData;
  finance: FinancialProfileData;
  usersCore: UsersCoreData;
  aiInsights?: { understandingScore: number; insights: string[] };
  extendedProfile?: { background?: string; career_state?: string; life_goal?: string };
}

export default function ProfileTab({ profile, finance, usersCore, aiInsights, extendedProfile }: ProfileTabProps) {
  const { theme, setTheme, lang, setLang } = useApp();
  const [isPending, startTransition] = useTransition();
  const [section, setSection] = useState<"personal" | "career" | "finance">("personal");
  const [saveMsg, setSaveMsg] = useState("");
  const [showSheet, setShowSheet] = useState(false);
  const [aiMemoryExpanded, setAiMemoryExpanded] = useState(false);

  const understandingScore = aiInsights?.understandingScore || calculateUnderstandingScore(profile, finance, usersCore);
  const aiInsightList = aiInsights?.insights || generateInsights(profile, finance, usersCore);

  const [fullName, setFullName] = useState(profile.full_name || "");
  const [displayName, setDisplayName] = useState(usersCore.display_name || "");
  const [age, setAge] = useState(profile.age ? String(profile.age) : "");
  const [birthDate, setBirthDate] = useState(usersCore.birth_date || "");
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan' | 'Memilih untuk tidak menjawab'>(usersCore.gender || "Memilih untuk tidak menjawab");
  const [domicile, setDomicile] = useState(usersCore.domicile || "");
  const [detectingGeo, setDetectingGeo] = useState(false);
  const [livingSituation, setLivingSituation] = useState<'Tinggal Bersama Orang Tua/Keluarga' | 'Sewa/Ngekost Bulanan' | 'Sewa/Kontrak Tahunan' | 'Milik Sendiri (KPR)' | 'Milik Sendiri (Lunas)'>(usersCore.living_situation || "Tinggal Bersama Orang Tua/Keluarga");
  const [background, setBackground] = useState(extendedProfile?.background || "");
  const [lifeGoal, setLifeGoal] = useState(usersCore.life_goal || extendedProfile?.life_goal || profile.life_goal || "");
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married' | 'previously_married' | 'pacaran'>(usersCore.marital_status || "single");
  const [isSandwichGen, setIsSandwichGen] = useState(!!usersCore.is_sandwich_gen);
  const [dependentsCount, setDependentsCount] = useState(String(usersCore.dependents_count || "0"));
  const [hasPhysicalLimitation, setHasPhysicalLimitation] = useState(!!usersCore.has_physical_limitation);
  const [physicalLimitationDetails, setPhysicalLimitationDetails] = useState(usersCore.physical_limitation_details || "");
  const [workDevices, setWorkDevices] = useState<string[]>(usersCore.work_devices || []);
  const [mobilityAssets, setMobilityAssets] = useState<string[]>(usersCore.mobility_assets || []);
  const [customDeviceInput, setCustomDeviceInput] = useState("");
  const [customMobilityInput, setCustomMobilityInput] = useState("");

  const [careerState, setCareerState] = useState(extendedProfile?.career_state || "");
  const [experience, setExperience] = useState(profile.experience || "");
  const [careerGoal, setCareerGoal] = useState(profile.career_goal || "");
  const [formalStatus, setFormalStatus] = useState<any>(usersCore.formal_status || "Karyawan");
  const [primaryFocus, setPrimaryFocus] = useState(usersCore.primary_focus || "");
  const [dailyFreeHours, setDailyFreeHours] = useState(String(usersCore.daily_free_hours || "2"));
  const [ownedAssets, setOwnedAssets] = useState<string[]>(usersCore.owned_assets || []);

  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [hobbies, setHobbies] = useState<string[]>(profile.hobbies || []);
  const [interests, setInterests] = useState<string[]>(profile.interests || []);
  const [customSkill, setCustomSkill] = useState("");

  const [educationOptions, setEducationOptions] = useState<string[]>(profile.education_options || []);
  const [educationStory, setEducationStory] = useState(profile.education_story || "");
  const [statusOptions, setStatusOptions] = useState<string[]>(profile.status_options || []);
  const [statusStory, setStatusStory] = useState(profile.status_story || "");
  const [skillsStory, setSkillsStory] = useState(profile.skills_story || "");
  const [hobbiesStory, setHobbiesStory] = useState(profile.hobbies_story || "");
  const [interestsStory, setInterestsStory] = useState(profile.interests_story || "");
  const [northStarOptions, setNorthStarOptions] = useState<string[]>(profile.north_star_options || []);
  const [northStarStory, setNorthStarStory] = useState(profile.north_star_story || "");

  const [income, setIncome] = useState(String(finance.monthly_income || ""));
  const [expenses, setExpenses] = useState(String(finance.fixed_expenses || ""));
  const [debt, setDebt] = useState(String(finance.total_debt || ""));
  const [debtDetails, setDebtDetails] = useState(finance.debt_details || "");
  const [liquidSavings, setLiquidSavings] = useState(String(finance.liquid_savings || ""));
  const [investmentValue, setInvestmentValue] = useState(String(finance.investment_value || ""));
  const [emergencyFundCurrent, setEmergencyFundCurrent] = useState(String(finance.emergency_fund_current || ""));
  const [financialStateId, setFinancialStateId] = useState<any>(usersCore.financial_state_id || "Stabilitas");
  const [countryCode, setCountryCode] = useState(usersCore.country_code || "ID");
  const [riskProfile, setRiskProfile] = useState<any>(usersCore.risk_profile || "moderat");
  const [rentByChoice, setRentByChoice] = useState(!!usersCore.rent_by_choice);

  // New finance states
  const [cashflowStory, setCashflowStory] = useState(finance.cashflow_story || "");
  const [otherAssets, setOtherAssets] = useState(finance.other_assets ? String(finance.other_assets) : "");
  const [savingsStory, setSavingsStory] = useState(finance.savings_story || "");
  const [hasDebt, setHasDebt] = useState(!!finance.has_debt);
  const [debtHighInterest, setDebtHighInterest] = useState(finance.debt_high_interest ? String(finance.debt_high_interest) : "");
  const [debtProductive, setDebtProductive] = useState(finance.debt_productive ? String(finance.debt_productive) : "");
  const [debtZeroInterest, setDebtZeroInterest] = useState(finance.debt_zero_interest ? String(finance.debt_zero_interest) : "");
  const [debtStory, setDebtStory] = useState(finance.debt_story || "");
  const [hasInvestments, setHasInvestments] = useState(!!finance.has_investments);
  const [investmentInstruments, setInvestmentInstruments] = useState<string[]>(finance.investment_instruments || []);
  const [investmentStory, setInvestmentStory] = useState(finance.investment_story || "");
  const [financialPriorities, setFinancialPriorities] = useState<string[]>(finance.financial_priorities || []);
  const [financialGoalsStory, setFinancialGoalsStory] = useState(finance.financial_goals_story || "");

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) =>
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);

  const calculateFrontendAge = (bdate: string) => {
    if (!bdate) return "";
    const birth = new Date(bdate);
    const today = new Date();
    let ageVal = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      ageVal--;
    }
    return String(ageVal);
  };

  const handleDetectGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setDetectingGeo(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { "Accept-Language": "id,en" } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.municipality || addr.village || addr.state || "";
            const country = addr.country || "";
            if (city && country) {
              setDomicile(`${city}, ${country}`);
            } else if (country) {
              setDomicile(country);
            } else {
              setDomicile(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          } else {
            setDomicile("Jakarta, Indonesia");
          }
        } catch (err) {
          console.error(err);
          setDomicile("Jakarta, Indonesia");
        } finally {
          setDetectingGeo(false);
        }
      },
      (error) => {
        console.error(error);
        setDetectingGeo(false);
        alert(lang === "id" ? "Gagal mendeteksi lokasi otomatis. Silakan ketik manual." : "Failed to detect location. Please type manually.");
      },
      { timeout: 10000 }
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      const calculatedAge = birthDate ? (parseInt(calculateFrontendAge(birthDate)) || 0) : (parseInt(age) || 0);

      const calculatedTotalDebt = hasDebt 
        ? ((parseFloat(debtHighInterest) || 0) + (parseFloat(debtProductive) || 0) + (parseFloat(debtZeroInterest) || 0))
        : 0;

      const calculatedDebtDetails = hasDebt
        ? `Berbunga Tinggi: Rp ${debtHighInterest || 0}, Produktif: Rp ${debtProductive || 0}, Tanpa Bunga: Rp ${debtZeroInterest || 0}`
        : "";

      const calculatedInvestmentValue = hasInvestments
        ? (parseFloat(investmentValue) || 0)
        : 0;

      const res1 = await updateProfileAction({
        full_name: fullName,
        age: calculatedAge,
        background, skills, hobbies, interests,
        experience, career_state: careerState, career_goal: careerGoal, life_goal: lifeGoal,
        monthly_income: parseFloat(income) || 0, 
        fixed_expenses: parseFloat(expenses) || 0,
        total_debt: calculatedTotalDebt, 
        debt_details: calculatedDebtDetails,
        liquid_savings: parseFloat(liquidSavings) || 0,
        investment_value: calculatedInvestmentValue,
        emergency_fund_current: parseFloat(emergencyFundCurrent) || 0,
        education_options: educationOptions,
        education_story: educationStory,
        status_options: statusOptions,
        status_story: statusStory,
        skills_story: skillsStory,
        hobbies_story: hobbiesStory,
        interests_story: interestsStory,
        north_star_options: northStarOptions,
        north_star_story: northStarStory,
        cashflow_story: cashflowStory,
        other_assets: parseFloat(otherAssets) || 0,
        savings_story: savingsStory,
        has_debt: hasDebt,
        debt_high_interest: parseFloat(debtHighInterest) || 0,
        debt_productive: parseFloat(debtProductive) || 0,
        debt_zero_interest: parseFloat(debtZeroInterest) || 0,
        debt_story: debtStory,
        has_investments: hasInvestments,
        investment_instruments: investmentInstruments,
        investment_story: investmentStory,
        financial_priorities: financialPriorities,
        financial_goals_story: financialGoalsStory,
      });

      const res2 = await updateSandboxAction({
        formal_status: formalStatus,
        primary_focus: primaryFocus,
        daily_free_hours: parseInt(dailyFreeHours) || 0,
        financial_state_id: financialStateId,
        country_code: countryCode,
        risk_profile: riskProfile,
        dependents_count: parseInt(dependentsCount) || 0,
        is_sandwich_gen: isSandwichGen,
        owned_assets: ownedAssets,
        marital_status: maritalStatus,
        health_baseline: hasPhysicalLimitation ? 'physical_limitation' : 'fit',
        rent_by_choice: rentByChoice,
        ai_communication_style: usersCore.ai_communication_style,
        current_roadblock: usersCore.current_roadblock,
        display_name: displayName,
        birth_date: birthDate || undefined,
        gender: gender,
        domicile: domicile,
        living_situation: livingSituation,
        has_physical_limitation: hasPhysicalLimitation,
        physical_limitation_details: physicalLimitationDetails,
        work_devices: workDevices,
        mobility_assets: mobilityAssets,
        life_goal: lifeGoal,
      });

      if (res1.success && res2.success) {
        setSaveMsg(lang === "id" ? "Profil & Parameter AI berhasil diperbarui!" : "Profile & AI parameters updated!");
      } else {
        setSaveMsg(res1.message || res2.message);
      }
      setTimeout(() => setSaveMsg(""), 4000);
    });
  };

  const handleLogout = () => startTransition(async () => { await logoutAction(); });

  const inputCls = "w-full h-11 px-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary transition-colors";
  const textareaCls = "w-full px-3 py-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary transition-colors resize-none";

  const sections = [
    { id: "personal" as const, icon: User, label: lang === "id" ? "Pribadi" : "Personal" },
    { id: "career" as const, icon: Briefcase, label: lang === "id" ? "Karir" : "Career" },
    { id: "finance" as const, icon: Wallet, label: lang === "id" ? "Keuangan" : "Finance" },
  ];

  const themes = [
    { id: "dark" as const, label: lang === "id" ? "🌑 Gelap" : "🌑 Dark" },
    { id: "theme-light" as const, label: lang === "id" ? "☀️ Terang" : "☀️ Light" },
    { id: "theme-ocean" as const, label: "🌊 Ocean Blue" },
    { id: "theme-forest" as const, label: "🌿 Forest Green" },
    { id: "theme-sunset" as const, label: "🌅 Sunset Orange" },
  ];

  return (
    <>
      {showSheet && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end" onClick={() => setShowSheet(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-50 bg-card rounded-t-3xl border-t border-border/20 p-5 space-y-5 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
                {lang === "id" ? "Tema Tampilan" : "Display Theme"}
              </p>
              <div className="space-y-1.5">
                {themes.map(({ id, label }) => (
                  <button key={id} onClick={() => setTheme(id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${theme === id ? "bg-primary/10 text-primary border border-primary/30" : "hover:bg-muted/50 text-foreground"}`}>
                    <span>{label}</span>
                    {theme === id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
                {lang === "id" ? "Bahasa" : "Language"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([["id", "🇮🇩 Indonesia"], ["en", "🇬🇧 English"]] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setLang(id)}
                    className={`py-3 rounded-xl font-semibold text-sm border transition-all ${lang === id ? "border-primary bg-primary/10 text-primary" : "border-border/40"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-border/20">
              <button onClick={handleLogout} disabled={isPending}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-rose-500/30 text-rose-500 font-semibold hover:bg-rose-500/10 transition-colors">
                <LogOut className="w-4 h-4" />
                {lang === "id" ? "Keluar dari Akun" : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border/20 px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-black text-foreground">{lang === "id" ? "Profil" : "Profile"}</h1>
        <button onClick={() => setShowSheet(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted/50 transition-colors">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="px-4 pt-5 pb-4 flex items-center gap-4 border-b border-border/10">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary text-3xl font-black">
            {fullName.charAt(0).toUpperCase() || "?"}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-foreground truncate">{fullName || "—"}</p>
          <p className="text-xs text-muted-foreground truncate">{careerState || (lang === "id" ? "Status belum diisi" : "Status not set")}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold">Lv.{profile.level}</span>
            <span className="text-[10px] bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-full font-bold">{profile.xp} XP</span>
            {profile.badges.slice(0, 1).map(b => (
              <span key={b} className="text-[10px] bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full font-bold">🏅 {b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Floating AI Memory Card */}
      <div className="mx-4 mt-4 bg-card/40 backdrop-blur border border-border/20 rounded-2xl p-3 shadow-sm hover:border-primary/20 transition-all">
        <button 
          onClick={() => setAiMemoryExpanded(!aiMemoryExpanded)}
          className="w-full flex items-center justify-between focus:outline-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-foreground">
                {lang === "id" ? "Pemahaman AI" : "AI Understanding"}
              </p>
              <p className="text-[9px] text-muted-foreground leading-none">
                {getUnderstandingLabel(understandingScore, lang)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black ${getUnderstandingColor(understandingScore)}`}>
              {understandingScore}%
            </span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200", aiMemoryExpanded && "rotate-180")} />
          </div>
        </button>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden mt-2.5">
          <div 
            className={cn("h-full rounded-full transition-all duration-500", getUnderstandingBgColor(understandingScore))}
            style={{ width: `${understandingScore}%` }}
          />
        </div>

        {/* Collapsible Panel */}
        {aiMemoryExpanded && (
          <div className="mt-3 pt-3 border-t border-border/10 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
            {aiInsightList.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-primary uppercase tracking-wider">
                  {lang === "id" ? "Insight AI" : "AI Insights"}
                </p>
                {aiInsightList.map((insight, i) => (
                  <p key={i} className="text-[10px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
                    <span className="text-primary mt-1 shrink-0">•</span>
                    <span>{insight}</span>
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic">
                {lang === "id" ? "Isi profil lebih lengkap agar AI dapat menganalisis kondisi Anda." : "Fill in your profile details to unlock AI insights."}
              </p>
            )}
            <div className="bg-muted/15 border border-border/20 rounded-xl p-2.5 flex items-start gap-1.5">
              <span className="text-xs shrink-0">💡</span>
              <p className="text-[9px] text-muted-foreground leading-normal">
                {lang === "id" 
                  ? "AI mempelajari pola burnout dan gaya komunikasi Anda secara otomatis dari chat." 
                  : "AI learns your burnout patterns and communication style automatically from chat."}
              </p>
            </div>
          </div>
        )}
      </div>

      <SectionTabs sections={sections} currentSection={section} onSelect={(id) => setSection(id as any)} />

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-28">
        {section === "personal" && (
          <div className="space-y-6">
            {/* 1. Identitas & Demografi Dasar */}
            <div className="bg-card border border-border/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/10">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-foreground">{lang === "id" ? "Identitas & Demografi Dasar" : "Identity & Demographics"}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">{lang === "id" ? "Nama Lengkap" : "Full Name"}</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">{lang === "id" ? "Nama Panggilan" : "Display Name"}</label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={50} placeholder="Maks 50 karakter" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">{lang === "id" ? "Tanggal Lahir" : "Birth Date"}</label>
                  <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">{lang === "id" ? "Jenis Kelamin" : "Gender"}</label>
                  <select value={gender} onChange={e => setGender(e.target.value as any)} className={inputCls}>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                    <option value="Memilih untuk tidak menjawab">Memilih untuk tidak menjawab</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">{lang === "id" ? "Domisili (Kota & Negara)" : "Domicile (City & Country)"}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-muted-foreground/60" />
                  </span>
                  <input
                    value={domicile}
                    onChange={e => setDomicile(e.target.value)}
                    placeholder={lang === "id" ? "Contoh: New York, United States " : "E.g.New York, United States"}
                    className={`${inputCls} pl-9 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={handleDetectGeolocation}
                    disabled={detectingGeo}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                    title={lang === "id" ? "Deteksi Lokasi Otomatis" : "Auto-detect Location"}
                  >
                    {detectingGeo ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Status Tempat Tinggal */}
            <div className="bg-card border border-border/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/10">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-foreground">{lang === "id" ? "Status Tempat Tinggal" : "Living Situation"}</h3>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">{lang === "id" ? "Status Hunian Saat Ini" : "Current Living Situation"}</label>
                <select value={livingSituation} onChange={e => setLivingSituation(e.target.value as any)} className={inputCls}>
                  <option value="Tinggal Bersama Orang Tua/Keluarga">Tinggal Bersama Orang Tua/Keluarga</option>
                  <option value="Sewa/Ngekost Bulanan">Sewa/Ngekost Bulanan</option>
                  <option value="Sewa/Kontrak Tahunan">Sewa/Kontrak Tahunan</option>
                  <option value="Milik Sendiri (KPR)">Milik Sendiri (KPR)</option>
                  <option value="Milik Sendiri (Lunas)">Milik Sendiri (Lunas)</option>
                </select>
                <p className="text-[10px] text-muted-foreground mt-1.5 mb-3">
                  {lang === "id" ? "💡 Info ini digunakan oleh AI untuk menyalakan mode darurat jika kas Anda tidak aman." : "💡 This information is used by AI to adjust crisis mode protocols."}
                </p>
              </div>

              <div className="pt-3 border-t border-border/10">
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <p className="text-xs font-bold text-foreground">{lang === "id" ? "Sewa Secara Sadar (Rent-by-Choice)" : "Rent-by-Choice"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {lang === "id" ? "Aktifkan jika Anda memilih untuk menyewa hunian secara sadar untuk jangka panjang." : "Enable if you choose to rent long-term."}
                    </p>
                  </div>
                  <button type="button" onClick={() => setRentByChoice(!rentByChoice)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 focus:outline-none ${rentByChoice ? "bg-primary" : "bg-muted"}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${rentByChoice ? "left-6" : "left-1"}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Beban Tanggungan (Reality Check) */}
            <div className="bg-card border border-border/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/10">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Heart className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-foreground">{lang === "id" ? "Beban Tanggungan (Reality Check)" : "Dependents & Sandwich Gen"}</h3>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">{lang === "id" ? "Status Pernikahan" : "Marital Status"}</label>
                <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value as any)} className={inputCls}>
                  <option value="single">{lang === "id" ? "Single (Belum Menikah)" : "Single"}</option>
                  <option value="pacaran">{lang === "id" ? "Pacaran / Menjalin Hubungan" : "In a Relationship / Dating"}</option>
                  <option value="married">{lang === "id" ? "Menikah" : "Married"}</option>
                  <option value="previously_married">{lang === "id" ? "Pernah Menikah (Duda/Janda)" : "Previously Married"}</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border border-border/20 rounded-xl h-11 self-end bg-background/50">
                  <div className="pr-2">
                    <p className="text-xs font-bold text-foreground">{lang === "id" ? "Generasi Sandwich" : "Sandwich Gen"}</p>
                    <p className="text-[9px] text-muted-foreground leading-none mt-0.5">
                      {lang === "id" ? "Menanggung Ortu/Keluarga" : "Supporting family"}
                    </p>
                  </div>
                  <button type="button" onClick={() => setIsSandwichGen(!isSandwichGen)}
                    className={`w-10 h-5.5 rounded-full transition-all relative shrink-0 ${isSandwichGen ? "bg-primary" : "bg-muted"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isSandwichGen ? "left-5.5" : "left-0.5"}`} />
                  </button>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">{lang === "id" ? "Jumlah Tanggungan (Anak/Keluarga)" : "Number of Dependents"}</label>
                  <div className="flex items-center">
                    <button type="button" onClick={() => setDependentsCount(p => String(Math.max(0, parseInt(p || "0") - 1)))} className="h-11 w-11 flex items-center justify-center border border-border/40 rounded-l-xl text-foreground font-black text-lg bg-muted/30 active:bg-muted">-</button>
                    <input type="number" value={dependentsCount} onChange={e => setDependentsCount(e.target.value)} className="w-full h-11 text-center border-y border-border/40 bg-background text-sm focus:outline-none focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" min="0" />
                    <button type="button" onClick={() => setDependentsCount(p => String(parseInt(p || "0") + 1))} className="h-11 w-11 flex items-center justify-center border border-border/40 rounded-r-xl text-foreground font-black text-lg bg-muted/30 active:bg-muted">+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Batasan Fisik & Aksesibilitas */}
            <div className="bg-card border border-border/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/10">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Accessibility className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-foreground">{lang === "id" ? "Batasan Fisik & Aksesibilitas" : "Physical Limitations"}</h3>
              </div>

              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <p className="text-xs font-bold text-foreground">{lang === "id" ? "Memiliki Batasan Fisik / Kebutuhan Khusus?" : "Have Physical Limitations?"}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {lang === "id" ? "Mencegah AI merekomendasikan tugas lapangan fisik yang berat." : "Prevents the AI from recommending physically demanding tasks."}
                  </p>
                </div>
                <button type="button" onClick={() => setHasPhysicalLimitation(!hasPhysicalLimitation)}
                  className={`w-10 h-5.5 rounded-full transition-all relative shrink-0 ${hasPhysicalLimitation ? "bg-primary" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${hasPhysicalLimitation ? "left-5.5" : "left-0.5"}`} />
                </button>
              </div>

              {hasPhysicalLimitation && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">{lang === "id" ? "Detail Batasan Fisik" : "Limitation Details"}</label>
                  <input value={physicalLimitationDetails} onChange={e => setPhysicalLimitationDetails(e.target.value)} placeholder={lang === "id" ? "Misal: Kursi roda, asma berat, cedera lutut..." : "E.g. Wheelchair, asthma, knee injury..."} className={inputCls} />
                </div>
              )}
            </div>

            {/* 5. Aset Produktivitas & Mobilitas (Alat Perang) */}
            <div className="bg-card border border-border/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/10">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
                  <Laptop className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-foreground">{lang === "id" ? "Aset Produktivitas & Mobilitas" : "Devices & Mobility Assets"}</h3>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-2">{lang === "id" ? "Perangkat Kerja Utama" : "Work Devices"}</label>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const defaultDevices = ["Smartphone Standar", "Smartphone Flagship", "Laptop/PC Standar", "Laptop/PC Performa Tinggi", "Kamera"];
                    const customDevicesInState = workDevices.filter(dev => !defaultDevices.includes(dev));
                    const allWorkDevices = [...defaultDevices, ...customDevicesInState];
                    return allWorkDevices.map(dev => {
                      const active = workDevices.includes(dev);
                      return (
                        <button key={dev} type="button" onClick={() => toggle(workDevices, setWorkDevices, dev)}
                          className={`text-xs px-3 py-2 rounded-xl border transition-all ${active ? "bg-primary/10 text-primary border-primary font-bold shadow-sm shadow-primary/5" : "border-border/40 text-muted-foreground hover:border-border"}`}>
                          {dev}
                        </button>
                      );
                    });
                  })()}
                </div>
                <div className="flex gap-2 mt-2 max-w-xs">
                  <input
                    value={customDeviceInput}
                    onChange={e => setCustomDeviceInput(e.target.value)}
                    placeholder={lang === "id" ? "Tambah perangkat kustom..." : "Add custom device..."}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const trimmed = customDeviceInput.trim();
                        if (trimmed && !workDevices.includes(trimmed)) {
                          setWorkDevices([...workDevices, trimmed]);
                        }
                        setCustomDeviceInput("");
                      }
                    }}
                    className="flex-1 h-9 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = customDeviceInput.trim();
                      if (trimmed && !workDevices.includes(trimmed)) {
                        setWorkDevices([...workDevices, trimmed]);
                      }
                      setCustomDeviceInput("");
                    }}
                    className="h-9 px-3 bg-primary text-primary-foreground rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-2">{lang === "id" ? "Aset Mobilitas" : "Mobility Assets"}</label>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const defaultMobility = ["Motor Pribadi", "Mobil Pribadi", "Transportasi Publik / Online"];
                    const customMobilityInState = mobilityAssets.filter(asset => !defaultMobility.includes(asset));
                    const allMobilityAssets = [...defaultMobility, ...customMobilityInState];
                    return allMobilityAssets.map(asset => {
                      const active = mobilityAssets.includes(asset);
                      return (
                        <button key={asset} type="button" onClick={() => toggle(mobilityAssets, setMobilityAssets, asset)}
                          className={`text-xs px-3 py-2 rounded-xl border transition-all ${active ? "bg-primary/10 text-primary border-primary font-bold shadow-sm shadow-primary/5" : "border-border/40 text-muted-foreground hover:border-border"}`}>
                          {asset}
                        </button>
                      );
                    });
                  })()}
                </div>
                <div className="flex gap-2 mt-2 max-w-xs">
                  <input
                    value={customMobilityInput}
                    onChange={e => setCustomMobilityInput(e.target.value)}
                    placeholder={lang === "id" ? "Tambah aset kustom..." : "Add custom asset..."}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const trimmed = customMobilityInput.trim();
                        if (trimmed && !mobilityAssets.includes(trimmed)) {
                          setMobilityAssets([...mobilityAssets, trimmed]);
                        }
                        setCustomMobilityInput("");
                      }
                    }}
                    className="flex-1 h-9 px-3 rounded-xl border border-border/60 bg-background text-xs focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = customMobilityInput.trim();
                      if (trimmed && !mobilityAssets.includes(trimmed)) {
                        setMobilityAssets([...mobilityAssets, trimmed]);
                      }
                      setCustomMobilityInput("");
                    }}
                    className="h-9 px-3 bg-primary text-primary-foreground rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 6. North Star (Tujuan Puncak) */}
            <div className="bg-card border border-border/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/10">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Milestone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-foreground">{lang === "id" ? "North Star (Tujuan Puncak)" : "North Star Goals"}</h3>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-muted-foreground">{lang === "id" ? "Tujuan Hidup Terbesar (Life Goal)" : "Life Goal"}</label>
                  <span className="text-[10px] text-muted-foreground">{lifeGoal.length}/300</span>
                </div>
                <textarea value={lifeGoal} onChange={e => setLifeGoal(e.target.value.slice(0, 300))} rows={4} maxLength={300} placeholder={lang === "id" ? "Contoh: Ingin membangun sistem bisnis yang auto-pilot di usia 25 tahun..." : "E.g. Ingin membangun sistem bisnis..."} className={textareaCls} />
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {lang === "id" ? "💡 Ini akan digunakan oleh AI sebagai senjata motivasi utama saat memandu atau menegur Anda di sesi mentoring." : "💡 This is your compass. The AI Mentor will refer to it during guidance sessions."}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">{lang === "id" ? "Bio Ringkas" : "Short Bio"}</label>
                <textarea value={background} onChange={e => setBackground(e.target.value)} rows={3} placeholder={lang === "id" ? "Ceritakan latar belakang Anda secara singkat..." : "A brief background..."} className={textareaCls} />
              </div>
            </div>
          </div>
        )}

        {section === "career" && (
          <CareerProfileTab
            educationOptions={educationOptions}
            setEducationOptions={setEducationOptions}
            educationStory={educationStory}
            setEducationStory={setEducationStory}
            statusOptions={statusOptions}
            setStatusOptions={setStatusOptions}
            statusStory={statusStory}
            setStatusStory={setStatusStory}
            skills={skills}
            setSkills={setSkills}
            skillsStory={skillsStory}
            setSkillsStory={setSkillsStory}
            hobbies={hobbies}
            setHobbies={setHobbies}
            hobbiesStory={hobbiesStory}
            setHobbiesStory={setHobbiesStory}
            northStarOptions={northStarOptions}
            setNorthStarOptions={setNorthStarOptions}
            northStarStory={northStarStory}
            setNorthStarStory={setNorthStarStory}
          />
        )}

        {section === "finance" && (
          <FinanceProfileTab
            income={income}
            setIncome={setIncome}
            expenses={expenses}
            setExpenses={setExpenses}
            liquidSavings={liquidSavings}
            setLiquidSavings={setLiquidSavings}
            otherAssets={otherAssets}
            setOtherAssets={setOtherAssets}
            hasDebt={hasDebt}
            setHasDebt={setHasDebt}
            debtHighInterest={debtHighInterest}
            setDebtHighInterest={setDebtHighInterest}
            debtProductive={debtProductive}
            setDebtProductive={setDebtProductive}
            debtZeroInterest={debtZeroInterest}
            setDebtZeroInterest={setDebtZeroInterest}
            hasInvestments={hasInvestments}
            setHasInvestments={setHasInvestments}
            investmentValue={investmentValue}
            setInvestmentValue={setInvestmentValue}
            investmentInstruments={investmentInstruments}
            setInvestmentInstruments={setInvestmentInstruments}
            riskProfile={riskProfile}
            setRiskProfile={setRiskProfile}
          />
        )}
      </div>

      <div className="absolute bottom-16 left-0 right-0 px-4 pb-3 bg-gradient-to-t from-background/95 via-background/90 to-transparent pt-6 select-none">
        {saveMsg && (
          <div className={`text-xs font-semibold text-center px-3 py-2.5 rounded-xl mb-2 ${saveMsg.includes("berhasil") || saveMsg.includes("success") ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
            {saveMsg}
          </div>
        )}
        <button onClick={handleSave} disabled={isPending}
          className="w-full h-12 rounded-2xl font-bold text-sm bg-primary text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-primary/20 active:scale-95 transition-all">
          <Save className="w-4 h-4" />
          {isPending ? (lang === "id" ? "Menyimpan..." : "Saving...") : (lang === "id" ? "Simpan & Perbarui AI" : "Save & Update AI")}
        </button>
      </div>
    </>
  );
}

function calculateUnderstandingScore(profile: ProfileData, finance: FinancialProfileData, usersCore: UsersCoreData): number {
  let score = 0;
  let maxScore = 150; // Increased granularity

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
  if (profile.skills.length > 0) score += 10;
  if (profile.hobbies.length > 0) score += 10;
  if (finance.liquid_savings > 0) score += 10;
  if (finance.investment_value > 0) score += 10;
  if (finance.emergency_fund_current > 0) score += 10;

  return Math.min(Math.round((score / maxScore) * 100), 100);
}

function generateInsights(profile: ProfileData, finance: FinancialProfileData, usersCore: UsersCoreData): string[] {
  const insights: string[] = [];
  if (profile.skills.length >= 3) insights.push(`AI memahami keahlian Anda: ${profile.skills.slice(0, 3).join(", ")}`);
  if (profile.hobbies.length >= 2) insights.push(`AI mengenali passion Anda: ${profile.hobbies.slice(0, 2).join(", ")}`);
  if (finance.total_debt > 0) insights.push(`AI memantau progress pelunasan hutang Anda`);
  return insights.slice(0, 5);
}

function getUnderstandingColor(s: number) {
  if (s < 30) return "text-rose-500";
  if (s < 60) return "text-amber-500";
  if (s < 80) return "text-emerald-500";
  return "text-emerald-600";
}

function getUnderstandingBgColor(s: number) {
  if (s < 30) return "bg-rose-500";
  if (s < 60) return "bg-amber-500";
  if (s < 80) return "bg-emerald-500";
  return "bg-emerald-600";
}

function getUnderstandingLabel(s: number, currentLang: string) {
  if (s < 30) return currentLang === "id" ? "Perlu Lengkap" : "Needs Completion";
  if (s < 60) return currentLang === "id" ? "Cukup Lengkap" : "Moderately Complete";
  if (s < 80) return currentLang === "id" ? "Sangat Lengkap" : "Very Complete";
  return currentLang === "id" ? "Sempurna" : "Perfect";
}
