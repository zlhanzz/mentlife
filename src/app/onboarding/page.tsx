import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingForm from "@/features/onboarding/components/onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Prepopulate with full name from auth if available
  const fullName = user.user_metadata?.full_name || "";

  return (
    <div className="flex-1 flex items-center justify-center">
      <OnboardingForm initialName={fullName} />
    </div>
  );
}
