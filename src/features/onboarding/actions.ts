"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { curateOnboardingStep, StepCurationResult, generateWelcomeAnalysis, WelcomeAnalysisResult } from "@/services/ai";

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

  // ── Extract all form fields ──
  const fullName = formData.get("fullName") as string;
  const displayName = formData.get("displayName") as string;
  const birthDate = formData.get("birthDate") as string;
  const domicile = formData.get("domicile") as string;
  const livingSituation = formData.get("livingSituation") as string;
  const lifeGoal = formData.get("lifeGoal") as string;

  const skillsRaw = formData.get("skills") as string;
  const experience = formData.get("experience") as string;
  const skillStory = formData.get("skillStory") as string;
  const hobbiesRaw = formData.get("hobbies") as string;
  const hobbyStory = formData.get("hobbyStory") as string;
  const interestsRaw = formData.get("interests") as string;
  const interestStory = formData.get("interestStory") as string;

  const formalStatus = formData.get("formalStatus") as string;
  const careerState = formData.get("careerState") as string;
  const careerGoal = formData.get("careerGoal") as string;
  const primaryFocus = formData.get("primaryFocus") as string;
  const dailyFreeHours = parseInt(formData.get("dailyFreeHours") as string) || 2;
  const educationHistoryRaw = formData.get("educationHistory") as string;
  const dependents = formData.get("dependents") as string;
  const gender = formData.get("gender") as string;
  const insurance = formData.get("insurance") as string;

  const monthlyIncome = parseFloat(formData.get("monthlyIncome") as string) || 0;
  const fixedExpenses = parseFloat(formData.get("fixedExpenses") as string) || 0;
  const liquidSavings = parseFloat(formData.get("liquidSavings") as string) || 0;
  const totalDebt = parseFloat(formData.get("totalDebt") as string) || 0;
  const debtHighInterest = parseFloat(formData.get("debtHighInterest") as string) || 0;
  const debtProductive = parseFloat(formData.get("debtProductive") as string) || 0;
  const debtZeroInterest = parseFloat(formData.get("debtZeroInterest") as string) || 0;
  const riskProfile = formData.get("riskProfile") as string;
  const investmentExperienceRaw = formData.get("investmentExperience") as string;

  const workDevicesRaw = formData.get("workDevices") as string;
  const deviceBrandsRaw = formData.get("deviceBrands") as string;
  const mobilityAssetsRaw = formData.get("mobilityAssets") as string;

  // ── Process arrays ──
  const skills = skillsRaw ? skillsRaw.split(",").map(s => s.trim()).filter(Boolean) : [];
  const hobbies = hobbiesRaw ? hobbiesRaw.split(",").map(h => h.trim()).filter(Boolean) : [];
  const interests = interestsRaw ? interestsRaw.split(",").map(i => i.trim()).filter(Boolean) : [];
  const workDevices = workDevicesRaw ? workDevicesRaw.split(",").map(d => d.trim()).filter(Boolean) : [];
  const mobilityAssets = mobilityAssetsRaw ? mobilityAssetsRaw.split(",").map(m => m.trim()).filter(Boolean) : [];
  const deviceBrands = deviceBrandsRaw ? JSON.parse(deviceBrandsRaw) as Record<string, string> : {};
  const investmentExperience = investmentExperienceRaw ? investmentExperienceRaw.split(",").map(s => s.trim()).filter(Boolean) : [];
  const educationHistory = educationHistoryRaw ? educationHistoryRaw.split(",").map(s => s.trim()).filter(Boolean) : [];

  // ── Determine financial stage ──
  const currentStage = totalDebt > 0 ? "DEBT" : "EMERGENCY_FUND";
  const financialStateId = totalDebt > 0 ? "Survival" : "Stabilitas";
  const emergencyFundTarget = fixedExpenses * 6; // Framework standard: minimal 6 bulan

  // Parse dependents
  let dependentsCount = 0;
  let isSandwichGen = false;
  if (dependents === "1-2 orang") { dependentsCount = 2; }
  else if (dependents === "3+ orang") { dependentsCount = 3; isSandwichGen = true; }

  // ── Determine formal_status ──
  let formalStatusEnum: 'Mahasiswa' | 'Karyawan' | 'Pengusaha' | 'Freelancer' | 'Menganggur' = 'Karyawan';
  const lower = (formalStatus || careerState || "").toLowerCase();
  if (lower.includes("mahasiswa") || lower.includes("pelajar") || lower.includes("siswa")) {
    formalStatusEnum = 'Mahasiswa';
  } else if (lower.includes("bisnis") || lower.includes("pengusaha") || lower.includes("wiraswasta") || lower.includes("usaha") || lower.includes("owner")) {
    formalStatusEnum = 'Pengusaha';
  } else if (lower.includes("freelance") || lower.includes("lepas")) {
    formalStatusEnum = 'Freelancer';
  } else if (lower.includes("mencari") || lower.includes("menganggur") || lower.includes("tidak bekerja") || lower.includes("lamar")) {
    formalStatusEnum = 'Menganggur';
  } else if (lower.includes("karyawan") || lower.includes("pns") || lower.includes("bumn") || lower.includes("pegawai") || lower.includes("kerja") || lower.includes("staff")) {
    formalStatusEnum = 'Karyawan';
  }

  // ── Determine roadblock ──
  let currentRoadblock: 'sulit_menabung' | 'arah_karir' | 'burnout_lelah' | 'kurang_disiplin' = 'arah_karir';
  if (totalDebt > 0) currentRoadblock = 'sulit_menabung';

  // 1. UPSERT profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: fullName || user.user_metadata?.full_name || "Mentee",
      life_goal: lifeGoal || null,
      skills,
      experience,
      skills_story: skillStory || null,
      hobbies,
      hobbies_story: hobbyStory || null,
      interests,
      interests_story: interestStory || null,
      career_state: careerState || formalStatusEnum,
      career_goal: careerGoal || primaryFocus || "Meniti Karir",
      education_options: educationHistory,
      education_story: skillStory || null,
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
      debt_high_interest: debtHighInterest,
      debt_productive: debtProductive,
      debt_zero_interest: debtZeroInterest,
      liquid_savings: liquidSavings,
      current_stage: currentStage,
      emergency_fund_target: emergencyFundTarget,
      emergency_fund_current: 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (financialError) {
    return { success: false, message: `Gagal menyimpan data finansial: ${financialError.message}` };
  }

  // 3. UPSERT users_core table
  const { error: usersCoreError } = await supabase
    .from("users_core")
    .upsert({
      id: user.id,
      formal_status: formalStatusEnum,
      primary_focus: primaryFocus || careerGoal || "Meniti Karir",
      daily_free_hours: dailyFreeHours,
      financial_state_id: financialStateId,
      country_code: "ID",
      risk_profile: riskProfile || "moderat",
      dependents_count: dependentsCount,
      is_sandwich_gen: isSandwichGen,
      gender: gender || null,
      insurance: insurance || null,
      owned_assets: [],
      marital_status: "single",
      major_life_goals: [],
      health_baseline: "fit",
      rent_by_choice: false,
      ai_communication_style: "empatis_sabar",
      current_roadblock: currentRoadblock,
      display_name: displayName || null,
      birth_date: birthDate || null,
      domicile: domicile || null,
      living_situation: livingSituation || null,
      work_devices: workDevices,
      device_brands: deviceBrands,
      mobility_assets: mobilityAssets,
      life_goal: lifeGoal || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (usersCoreError) {
    return { success: false, message: `Gagal menyimpan data sandbox: ${usersCoreError.message}` };
  }

  // Clear draft on successful onboarding completion
  await clearOnboardingDraft();

  redirect("/dashboard");
}

// ── Draft Auto-Save / Load / Clear ──

export async function saveOnboardingDraft(step: number, draftData: Record<string, unknown>): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, message: "Sesi tidak ditemukan." };

  const { error } = await supabase
    .from("onboarding_drafts")
    .upsert({
      id: user.id,
      current_step: step,
      draft_data: draftData,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export interface DraftPayload {
  current_step: number;
  draft_data: Record<string, unknown>;
  ai_insights: string[];
}

export async function loadOnboardingDraft(): Promise<{ success: boolean; draft?: DraftPayload; message?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, message: "Sesi tidak ditemukan." };

  // Try Supabase first
  const { data, error } = await supabase
    .from("onboarding_drafts")
    .select("current_step, draft_data, ai_insights")
    .eq("id", user.id)
    .single();

  if (error || !data) return { success: false, message: "Tidak ada draft." };
  return { success: true, draft: data as DraftPayload };
}

export async function clearOnboardingDraft(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("onboarding_drafts").delete().eq("id", user.id);
}

export async function curateStepAction(
  step: number,
  data: Parameters<typeof curateOnboardingStep>[1]
): Promise<StepCurationResult> {
  return curateOnboardingStep(step, data);
}

export async function welcomeAnalysisAction(
  data: Parameters<typeof generateWelcomeAnalysis>[0]
): Promise<WelcomeAnalysisResult> {
  console.log("[Server Action] welcomeAnalysisAction called for:", data.name);
  try {
    const result = await generateWelcomeAnalysis(data);
    console.log("[Server Action] AI result:", result.greeting.substring(0, 50));
    return result;
  } catch (e: any) {
    console.error("[Server Action] welcomeAnalysisAction ERROR:", e?.message || e);
    throw e;
  }
}
