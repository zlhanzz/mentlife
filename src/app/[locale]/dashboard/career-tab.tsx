"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { addTaskAction, toggleTaskAction, deleteTaskAction } from "@/features/dashboard/actions";
import { useApp } from "@/context/app-context";
import { AIRecommendations } from "@/services/ai";
import {
  Briefcase, Star, Target, CheckSquare, Plus, ChevronRight,
  Trash2, TrendingUp, Lightbulb, Zap, GraduationCap, Users,
  Building2, Laptop, Award, BookOpen, DollarSign, BarChart2,
  ArrowRight, Lock, Rocket
} from "lucide-react";

interface CareerTabProps {
  profile: {
    full_name: string;
    skills: string[];
    hobbies: string[];
    interests: string[];
    career_goal: string;
    experience: string;
    xp: number;
    level: number;
  };
  aiRecs: AIRecommendations;
  initialTasks: Array<{ id: string; title: string; due_date: string | null; completed: boolean; category: string }>;
  usersCore: {
    formal_status: 'Mahasiswa' | 'Karyawan' | 'Pengusaha' | 'Freelancer' | 'Menganggur';
    primary_focus: string;
    daily_free_hours: number;
    financial_state_id: 'Survival' | 'Stabilitas' | 'Pertumbuhan' | 'Kebebasan';
    country_code: string;
    risk_profile: string;
    health_baseline: 'fit' | 'physical_limitation' | 'burnout_alert';
    owned_assets: string[];
  };
  ladderLevel: number;
}

export default function CareerTab({ profile, aiRecs, initialTasks, usersCore, ladderLevel }: CareerTabProps) {
  const { lang } = useApp();
  const tDash = useTranslations("dashboard");
  const [isPending, startTransition] = useTransition();
  const [tasks, setTasks] = useState(initialTasks);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState("Karir");
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("Semua");

  const CATEGORIES = ["Semua", "Karir", "Skill", "Side Hustle", "Bisnis", "Personal"];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    startTransition(async () => {
      const res = await addTaskAction(taskTitle, "", taskCategory);
      if (res.success) {
        setTasks(prev => [{ id: Date.now().toString(), title: taskTitle, due_date: null, completed: false, category: taskCategory }, ...prev]);
        setTaskTitle("");
        setShowForm(false);
      }
    });
  };

  const handleToggle = (id: string, completed: boolean) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t));
    startTransition(async () => { await toggleTaskAction(id, completed); });
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    startTransition(async () => { await deleteTaskAction(id); });
  };

  const filterAll = "Semua";
  const filteredTasks = activeFilter === filterAll
    ? tasks
    : tasks.filter(t => t.category === activeFilter);

  const completedCount = tasks.filter(t => t.completed).length;
  const hasIkigai = profile.skills.length > 0 || profile.hobbies.length > 0 || profile.interests.length > 0;
  const { formal_status, health_baseline, daily_free_hours, owned_assets } = usersCore;

  // Sub-module config per formal_status
  const statusConfig = {
    Mahasiswa: {
      icon: GraduationCap,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
      label: "Mode Mahasiswa",
      description: "Maksimalkan waktu belajar, kompetisi, dan side project sebelum masuk dunia kerja.",
    },
    Karyawan: {
      icon: Briefcase,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
      label: "Mode Karyawan",
      description: "Strategi akselerasi karir: negosiasi promosi, skill upgrade, dan rencana transisi.",
    },
    Pengusaha: {
      icon: Building2,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
      label: "Mode Pengusaha",
      description: "Audit margin, strategi akuisisi klien B2B, dan optimasi proses bisnis.",
    },
    Freelancer: {
      icon: Laptop,
      color: "text-violet-500",
      bg: "bg-violet-500/10 border-violet-500/20",
      label: "Mode Freelancer",
      description: "Manajemen pipeline klien, diversifikasi income stream, dan rate negotiation.",
    },
    Menganggur: {
      icon: Rocket,
      color: "text-rose-500",
      bg: "bg-rose-500/10 border-rose-500/20",
      label: "Mode Aktif Mencari",
      description: "Action plan cepat: personal branding, portfolio building, dan jaringan aktif.",
    },
  };

  const currentConfig = statusConfig[formal_status] || statusConfig["Karyawan"];

  // Sub-module action items berdasarkan formal_status
  const subModuleActions: Record<string, { icon: any; title: string; desc: string; taskSuggestion: string }[]> = {
    Mahasiswa: [
      { icon: Award, title: "Ikuti 1 Kompetisi Bulan Ini", desc: "Hackathon, business plan, lomba karya ilmiah", taskSuggestion: "Daftar kompetisi dan kerjakan proposal" },
      { icon: BookOpen, title: "Riset Peluang Magang/Beasiswa", desc: "LinkedIn, Internships.id, IISMA, Bright Scholarship", taskSuggestion: "Riset 3 program magang/beasiswa relevan" },
      { icon: Lightbulb, title: "Mulai Side Project Portfolio", desc: "Aplikasi, tulisan, atau proyek nyata yang bisa dipajang", taskSuggestion: "Commit 1 jam/hari untuk side project portfolio" },
    ],
    Karyawan: [
      { icon: TrendingUp, title: "Negosiasi Promosi / Salary Review", desc: "Siapkan data kontribusi dan benchmark gaji pasar", taskSuggestion: "Buat dokumen achievement untuk negosiasi gaji" },
      { icon: Zap, title: "Upgrade 1 Skill Bernilai Tinggi", desc: "AI, data analysis, cloud, atau bahasa pemrograman baru", taskSuggestion: "Selesaikan 1 online course dalam 30 hari" },
      { icon: Briefcase, title: "Bangun Jaringan Lintas Divisi", desc: "Kenali 2 orang baru per bulan dari divisi lain", taskSuggestion: "Jadwalkan coffee chat dengan 2 kolega baru" },
    ],
    Pengusaha: [
      { icon: BarChart2, title: "Audit Margin & Unit Economics", desc: "Hitung COGS, gross margin, dan breakeven point", taskSuggestion: "Buat spreadsheet audit margin produk/jasa" },
      { icon: Users, title: "Strategi Akuisisi Klien B2B", desc: "Cold outreach, partnership, atau referral program", taskSuggestion: "Hubungi 5 prospek B2B minggu ini" },
      { icon: DollarSign, title: "Pisahkan Keuangan Bisnis & Pribadi", desc: "Buka rekening bisnis terpisah, catat semua cashflow bisnis", taskSuggestion: "Setup rekening bisnis dan laporan keuangan sederhana" },
    ],
    Freelancer: [
      { icon: DollarSign, title: "Naikkan Rate 20-30%", desc: "Review portofolio, tambah testimonial, reposition value", taskSuggestion: "Update portofolio dan rate card freelance" },
      { icon: Users, title: "Cari Klien Jangka Panjang (Retainer)", desc: "Retainer lebih stabil dari proyek satu kali", taskSuggestion: "Pitch proposal retainer ke 2 klien lama" },
      { icon: Laptop, title: "Diversifikasi Platform Income", desc: "Fiverr, Upwork, Toptal, atau marketplace lokal", taskSuggestion: "Daftar dan lengkapi profil di 1 platform baru" },
    ],
    Menganggur: [
      { icon: Rocket, title: "Quick Cash Quest — Mulai Hari Ini", desc: "Jasa fotografi, kursus privat, marketplace, atau kurir digital", taskSuggestion: "Identifikasi 3 quick cash option berdasarkan skill" },
      { icon: Award, title: "Personal Branding di LinkedIn", desc: "Update profil, tambah proyek, tulis 1 post per minggu", taskSuggestion: "Lengkapi profil LinkedIn dan publish 1 artikel" },
      { icon: BookOpen, title: "Skill Upgrade Intensif 2 Jam/Hari", desc: "Free course: Coursera, Google, YouTube, atau Khan Academy", taskSuggestion: "Daftar 1 course gratis dan belajar 2 jam/hari" },
    ],
  };

  const currentActions = subModuleActions[formal_status] || subModuleActions["Karyawan"];

  // Career track based on ladder level
  const isEarlyStage = ladderLevel <= 2; // Survival/Stabilitas early — fokus income power
  const isGrowthStage = ladderLevel >= 3; // Growth stage — bisa pikirkan investasi & scale

  return (
    <div className="overflow-y-auto pb-6 space-y-4">

      {/* ── STATUS BADGE HERO ── */}
      <div className="mx-4 mt-4">
        <div className={`rounded-2xl border p-4 ${currentConfig.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <currentConfig.icon className={`w-5 h-5 ${currentConfig.color}`} />
              <div>
                <p className={`text-xs font-black ${currentConfig.color}`}>{currentConfig.label}</p>
                <p className="text-[10px] text-muted-foreground">{formal_status} · {daily_free_hours}j bebas/hari</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground">{tDash("career.level")}</p>
              <p className={`text-sm font-black ${currentConfig.color}`}>Lv.{profile.level}</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{currentConfig.description}</p>
          {profile.career_goal && (
            <div className="mt-2 pt-2 border-t border-border/10">
              <p className="text-[10px] text-foreground/60 font-semibold">🎯 Tujuan: {profile.career_goal}</p>
            </div>
          )}

          {/* Health warning */}
          {health_baseline === "physical_limitation" && (
            <div className="mt-2 bg-amber-500/10 rounded-lg px-3 py-2">
              <p className="text-[10px] text-amber-500 font-bold">ℹ️ Keterbatasan Fisik — Hanya pekerjaan digital/intelektual yang ditampilkan.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── CAREER TRACK INDICATOR ── */}
      <div className="mx-4">
        <div className="flex gap-2">
          <div className={`flex-1 rounded-xl p-3 border ${isEarlyStage ? "bg-amber-500/10 border-amber-500/30" : "bg-muted/20 border-border/20"}`}>
            <p className={`text-[10px] font-black ${isEarlyStage ? "text-amber-500" : "text-muted-foreground"}`}>
              {isEarlyStage ? "🔥 AKTIF" : ""} Income Power Track
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Maks. penghasilan, kurangi hutang</p>
          </div>
          <div className={`flex-1 rounded-xl p-3 border ${isGrowthStage ? "bg-emerald-500/10 border-emerald-500/30" : "bg-muted/10 border-border/10 opacity-40"}`}>
            <div className="flex items-center gap-1">
              {!isGrowthStage && <Lock className="w-3 h-3 text-muted-foreground" />}
              <p className={`text-[10px] font-black ${isGrowthStage ? "text-emerald-500" : "text-muted-foreground"}`}>
                {isGrowthStage ? "🚀 AKTIF" : ""} Growth & Scale Track
              </p>
            </div>
            <p className="text-[9px] text-muted-foreground mt-0.5">Investasi karir dan bisnis</p>
          </div>
        </div>
      </div>

      {/* ── SUB-MODULE ACTIONS (berdasarkan formal_status) ── */}
      <div className="mx-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
          {tDash("career.priorityActions")} — {formal_status}
        </p>
        <div className="space-y-2">
          {currentActions.map((action, i) => (
            <button key={i}
              onClick={() => {
                setTaskTitle(action.taskSuggestion);
                setTaskCategory("Karir");
                setShowForm(true);
              }}
              className="w-full bg-card border border-border/20 rounded-2xl p-4 text-left hover:border-primary/30 active:scale-[0.99] transition-all">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                  <action.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">{action.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{action.desc}</p>
                </div>
                <Plus className="w-4 h-4 text-primary shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── IKIGAI SNAPSHOT ── */}
      {hasIkigai ? (
        <div className="mx-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
            {tDash("career.ikigaiProfile")}
          </p>
          <div className="bg-card border border-border/20 rounded-2xl p-4 space-y-2.5">
            {profile.hobbies.length > 0 && (
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Star className="w-3 h-3 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-emerald-500 uppercase">Suka (Passion)</p>
                  <p className="text-xs text-foreground">{profile.hobbies.slice(0, 3).join(", ")}{profile.hobbies.length > 3 ? ` +${profile.hobbies.length - 3}` : ""}</p>
                </div>
              </div>
            )}
            {profile.skills.length > 0 && (
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-primary uppercase">Bisa (Skill)</p>
                  <p className="text-xs text-foreground">{profile.skills.slice(0, 3).join(", ")}{profile.skills.length > 3 ? ` +${profile.skills.length - 3}` : ""}</p>
                </div>
              </div>
            )}
            {profile.interests.length > 0 && (
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-3 h-3 text-amber-500" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-amber-500 uppercase">Diminati (Market)</p>
                  <p className="text-xs text-foreground">{profile.interests.slice(0, 3).join(", ")}{profile.interests.length > 3 ? ` +${profile.interests.length - 3}` : ""}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mx-4">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground mb-0.5">{tDash("career.completeIkigai")}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Isi hobi, skill, dan minat di tab Profil. AI akan menemukan peluang karir dan side hustle terbaik untukmu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── REKOMENDASI SIDE HUSTLE (dari AI) ── */}
      {aiRecs.sideHustles?.length > 0 && (
        <div className="mx-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
            {tDash("career.sideHustleOpportunities")}
          </p>
          <div className="space-y-2">
            {aiRecs.sideHustles.map((sh, i) => {
              // Filter jika physical_limitation: sembunyikan pekerjaan fisik
              const physicalJobs = ["ojol", "kurir", "driver", "ojek", "lapangan", "motor"];
              if (health_baseline === "physical_limitation" && physicalJobs.some(kw => sh.title.toLowerCase().includes(kw))) return null;
              // Filter jika tidak punya motor/laptop
              if (!owned_assets.includes("laptop") && ["programming", "desain", "editing", "developer"].some(kw => sh.title.toLowerCase().includes(kw))) return null;

              return (
                <div key={i} className="bg-card border border-border/20 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-bold text-foreground flex-1">{sh.title}</p>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${sh.difficulty === "Mudah" ? "bg-emerald-500/10 text-emerald-500" : sh.difficulty === "Sedang" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"}`}>
                        {sh.difficulty}
                      </span>
                      <span className="text-[9px] font-bold text-primary">Ikigai {sh.ikigaiMatch}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-500 font-bold mb-1">{sh.estimatedIncome}/bulan</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{sh.description}</p>
                  {sh.ikigaiAnalysis && (
                    <div className="bg-primary/5 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-primary/80 italic">{sh.ikigaiAnalysis}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TO-DO LIST KARIR ── */}
      <div className="mx-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {tDash("tasks.title")}
          </p>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all">
            <Plus className="w-3 h-3" />
            {tDash("tasks.add")}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="bg-card border border-border/20 rounded-2xl p-4 space-y-3 mb-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1">{tDash("career.taskTitle")}</label>
              <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required autoFocus
                placeholder="Contoh: Buat CV baru, Pelajari React..."
                className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1">{tDash("career.category")}</label>
              <div className="flex flex-wrap gap-1.5">
                {["Karir", "Skill", "Side Hustle", "Bisnis", "Personal"].map(cat => (
                  <button key={cat} type="button" onClick={() => setTaskCategory(cat)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border font-bold transition-all ${taskCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isPending || !taskTitle.trim()}
                className="flex-1 h-9 rounded-xl font-bold text-xs bg-primary text-primary-foreground disabled:opacity-40">
                {isPending ? tDash("career.saving") : tDash("career.save")}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="h-9 px-3 rounded-xl text-xs text-muted-foreground border border-border/40">
                Batal
              </button>
            </div>
          </form>
        )}

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveFilter(cat)}
              className={`text-[10px] px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all shrink-0 ${activeFilter === cat ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"}`}>
              {cat}
              {cat !== filterAll && <span className="ml-1 opacity-60">({tasks.filter(t => t.category === cat).length})</span>}
            </button>
          ))}
        </div>

        {/* Task list */}
        {filteredTasks.length === 0
          ? (
            <div className="text-center py-8 bg-card border border-border/20 rounded-2xl">
              <CheckSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">{tDash("tasks.emptyTitle")}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{tDash("career.emptyTaskDesc")}</p>
            </div>
          )
          : (
            <div className="bg-card border border-border/20 rounded-2xl overflow-hidden divide-y divide-border/10">
              {filteredTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => handleToggle(task.id, task.completed)}
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${task.completed ? "bg-emerald-500 border-emerald-500" : "border-border/60"}`}>
                    {task.completed && <span className="text-[9px] text-white font-black">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.title}
                    </p>
                    <span className="text-[9px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded-full">
                      {task.category}
                    </span>
                  </div>
                  <button onClick={() => handleDelete(task.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
