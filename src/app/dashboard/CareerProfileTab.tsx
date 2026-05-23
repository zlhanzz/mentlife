"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { 
  GraduationCap, Clock, Zap, Heart, Compass, Target, Plus, X 
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

interface CategorySectionProps {
  title: string;
  icon: any;
  defaultOptions: string[];
  selected: string[];
  onToggle: (item: string) => void;
  customPlaceholder: string;
  storyPlaceholder: string;
  storyValue: string;
  onStoryChange: (val: string) => void;
  colorClass: keyof typeof colorMaps;
}

export function CategorySection({
  title,
  icon: Icon,
  defaultOptions,
  selected,
  onToggle,
  customPlaceholder,
  storyPlaceholder,
  storyValue,
  onStoryChange,
  colorClass
}: CategorySectionProps) {
  const { lang } = useApp();
  const [customInput, setCustomInput] = useState("");
  const colors = colorMaps[colorClass];

  const allOptions = Array.from(new Set([...defaultOptions, ...selected]));

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onToggle(trimmed);
      setCustomInput("");
    }
  };

  return (
    <div className="bg-card/45 backdrop-blur-md border border-border/20 rounded-3xl p-5 space-y-4 hover:border-border/40 transition-all duration-300 shadow-md">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-border/10">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center ${colors.text} border border-border/10`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-black text-foreground">{title}</h3>
      </div>

      {/* Option Tags */}
      <div>
        <div className="flex flex-wrap gap-2 mb-3">
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
                {isSelected && (
                  <span className="opacity-80 hover:opacity-100">
                    <X className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Input */}
        <form onSubmit={handleAddCustom} className="flex gap-2 max-w-sm">
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
      </div>

      {/* Story Textarea */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>{lang === "id" ? "Detail & Cerita Tambahan" : "Details & Context"}</span>
          <span className="text-[10px] opacity-75">{storyValue.length}/500</span>
        </div>
        <textarea
          value={storyValue}
          onChange={e => onStoryChange(e.target.value.slice(0, 500))}
          rows={3}
          maxLength={500}
          placeholder={storyPlaceholder}
          className={`w-full px-3.5 py-3 rounded-2xl border border-border/40 bg-background/35 text-sm focus:outline-none ${colors.borderActive} transition-all resize-none min-h-[90px] placeholder:text-muted-foreground/60`}
        />
      </div>
    </div>
  );
}

interface CareerProfileTabProps {
  // Pendidikan
  educationOptions: string[];
  setEducationOptions: React.Dispatch<React.SetStateAction<string[]>>;
  educationStory: string;
  setEducationStory: (val: string) => void;

  // Status
  statusOptions: string[];
  setStatusOptions: React.Dispatch<React.SetStateAction<string[]>>;
  statusStory: string;
  setStatusStory: (val: string) => void;

  // Skills
  skills: string[];
  setSkills: React.Dispatch<React.SetStateAction<string[]>>;
  skillsStory: string;
  setSkillsStory: (val: string) => void;

  // Hobbies
  hobbies: string[];
  setHobbies: React.Dispatch<React.SetStateAction<string[]>>;
  hobbiesStory: string;
  setHobbiesStory: (val: string) => void;

  // North Star / Target Karir
  northStarOptions: string[];
  setNorthStarOptions: React.Dispatch<React.SetStateAction<string[]>>;
  northStarStory: string;
  setNorthStarStory: (val: string) => void;
}

export default function CareerProfileTab({
  educationOptions,
  setEducationOptions,
  educationStory,
  setEducationStory,

  statusOptions,
  setStatusOptions,
  statusStory,
  setStatusStory,

  skills,
  setSkills,
  skillsStory,
  setSkillsStory,

  hobbies,
  setHobbies,
  hobbiesStory,
  setHobbiesStory,

  northStarOptions,
  setNorthStarOptions,
  northStarStory,
  setNorthStarStory
}: CareerProfileTabProps) {
  const toggle = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setList(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  // Default option lists
  const defaultEducation = ["SMA/SMK", "Diploma", "Sarjana (S1)", "Pascasarjana", "Bootcamp/Kursus", "Otodidak"];
  const defaultStatus = ["Mahasiswa/Pelajar", "Karyawan Swasta", "PNS/BUMN", "Pemilik Bisnis", "Freelancer", "Mencari Peluang"];
  const defaultSkills = ["Programming", "Graphic Design", "Copywriting", "Video Editing", "Sales & Marketing", "Data Analysis", "Teaching/Mentoring", "Excel/Admin", "Public Speaking", "Content Creator", "Social Media", "Photography", "Desain Interior", "Memasak", "Musik", "Bahasa Asing", "Customer Service", "Akuntansi", "Desain Fashion", "Animasi/Ilustrasi"];
  const defaultHobbies = ["Gaming", "Writing/Blogging", "Photography", "Cooking/Baking", "Fitness/Gym", "Art/Drawing", "Traveling", "Musik/Bernyanyi", "Membaca", "Berkebun", "DIY/Craft", "Hiking/Outdoor", "Dancing", "Podcasting", "Streaming", "Fashion", "Otomotif", "Coding/Tech", "Film/Sinema", "Olahraga"];
  const defaultCareerGoals = ["Mencari Pekerjaan Baru", "Naik Jabatan / Promosi", "Pindah Arah Karir (Pivot)", "Membangun Bisnis / Side Hustle", "Meningkatkan Skill Spesifik", "Mencari Kerja Remote / Freelance", "Keseimbangan Hidup (Work-Life Balance)"];

  return (
    <div className="space-y-6">
      {/* 1. Pendidikan & Pelatihan */}
      <CategorySection
        title="Pendidikan & Pelatihan"
        icon={GraduationCap}
        defaultOptions={defaultEducation}
        selected={educationOptions}
        onToggle={item => toggle(educationOptions, setEducationOptions, item)}
        customPlaceholder="Add custom education..."
        storyPlaceholder="Ceritakan lebih detail tentang fokus pendidikan atau pelatihan yang pernah kamu ambil."
        storyValue={educationStory}
        onStoryChange={setEducationStory}
        colorClass="indigo"
      />

      {/* 2. Status & Rutinitas Saat Ini */}
      <CategorySection
        title="Status & Rutinitas Saat Ini"
        icon={Clock}
        defaultOptions={defaultStatus}
        selected={statusOptions}
        onToggle={item => toggle(statusOptions, setStatusOptions, item)}
        customPlaceholder="Add custom status..."
        storyPlaceholder="Bagaimana realitas pekerjaan atau rutinitasmu saat ini?"
        storyValue={statusStory}
        onStoryChange={setStatusStory}
        colorClass="sky"
      />

      {/* 3. Keahlian (Skills) */}
      <CategorySection
        title="Keahlian (Skills)"
        icon={Zap}
        defaultOptions={defaultSkills}
        selected={skills}
        onToggle={item => toggle(skills, setSkills, item)}
        customPlaceholder="Add custom skill..."
        storyPlaceholder="Dari semua keahlian di atas, mana yang paling ingin kamu jadikan senjata utama untuk menghasilkan uang?"
        storyValue={skillsStory}
        onStoryChange={setSkillsStory}
        colorClass="primary"
      />

      {/* 4. Kegemaran (Hobbies) */}
      <CategorySection
        title="Kegemaran (Hobbies)"
        icon={Heart}
        defaultOptions={defaultHobbies}
        selected={hobbies}
        onToggle={item => toggle(hobbies, setHobbies, item)}
        customPlaceholder="Add custom hobby..."
        storyPlaceholder="Hobi atau aktivitas apa yang biasanya sering membuatmu lupa waktu?"
        storyValue={hobbiesStory}
        onStoryChange={setHobbiesStory}
        colorClass="emerald"
      />

      {/* 5. Target & Prioritas Karir */}
      <CategorySection
        title="Target & Prioritas Karir"
        icon={Target}
        defaultOptions={defaultCareerGoals}
        selected={northStarOptions}
        onToggle={item => toggle(northStarOptions, setNorthStarOptions, item)}
        customPlaceholder="Add custom career goal..."
        storyPlaceholder="Gambarkan target karirmu secara spesifik dan prioritas utama yang ingin kamu capai dalam 1-3 tahun ke depan."
        storyValue={northStarStory}
        onStoryChange={setNorthStarStory}
        colorClass="amber"
      />
    </div>
  );
}
