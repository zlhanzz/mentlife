import { Button } from "@/components/ui/button";
import { ArrowRight, BrainCircuit, Target, Wallet } from "lucide-react";
import { Link } from "@/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import LocaleSwitcher from "@/components/locale-switcher";

export default async function Home(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "landing" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="flex-1 flex flex-col pt-12 pb-8 px-6 bg-gradient-to-b from-background to-background/50">
      {/* Locale Switcher */}
      <div className="absolute top-4 right-4">
        <LocaleSwitcher />
      </div>

      {/* Header */}
      <div className="flex justify-center mb-8">
        <div className="bg-primary/10 p-3 rounded-2xl ring-1 ring-primary/20 shadow-[0_0_40px_-10px_rgba(var(--primary),0.3)]">
          <BrainCircuit className="w-10 h-10 text-primary" />
        </div>
      </div>

      {/* Hero Content */}
      <div className="flex flex-col items-center text-center mb-12 space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/70">
          Mentlife
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-[280px]">
          {t("heroSubtitle")}
        </p>
      </div>

      {/* Features */}
      <div className="flex flex-col space-y-4 mb-auto">
        <div className="flex items-center space-x-4 p-4 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{t("features.finance.title")}</h3>
            <p className="text-sm text-muted-foreground">{t("features.finance.desc")}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 p-4 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <Target className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{t("features.career.title")}</h3>
            <p className="text-sm text-muted-foreground">{t("features.career.desc")}</p>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="mt-12 flex flex-col space-y-3">
        <Link href="/login" className="w-full">
          <Button size="lg" className="w-full rounded-xl text-base h-14 font-semibold group">
            {t("cta.button")}
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
        <p className="text-xs text-center text-muted-foreground">
          {t("cta.legal")}
        </p>
      </div>
    </div>
  );
}
