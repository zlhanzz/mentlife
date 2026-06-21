"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname, locales, type Locale } from "@/navigation";
import { Globe } from "lucide-react";

const localeLabels: Record<Locale, string> = {
  id: "🇮🇩 Indonesia",
  en: "🇬🇧 English",
  ms: "🇲🇾 Malay",
  ar: "🇸🇦 العربية",
  jp: "🇯🇵 日本語",
  kr: "🇰🇷 한국어",
};

export default function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;samesite=lax`;
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted/50 border border-border/50 hover:bg-muted transition-colors"
        aria-label="Change language"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{localeLabels[locale]?.split(" ")[0]}</span>
      </button>
      <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => handleLocaleChange(l)}
              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                l === locale
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              {localeLabels[l]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
