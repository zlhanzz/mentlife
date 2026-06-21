import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { locales, defaultLocale, type Locale } from "@/navigation";

async function getLocaleFromCookie(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  if (localeCookie && (locales as readonly string[]).includes(localeCookie)) {
    return localeCookie as Locale;
  }
  return defaultLocale;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type") ?? "";
  const locale = await getLocaleFromCookie();

  // ── Password Recovery Flow ──────────────────────────────────────────────
  // Supabase sends ?type=recovery&code=... when user clicks reset password email link
  if (type === "recovery" && code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Password recovery callback error:", error);
      redirect(`/${locale}/login?error=recovery_failed`);
    }
    // Session is now active — redirect to reset password page
    redirect(`/${locale}/reset-password`);
  }

  // ── Email Verification (Signup) Flow ─────────────────────────────────────
  // Supabase sends ?type=signup&code=... when user clicks email verification link
  if (type === "signup" && code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Email verification callback error:", error);
      redirect(`/${locale}/login?error=verification_failed`);
    }
    // Email confirmed and session created — redirect to onboarding
    redirect(`/${locale}/onboarding`);
  }

  // ── OAuth (Google) Flow ──────────────────────────────────────────────────
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("OAuth callback error:", error);
      redirect(`/${locale}/login?error=oauth_failed`);
    }
  }

  // ── Post-auth routing ────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login?error=auth_failed`);
  }

  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("career_goal, skills")
    .eq("id", user.id)
    .single();

  if (!profile || (!profile.career_goal && (!profile.skills || profile.skills.length === 0))) {
    redirect(`/${locale}/onboarding`);
  }

  redirect(`/${locale}/dashboard`);
}
