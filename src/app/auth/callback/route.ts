import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("OAuth callback error:", error);
      redirect(`${origin}/login?error=oauth_failed`);
    }
  }

  // Redirect to the appropriate page based on user's onboarding status
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect("/login?error=auth_failed");
  }

  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("career_goal, skills")
    .eq("id", user.id)
    .single();

  if (!profile || (!profile.career_goal && (!profile.skills || profile.skills.length === 0))) {
    redirect("/onboarding");
  }

  redirect(next);
}
