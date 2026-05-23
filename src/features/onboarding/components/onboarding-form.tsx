"use client";

import { useState, useActionState, startTransition, useEffect, useRef } from "react";
import { submitOnboardingAction, OnboardingState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  Award, 
  Heart, 
  Target, 
  Wallet, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  Check,
  Shield,
  TrendingUp,
  Skull,
  BrainCircuit,
  Send
} from "lucide-react";

const initialState: OnboardingState = {
  success: false,
  message: "",
};

const SKILL_PRESETS = [
  "Programming", "Graphic Design", "Copywriting", "Video Editing", 
  "Sales & Marketing", "Data Analysis", "Teaching/Mentoring", "Excel/Admin"
];

const HOBBY_PRESETS = [
  "Gaming", "Writing", "Photography", "Cooking", 
  "Fitness/Sports", "Art/Drawing", "Social Media", "Traveling"
];

const INTEREST_PRESETS = [
  "Bisnis Online", "Kecerdasan Buatan (AI)", "Personal Finance", 
  "E-commerce", "Kesehatan & Wellness", "Investasi & Saham"
];

interface ChatBubble {
  id: string;
  sender: "mentor" | "user";
  content: string;
  type?: "text" | "options_path" | "options_skills" | "options_hobbies" | "options_financial" | "options_goal";
}

export default function OnboardingForm({ initialName }: { initialName: string }) {
  const [state, formAction, isPending] = useActionState(submitOnboardingAction, initialState);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat stage tracker: 
  // 0: Ask Name
  // 1: Ask Path
  // 2: Ask Skills & Experience
  // 3: Ask Hobbies & Interests
  // 4: Ask Financials
  // 5: Ask Career Status & Goal
  // 6: Ready to Submit
  const [currentStep, setCurrentStep] = useState(0);

  // Form Fields State
  const [name, setName] = useState(initialName || "");
  const [path, setPath] = useState<"DEBT" | "EMERGENCY" | "INVEST">("EMERGENCY");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [totalDebt, setTotalDebt] = useState("");
  const [debtDetails, setDebtDetails] = useState("");
  const [careerState, setCareerState] = useState("");
  const [careerGoal, setCareerGoal] = useState("");

  const toggleSkill = (item: string) => {
    setSelectedSkills(prev => 
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const toggleHobby = (item: string) => {
    setSelectedHobbies(prev => 
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const toggleInterest = (item: string) => {
    setSelectedInterests(prev => 
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  // Chat history list
  const [chatHistory, setChatHistory] = useState<ChatBubble[]>([]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Initial welcome message from AI Mentor
  useEffect(() => {
    setChatHistory([
      {
        id: "w1",
        sender: "mentor",
        content: "Halo! Selamat datang di Mentlife. Saya adalah AI Mentor pribadi Anda yang akan membimbing Anda menyusun strategi keuangan & karir terbaik."
      },
      {
        id: "w2",
        sender: "mentor",
        content: "Sebelum kita mulai menyusun strategi, boleh saya tahu siapa nama panggilan Anda?",
        type: "text"
      }
    ]);
  }, []);

  const handleSendName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setChatHistory(prev => [
      ...prev,
      { id: `u_${Date.now()}`, sender: "user", content: `Nama saya ${name}` }
    ]);

    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          sender: "mentor",
          content: `Salam kenal, ${name}! Senang bisa membimbing Anda. Sekarang, dari tiga jalan utama di bawah ini, mana fokus finansial terdekat Anda saat ini?`,
          type: "options_path"
        }
      ]);
      setCurrentStep(1);
    }, 800);
  };

  const handleSelectPath = (selected: "DEBT" | "EMERGENCY" | "INVEST") => {
    setPath(selected);
    const pathText = selected === "DEBT" 
      ? "Bebas Hutang (Debt Slayer)" 
      : selected === "EMERGENCY" 
      ? "Benteng Keuangan (Safety Net)" 
      : "Akselerator Aset (Investor)";

    setChatHistory(prev => [
      ...prev,
      { id: `u_${Date.now()}`, sender: "user", content: `Saya memilih rute: ${pathText}` }
    ]);

    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          sender: "mentor",
          content: "Pilihan yang sangat bijaksana. Untuk menyusun peluang pendapatan tambahan (side-hustle) yang selaras, apa saja keahlian/skills yang Anda kuasai saat ini? Pilih beberapa di bawah ini beserta deskripsi singkat pengalaman Anda.",
          type: "options_skills"
        }
      ]);
      setCurrentStep(2);
    }, 800);
  };

  const handleSendSkills = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkills.length === 0 || !experience.trim()) return;

    setChatHistory(prev => [
      ...prev,
      { 
        id: `u_${Date.now()}`, 
        sender: "user", 
        content: `Keahlian: ${selectedSkills.join(", ")}. Pengalaman: ${experience}` 
      }
    ]);

    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          sender: "mentor",
          content: "Luar biasa! Untuk menemukan titik temu Ikigai (irisan minat dan hobi), hobi apa saja yang Anda cintai dan topik apa saja yang menarik minat Anda?",
          type: "options_hobbies"
        }
      ]);
      setCurrentStep(3);
    }, 800);
  };

  const handleSendHobbies = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedHobbies.length === 0 || selectedInterests.length === 0) return;

    setChatHistory(prev => [
      ...prev,
      { 
        id: `u_${Date.now()}`, 
        sender: "user", 
        content: `Hobi: ${selectedHobbies.join(", ")}. Ketertarikan: ${selectedInterests.join(", ")}` 
      }
    ]);

    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          sender: "mentor",
          content: `Data profil Anda sangat lengkap. Sekarang, mari lengkapi parameter keuangan dasar Anda agar saya dapat menghitung rasio anggaran secara akurat.`,
          type: "options_financial"
        }
      ]);
      setCurrentStep(4);
    }, 800);
  };

  const handleSendFinancials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!income || !expenses) return;
    if (path === "DEBT" && (!totalDebt || !debtDetails)) return;

    let contentStr = `Pendapatan: Rp${Number(income).toLocaleString("id-ID")}/bln, Pengeluaran tetap: Rp${Number(expenses).toLocaleString("id-ID")}/bln.`;
    if (path === "DEBT") {
      contentStr += ` Hutang aktif: Rp${Number(totalDebt).toLocaleString("id-ID")} (${debtDetails})`;
    }

    setChatHistory(prev => [
      ...prev,
      { id: `u_${Date.now()}`, sender: "user", content: contentStr }
    ]);

    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          sender: "mentor",
          content: "Satu langkah terakhir! Apa status pekerjaan Anda saat ini dan apa target karir/tujuan finansial terbesar yang ingin Anda wujudkan bersama Mentlife?",
          type: "options_goal"
        }
      ]);
      setCurrentStep(5);
    }, 800);
  };

  const handleSendGoals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!careerState.trim() || !careerGoal.trim()) return;

    setChatHistory(prev => [
      ...prev,
      { id: `u_${Date.now()}`, sender: "user", content: `Status: ${careerState}. Target Karir: ${careerGoal}` }
    ]);

    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          sender: "mentor",
          content: `Luar biasa, ${name}! Seluruh informasi telah diselaraskan dengan aman ke database. Mentor AI Anda siap memberikan panduan terpersonalisasi, misi harian, simulator Mirofish, dan XP reward. Mari mulai petualangan kita sekarang!`,
        }
      ]);
      setCurrentStep(6);
    }, 800);
  };

  const submitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  // Auto-submit when step reaches 6 (after goals are saved)
  // This triggers on next render when currentStep becomes 6

  return (
    <div className="w-full max-w-md px-4 flex flex-col justify-center min-h-screen py-10 bg-background text-foreground">
      <Card className="border-border/40 bg-card/50 backdrop-blur-2xl shadow-2xl rounded-3xl h-[750px] flex flex-col overflow-hidden">
        
        {/* Header Section */}
        <CardHeader className="py-3 border-b border-border/10 flex flex-row items-center gap-3 shrink-0">
          <div className="bg-primary/20 p-2.5 rounded-2xl ring-1 ring-primary/30">
            <BrainCircuit className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-sm font-black">AI Onboarding Mentor</CardTitle>
            <CardDescription className="text-[10px] text-muted-foreground font-medium">Interaksi perkenalan & kustomisasi program</CardDescription>
          </div>
        </CardHeader>

        {/* COMBINATION PANEL: Live Dashboard Preview (Realtime User Profile Sheet) */}
        <div className="mx-4 mt-3 p-3.5 rounded-2xl border border-border/40 bg-muted/20 backdrop-blur-md flex flex-col gap-2 shrink-0 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
              <span>Mentlife Live Profile Sheet</span>
            </span>
            <span className="text-[9px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold">
              Level 1 (Newbie)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Left Column: Name & Quest Path */}
            <div className="space-y-1">
              <div>
                <p className="text-[8px] text-muted-foreground uppercase font-black tracking-wider">Mentee</p>
                <p className="font-extrabold text-[11px] truncate text-foreground">{name || "Calon Mentee"}</p>
              </div>
              <div>
                <p className="text-[8px] text-muted-foreground uppercase font-black tracking-wider">Jalan Quest</p>
                {path === "DEBT" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                    <Skull className="w-2.5 h-2.5" /> Debt Slayer
                  </span>
                )}
                {path === "EMERGENCY" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <Shield className="w-2.5 h-2.5" /> Safety Net
                  </span>
                )}
                {path === "INVEST" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                    <TrendingUp className="w-2.5 h-2.5" /> Wealth Builder
                  </span>
                )}
              </div>
            </div>

            {/* Right Column: Financial Flow Status */}
            <div className="space-y-1">
              <div>
                <p className="text-[8px] text-muted-foreground uppercase font-black tracking-wider">Arus Finansial (Sisa)</p>
                <p className="font-extrabold text-[11px] text-foreground">
                  Rp {Number((Number(income || 0) - Number(expenses || 0))).toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-[8px] text-muted-foreground uppercase font-black tracking-wider">Saving Rate</p>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 bg-border/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        path === "DEBT" ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ 
                        width: `${Math.min(Math.max(income && Number(income) > 0 ? Math.round(((Number(income) - Number(expenses)) / Number(income)) * 100) : 0, 0), 100)}%` 
                      }}
                    />
                  </div>
                  <span className="font-bold text-[9px]">
                    {income && Number(income) > 0 ? Math.round(((Number(income) - Number(expenses)) / Number(income)) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section: Skills and Target Goals */}
          <div className="border-t border-border/20 pt-1.5 flex flex-col gap-1 text-[10px]">
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider shrink-0 mr-1">Skills:</span>
              {selectedSkills.length > 0 ? (
                selectedSkills.slice(0, 3).map((s) => (
                  <span key={s} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-bold border border-primary/20">
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-[8px] text-muted-foreground italic">Menunggu input...</span>
              )}
              {selectedSkills.length > 3 && (
                <span className="text-[8px] text-muted-foreground">+{selectedSkills.length - 3}</span>
              )}
            </div>
            <div className="truncate flex items-center gap-1.5">
              <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider shrink-0">Quest Goal:</span>
              <span className="font-semibold truncate text-[9px] text-foreground/80">{careerGoal || "Menunggu penentuan target..."}</span>
            </div>
          </div>
        </div>

        {/* Chat Bubbles Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {chatHistory.map((bubble) => (
            <div 
              key={bubble.id} 
              className={`flex items-start gap-2.5 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                bubble.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${bubble.sender === "user" ? "bg-primary/20 text-primary" : "bg-card border border-border/20 text-foreground"}`}>
                {bubble.sender === "user" ? <User className="w-3.5 h-3.5" /> : <BrainCircuit className="w-3.5 h-3.5" />}
              </div>
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                bubble.sender === "user" 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-card/75 border border-border/30 text-foreground rounded-tl-none"
              }`}>
                {bubble.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Action Input Area based on Chat Step */}
        <div className="p-4 border-t border-border/10 bg-card/30 shrink-0">
          
          {/* STEP 0: Input Name */}
          {currentStep === 0 && (
            <form onSubmit={handleSendName} className="flex gap-2 animate-in fade-in duration-300">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama panggilan Anda..."
                required
                className="h-11 rounded-xl text-xs"
              />
              <Button type="submit" size="icon" className="h-11 w-11 rounded-xl shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* STEP 1: Select Path Options */}
          {currentStep === 1 && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <button
                type="button"
                onClick={() => handleSelectPath("DEBT")}
                className="p-2.5 text-left rounded-xl border border-border bg-card/50 hover:border-rose-500 hover:bg-rose-500/5 transition-all text-xs flex gap-2 items-center"
              >
                <Skull className="w-4 h-4 text-rose-500 shrink-0" />
                <div>
                  <p className="font-bold text-foreground">Bebas Hutang (Debt Slayer)</p>
                  <p className="text-[9px] text-muted-foreground">Fokus melunasi semua cicilan & hutang aktif.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPath("EMERGENCY")}
                className="p-2.5 text-left rounded-xl border border-border bg-card/50 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-xs flex gap-2 items-center"
              >
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-bold text-foreground">Benteng Keuangan (Safety Net)</p>
                  <p className="text-[9px] text-muted-foreground">Fokus membangun dana darurat sebesar 6x pengeluaran.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPath("INVEST")}
                className="p-2.5 text-left rounded-xl border border-border bg-card/50 hover:border-primary hover:bg-primary/5 transition-all text-xs flex gap-2 items-center"
              >
                <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="font-bold text-foreground">Akselerasi Aset (Investor)</p>
                  <p className="text-[9px] text-muted-foreground">Fokus belajar investasi & melipatgandakan dana.</p>
                </div>
              </button>
            </div>
          )}

          {/* STEP 2: Choose Skills */}
          {currentStep === 2 && (
            <form onSubmit={handleSendSkills} className="space-y-3 animate-in fade-in duration-300">
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 border border-border/40 rounded-xl">
                {SKILL_PRESETS.map((skill) => {
                  const active = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                        active 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background text-muted-foreground border-border/80 hover:border-border"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Pengalaman kerja singkat..."
                  required
                  className="h-10 text-xs rounded-xl flex-1"
                />
                <Button type="submit" disabled={selectedSkills.length === 0} className="h-10 px-4 rounded-xl text-xs font-bold shrink-0">
                  Kirim
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: Choose Hobbies & Interests */}
          {currentStep === 3 && (
            <form onSubmit={handleSendHobbies} className="space-y-3 animate-in fade-in duration-300">
              <div className="space-y-2 max-h-36 overflow-y-auto p-1">
                <div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Hobi Anda:</p>
                  <div className="flex flex-wrap gap-1">
                    {HOBBY_PRESETS.map((hobby) => {
                      const active = selectedHobbies.includes(hobby);
                      return (
                        <button
                          key={hobby}
                          type="button"
                          onClick={() => toggleHobby(hobby)}
                          className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                            active 
                              ? "bg-primary text-primary-foreground border-primary" 
                              : "bg-background text-muted-foreground border-border/80 hover:border-border"
                          }`}
                        >
                          {hobby}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Topik Diminati:</p>
                  <div className="flex flex-wrap gap-1">
                    {INTEREST_PRESETS.map((interest) => {
                      const active = selectedInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                            active 
                              ? "bg-primary text-primary-foreground border-primary" 
                              : "bg-background text-muted-foreground border-border/80 hover:border-border"
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={selectedHobbies.length === 0 || selectedInterests.length === 0} className="w-full h-10 rounded-xl text-xs font-bold">
                Kirim Pilihan
              </Button>
            </form>
          )}

          {/* STEP 4: Financial Parameters Input */}
          {currentStep === 4 && (
            <form onSubmit={handleSendFinancials} className="space-y-3 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="income" className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Pendapatan / Bulan (Rp)</Label>
                  <Input
                    id="income"
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="Contoh: 5000000"
                    required
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="expenses" className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Pengeluaran Tetap (Rp)</Label>
                  <Input
                    id="expenses"
                    type="number"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    placeholder="Contoh: 3000000"
                    required
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
              </div>

              {path === "DEBT" && (
                <div className="grid grid-cols-2 gap-2 p-2 bg-rose-500/5 border border-rose-500/15 rounded-xl animate-in slide-in-from-top-1">
                  <div className="space-y-1">
                    <Label htmlFor="totalDebtVal" className="text-[8px] font-bold uppercase tracking-wider text-rose-400">Total Hutang (Rp)</Label>
                    <Input
                      id="totalDebtVal"
                      type="number"
                      value={totalDebt}
                      onChange={(e) => setTotalDebt(e.target.value)}
                      placeholder="Total"
                      required
                      className="h-9 text-xs rounded-lg border-rose-500/35"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="debtDetailsVal" className="text-[8px] font-bold uppercase tracking-wider text-rose-400">Detail Cicilan</Label>
                    <Input
                      id="debtDetailsVal"
                      type="text"
                      value={debtDetails}
                      onChange={(e) => setDebtDetails(e.target.value)}
                      placeholder="Contoh: Pinjol, motor"
                      required
                      className="h-9 text-xs rounded-lg border-rose-500/35"
                    />
                  </div>
                </div>
              )}

              <Button type="submit" disabled={!income || !expenses || (path === "DEBT" && (!totalDebt || !debtDetails))} className="w-full h-10 rounded-xl text-xs font-bold">
                Kirim Angka Keuangan
              </Button>
            </form>
          )}

          {/* STEP 5: Goals & Career Status Input */}
          {currentStep === 5 && (
            <form onSubmit={handleSendGoals} className="space-y-3 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="careerStateVal" className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Kondisi Kerja Saat Ini</Label>
                  <Input
                    id="careerStateVal"
                    type="text"
                    value={careerState}
                    onChange={(e) => setCareerState(e.target.value)}
                    placeholder="Freshgrad, Karyawan, dll"
                    required
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="careerGoalVal" className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Goals Terbesar Anda</Label>
                  <Input
                    id="careerGoalVal"
                    type="text"
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    placeholder="Punya pasif income, dll"
                    required
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
              </div>
              <Button type="submit" disabled={!careerState || !careerGoal} className="w-full h-10 rounded-xl text-xs font-bold">
                Kirim Goals Karir
              </Button>
            </form>
          )}

          {/* STEP 6: Final Ready Submission to Database */}
          {currentStep === 6 && (
            <form onSubmit={submitForm} className="space-y-3 animate-in zoom-in-95 duration-300">
              {/* Hidden Inputs representing all inputs for action */}
              <input type="hidden" name="fullName" value={name} />
              <input type="hidden" name="experience" value={experience} />
              <input type="hidden" name="careerState" value={careerState} />
              <input type="hidden" name="careerGoal" value={careerGoal} />
              <input type="hidden" name="monthlyIncome" value={income} />
              <input type="hidden" name="fixedExpenses" value={expenses} />
              <input type="hidden" name="totalDebt" value={path === "DEBT" ? totalDebt : "0"} />
              <input type="hidden" name="debtDetails" value={path === "DEBT" ? debtDetails : ""} />
              <input type="hidden" name="skills" value={selectedSkills.join(",")} />
              <input type="hidden" name="hobbies" value={selectedHobbies.join(",")} />
              <input type="hidden" name="interests" value={selectedInterests.join(",")} />

              {/* Show error if action fails */}
              {state?.message && !state.success && !isPending && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-semibold text-center">
                  ⚠️ {state.message}
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-black border border-amber-400 flex justify-center gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyinkronkan Program AI...
                  </>
                ) : (
                  <>
                    Buka Dashboard Mentlife Utama
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}


        </div>
      </Card>
    </div>
  );
}
