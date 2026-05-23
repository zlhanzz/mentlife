"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type OnboardingState = {
  success: boolean;
  message: string;
};

export async function submitOnboardingAction(prevState: OnboardingState | null, formData: FormData): Promise<OnboardingState> {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, message: "Sesi login tidak ditemukan. Silakan login kembali." };
  }

  // Extract form fields
  const fullName = formData.get("fullName") as string;
  const skillsRaw = formData.get("skills") as string;
  const experience = formData.get("experience") as string;
  const hobbiesRaw = formData.get("hobbies") as string;
  const interestsRaw = formData.get("interests") as string;
  const careerState = formData.get("careerState") as string;
  const careerGoal = formData.get("careerGoal") as string;

  const monthlyIncome = parseFloat(formData.get("monthlyIncome") as string) || 0;
  const fixedExpenses = parseFloat(formData.get("fixedExpenses") as string) || 0;
  const totalDebt = parseFloat(formData.get("totalDebt") as string) || 0;
  const debtDetails = formData.get("debtDetails") as string;

  // Process arrays
  const skills = skillsRaw ? skillsRaw.split(",").map(s => s.trim()).filter(Boolean) : [];
  const hobbies = hobbiesRaw ? hobbiesRaw.split(",").map(h => h.trim()).filter(Boolean) : [];
  const interests = interestsRaw ? interestsRaw.split(",").map(i => i.trim()).filter(Boolean) : [];

  // Determine stage
  const currentStage = totalDebt > 0 ? "DEBT" : "EMERGENCY_FUND";
  
  // Target emergency fund = 6 times fixed monthly expenses
  const emergencyFundTarget = fixedExpenses * 6;

  // 1. UPSERT profiles table (INSERT if not exist, UPDATE if exist)
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: fullName || user.user_metadata?.full_name || "Mentee",
      skills,
      experience,
      hobbies,
      interests,
      career_state: careerState,
      career_goal: careerGoal,
      xp: 0,
      level: 1,
      badges: [],
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (profileError) {
    return { success: false, message: `Gagal menyimpan profil: ${profileError.message}` };
  }

  // 2. UPSERT financial_profiles table
  const { error: financialError } = await supabase
    .from("financial_profiles")
    .upsert({
      id: user.id,
      monthly_income: monthlyIncome,
      fixed_expenses: fixedExpenses,
      total_debt: totalDebt,
      debt_details: debtDetails,
      current_stage: currentStage,
      emergency_fund_target: emergencyFundTarget,
      emergency_fund_current: 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (financialError) {
    return { success: false, message: `Gagal menyimpan data finansial: ${financialError.message}` };
  }

  // 3. UPSERT users_core table
  const careerStateLower = (careerState || "").toLowerCase();
  let formalStatus: 'Mahasiswa' | 'Karyawan' | 'Pengusaha' | 'Freelancer' | 'Menganggur' = 'Karyawan';
  if (careerStateLower.includes("mahasiswa") || careerStateLower.includes("pelajar")) {
    formalStatus = 'Mahasiswa';
  } else if (careerStateLower.includes("bisnis") || careerStateLower.includes("pengusaha") || careerStateLower.includes("wiraswasta") || careerStateLower.includes("usaha")) {
    formalStatus = 'Pengusaha';
  } else if (careerStateLower.includes("freelance")) {
    formalStatus = 'Freelancer';
  } else if (careerStateLower.includes("mencari peluang") || careerStateLower.includes("menganggur") || careerStateLower.includes("tidak bekerja")) {
    formalStatus = 'Menganggur';
  } else if (careerStateLower.includes("karyawan") || careerStateLower.includes("pns") || careerStateLower.includes("bumn") || careerStateLower.includes("pegawai")) {
    formalStatus = 'Karyawan';
  }

  const { error: usersCoreError } = await supabase
    .from("users_core")
    .upsert({
      id: user.id,
      formal_status: formalStatus,
      primary_focus: careerGoal || "Meniti Karir",
      daily_free_hours: 2,
      financial_state_id: totalDebt > 0 ? "Survival" : "Stabilitas",
      country_code: "ID",
      risk_profile: "moderat",
      dependents_count: 0,
      is_sandwich_gen: false,
      owned_assets: [],
      marital_status: "single",
      major_life_goals: [],
      health_baseline: "fit",
      rent_by_choice: false,
      ai_communication_style: "empatis_sabar",
      current_roadblock: totalDebt > 0 ? "sulit_menabung" : "arah_karir",
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (usersCoreError) {
    return { success: false, message: `Gagal menyimpan data sandbox: ${usersCoreError.message}` };
  }

  redirect("/dashboard");
}
