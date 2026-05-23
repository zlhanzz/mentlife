import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/app-context";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mentlife | Your AI Personal Mentor",
  description: "AI-powered personal mentor for Finance and Career tracking.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-primary/30">
        <AppProvider>
          <main className="flex-1 flex flex-col w-full max-w-md mx-auto relative min-h-screen border-x border-border/10 shadow-2xl bg-card/30">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
