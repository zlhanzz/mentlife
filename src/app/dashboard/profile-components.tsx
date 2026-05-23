// Profile Section Components
// Modular components untuk profile-tab.tsx

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { cn } from "@/lib/utils";

// Shared input styles
export const inputCls = "w-full h-11 px-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary transition-colors";
export const textareaCls = "w-full px-3 py-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary transition-colors resize-none";

// Progress Indicator Component
export function ProfileProgress({ sections, currentSection }: { sections: string[]; currentSection: string }) {
  const { lang } = useApp();
  const currentIndex = sections.indexOf(currentSection);
  const progress = Math.round(((currentIndex + 1) / sections.length) * 100);
  
  return (
    <div className="mx-4 mb-4">
      <div className="flex justify-between text-[10px] font-bold mb-1">
        <span className="text-muted-foreground">{lang === "id" ? "Progress Profil" : "Profile Progress"}</span>
        <span className="text-primary">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-500" 
          style={{ width: `${progress}%` }} 
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        {lang === "id" 
          ? `Langkah ${currentIndex + 1} dari ${sections.length}: ${currentSection}`
          : `Step ${currentIndex + 1} of ${sections.length}: ${currentSection}`
        }
      </p>
    </div>
  );
}

// AI Understanding Score Component
export function AIUnderstandingScore({ score, insights }: { score: number; insights: string[] }) {
  const { lang } = useApp();
  
  const getColor = (s: number) => {
    if (s < 30) return "text-rose-500";
    if (s < 60) return "text-amber-500";
    if (s < 80) return "text-emerald-500";
    return "text-emerald-600";
  };
  
  const getLabel = (s: number) => {
    if (s < 30) return lang === "id" ? "Perlu Lengkap" : "Needs Completion";
    if (s < 60) return lang === "id" ? "Cukup Lengkap" : "Moderately Complete";
    if (s < 80) return lang === "id" ? "Sangat Lengkap" : "Very Complete";
    return lang === "id" ? "Sempurna" : "Perfect";
  };
  
  return (
    <div className="mx-4 mb-4 bg-gradient-to-br from-primary/5 to-violet-500/5 border border-primary/20 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">{lang === "id" ? "Pemahaman AI" : "AI Understanding"}</p>
            <p className="text-[10px] text-muted-foreground">{getLabel(score)}</p>
          </div>
        </div>
        <span className={`text-2xl font-black ${getColor(score)}`}>{score}%</span>
      </div>
      
      <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${getColor(score).replace("text-", "bg-")}`} 
          style={{ width: `${score}%` }} 
        />
      </div>
      
      {insights.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-primary uppercase">{lang === "id" ? "Insight AI" : "AI Insights"}</p>
          {insights.slice(0, 3).map((insight, i) => (
            <p key={i} className="text-[10px] text-muted-foreground leading-relaxed">
              {insight}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Section Header Component
export function SectionHeader({ title, icon: Icon, description }: { title: string; icon: any; description?: string }) {
  const { lang } = useApp();
  
  return (
    <div className="px-4 pt-5 pb-4 flex items-center gap-4 border-b border-border/10">
      <div className="relative shrink-0">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary text-3xl font-black">
          {title.charAt(0).toUpperCase()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-lg font-black text-foreground truncate">{title}</p>
        {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold">Lv.1</span>
          <span className="text-[10px] bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-full font-bold">0 XP</span>
        </div>
      </div>
    </div>
  );
}

// Section Tabs Component
export function SectionTabs({ 
  sections, 
  currentSection, 
  onSelect 
}: { 
  sections: { id: string; label: string; icon: any }[]; 
  currentSection: string; 
  onSelect: (id: string) => void 
}) {
  const { lang } = useApp();
  
  return (
    <div className="flex gap-1 px-4 py-3 overflow-x-auto border-b border-border/10 shrink-0 select-none">
      {sections.map(({ id, label, icon: Icon }) => (
        <button 
          key={id} 
          onClick={() => onSelect(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            currentSection === id 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {lang === "id" ? label : label}
        </button>
      ))}
    </div>
  );
}

// Toggle List Component (for skills, hobbies, interests)
export function ToggleList({ 
  items, 
  selected, 
  onToggle, 
  title, 
  subtitle,
  colorClass 
}: { 
  items: string[]; 
  selected: string[]; 
  onToggle: (item: string) => void; 
  title: string; 
  subtitle?: string;
  colorClass: string;
}) {
  const { lang } = useApp();
  
  return (
    <div>
      <div className="mb-2">
        <p className="text-xs font-black text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground">{subtitle} · <span className={`${colorClass} font-bold`}>{selected.length} {lang === "id" ? "dipilih" : "selected"}</span></p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => {
          const isSelected = selected.includes(item);
          return (
            <button 
              key={item} 
              onClick={() => onToggle(item)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                isSelected 
                  ? `${colorClass.replace("text-", "bg-")} text-white border-transparent` 
                  : "border-border/50 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Financial Input Group Component
export function FinancialInputGroup({ 
  label, 
  value, 
  onChange, 
  placeholder 
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder?: string 
}) {
  const { lang } = useApp();
  
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground block mb-1.5">{label}</label>
      <input 
        type="number" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        min="0" 
        placeholder={placeholder || "0"} 
        className={inputCls} 
      />
    </div>
  );
}

// Info Banner Component
export function InfoBanner({ message, icon = "💡" }: { message: string; icon?: string }) {
  return (
    <div className="mx-4 mt-4 bg-muted/20 border border-border/30 rounded-2xl p-3.5 flex items-center gap-2">
      <span className="text-xs">{icon}</span>
      <p className="text-[10px] text-muted-foreground">{message}</p>
    </div>
  );
}

// Action Button Component
export function ActionButton({ 
  label, 
  onClick, 
  icon: Icon, 
  variant = "primary",
  disabled = false 
}: { 
  label: string; 
  onClick: () => void; 
  icon?: any; 
  variant?: "primary" | "success" | "danger";
  disabled?: boolean;
}) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    success: "bg-emerald-500 text-white hover:bg-emerald-600",
    danger: "bg-rose-500 text-white hover:bg-rose-600"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg active:scale-95 transition-all ${variants[variant]}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </button>
  );
}
