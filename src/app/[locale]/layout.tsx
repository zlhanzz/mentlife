import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { locales, isRTL, type Locale } from "@/navigation";
import { AppProvider } from "@/context/app-context";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = isRTL(locale as Locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-primary/30">
        <NextIntlClientProvider messages={messages}>
          <AppProvider>
            <main className="flex-1 flex flex-col w-full max-w-md mx-auto relative min-h-screen border-x border-border/10 shadow-2xl bg-card/30">
              {children}
            </main>
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
