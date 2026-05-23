import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAIRecommendations } from "@/services/ai";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Get current authenticated user — only hard redirect if NOT authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // 2. Fetch profile — use defaults if missing (no redirect)
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If no profile row, create a minimal one
  if (!profileData) {
    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Mentee",
      skills: [],
      experience: "",
      hobbies: [],
      interests: [],
      career_state: "",
      career_goal: "",
      xp: 0,
      level: 1,
      badges: [],
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
  }

  // Only redirect to onboarding if profile clearly incomplete (no career_goal AND no skills)
  // This prevents infinite loops while still guiding new users
  const needsOnboarding = !profileData || 
    (!profileData.career_goal && (!profileData.skills || profileData.skills.length === 0));

  if (needsOnboarding) {
    redirect("/onboarding");
  }

  const profile = profileData!;

  // 3. Fetch financial profile — auto-create with defaults if missing
  let finance = null;
  const { data: financeData } = await supabase
    .from("financial_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!financeData) {
    const { data: newFinance } = await supabase
      .from("financial_profiles")
      .upsert({
        id: user.id,
        monthly_income: 0,
        fixed_expenses: 0,
        total_debt: 0,
        debt_details: "",
        current_stage: "EMERGENCY_FUND",
        emergency_fund_target: 0,
        emergency_fund_current: 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select()
      .single();
    finance = newFinance;
  } else {
    finance = financeData;
  }

  // Use defaults if finance still null (DB error)
  const safeFinance = finance ?? {
    monthly_income: 0,
    fixed_expenses: 0,
    total_debt: 0,
    debt_details: "",
    current_stage: "EMERGENCY_FUND" as const,
    emergency_fund_target: 0,
    emergency_fund_current: 0,
    liquid_savings: 0,
    investment_value: 0,
    cashflow_story: "",
    other_assets: 0,
    savings_story: "",
    has_debt: false,
    debt_high_interest: 0,
    debt_productive: 0,
    debt_zero_interest: 0,
    debt_story: "",
    has_investments: false,
    investment_instruments: [],
    investment_story: "",
    financial_priorities: [],
    financial_goals_story: "",
  };

  // 4. Fetch recent transactions (graceful fallback)
  const { data: transactions } = await supabase
    .from("financial_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // 5. Fetch chat history (graceful fallback)
  const { data: chats } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  // 6. Fetch decision projections (graceful fallback)
  const { data: projections } = await supabase
    .from("decision_projections")
    .select("id, title, description, horizon_years, projection_output")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 7. Fetch tasks (graceful fallback)
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("completed", { ascending: true })
    .order("created_at", { ascending: false });

  // 7b. Fetch users_core (graceful fallback)
  let usersCore = null;
  const { data: usersCoreData } = await supabase
    .from("users_core")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!usersCoreData) {
    try {
      const { data: newUc } = await supabase
        .from("users_core")
        .upsert({
          id: user.id,
          formal_status: "Karyawan",
          primary_focus: "Meniti Karir",
          daily_free_hours: 2,
          financial_state_id: "Stabilitas",
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
          current_roadblock: "sulit_menabung",
        }, { onConflict: "id" })
        .select()
        .single();
      usersCore = newUc;
    } catch (e) {
      console.error("Gagal inisialisasi users_core:", e);
    }
  } else {
    usersCore = usersCoreData;
  }

  const safeUsersCore = {
    id: user.id,
    formal_status: (usersCore?.formal_status || "Karyawan") as 'Mahasiswa' | 'Karyawan' | 'Pengusaha' | 'Freelancer' | 'Menganggur',
    primary_focus: usersCore?.primary_focus || "",
    daily_free_hours: Number(usersCore?.daily_free_hours) || 2,
    financial_state_id: (usersCore?.financial_state_id || "Stabilitas") as 'Survival' | 'Stabilitas' | 'Pertumbuhan' | 'Kebebasan',
    country_code: usersCore?.country_code || "ID",
    risk_profile: (usersCore?.risk_profile || "moderat") as 'konservatif' | 'moderat' | 'agresif',
    dependents_count: Number(usersCore?.dependents_count) || 0,
    is_sandwich_gen: !!usersCore?.is_sandwich_gen,
    owned_assets: usersCore?.owned_assets || [],
    marital_status: (usersCore?.marital_status || "single") as 'single' | 'married' | 'previously_married' | 'pacaran',
    major_life_goals: usersCore?.major_life_goals || [],
    health_baseline: (usersCore?.health_baseline || "fit") as 'fit' | 'physical_limitation' | 'burnout_alert',
    rent_by_choice: !!usersCore?.rent_by_choice,
    ai_communication_style: (usersCore?.ai_communication_style || "empatis_sabar") as 'empatis_sabar' | 'tegas_disiplin' | 'logis_objektif',
    current_roadblock: (usersCore?.current_roadblock || "sulit_menabung") as 'sulit_menabung' | 'arah_karir' | 'burnout_lelah' | 'kurang_disiplin',
    display_name: usersCore?.display_name || "",
    birth_date: usersCore?.birth_date || "",
    gender: (usersCore?.gender || "Memilih untuk tidak menjawab") as 'Laki-laki' | 'Perempuan' | 'Memilih untuk tidak menjawab',
    domicile: usersCore?.domicile || "",
    living_situation: (usersCore?.living_situation || "Tinggal Bersama Orang Tua/Keluarga") as 'Tinggal Bersama Orang Tua/Keluarga' | 'Sewa/Ngekost Bulanan' | 'Sewa/Kontrak Tahunan' | 'Milik Sendiri (KPR)' | 'Milik Sendiri (Lunas)',
    has_physical_limitation: !!usersCore?.has_physical_limitation,
    physical_limitation_details: usersCore?.physical_limitation_details || "",
    work_devices: usersCore?.work_devices || [],
    mobility_assets: usersCore?.mobility_assets || [],
    life_goal: usersCore?.life_goal || "",
  };

  // 8. Get AI recommendations
  const aiRecs = await getAIRecommendations(
    {
      full_name: profile.full_name || "Mentee",
      skills: profile.skills || [],
      experience: profile.experience || "",
      hobbies: profile.hobbies || [],
      interests: profile.interests || [],
      career_goal: profile.career_goal || "",
    },
    {
      monthly_income: Number(safeFinance.monthly_income) || 0,
      fixed_expenses: Number(safeFinance.fixed_expenses) || 0,
      total_debt: Number(safeFinance.total_debt) || 0,
      current_stage: (safeFinance.current_stage as "DEBT" | "EMERGENCY_FUND" | "INVESTMENT") || "EMERGENCY_FUND",
    },
    safeUsersCore
  );

  return (
    <DashboardClient
      profile={{
        id: profile.id,
        full_name: profile.full_name || "",
        age: profile.age ? Number(profile.age) : undefined,
        background: profile.background || "",
        skills: profile.skills || [],
        experience: profile.experience || "",
        hobbies: profile.hobbies || [],
        interests: profile.interests || [],
        career_state: profile.career_state || "",
        career_goal: profile.career_goal || "",
        life_goal: profile.life_goal || "",
        xp: Number(profile.xp) || 0,
        level: Number(profile.level) || 1,
        badges: profile.badges || [],
        education_options: profile.education_options || [],
        education_story: profile.education_story || "",
        status_options: profile.status_options || [],
        status_story: profile.status_story || "",
        skills_story: profile.skills_story || "",
        hobbies_story: profile.hobbies_story || "",
        interests_story: profile.interests_story || "",
        north_star_options: profile.north_star_options || [],
        north_star_story: profile.north_star_story || "",
      }}
      finance={{
        id: safeFinance.id || user.id,
        monthly_income: Number(safeFinance.monthly_income) || 0,
        fixed_expenses: Number(safeFinance.fixed_expenses) || 0,
        total_debt: Number(safeFinance.total_debt) || 0,
        debt_details: safeFinance.debt_details || "",
        current_stage: (safeFinance.current_stage as "DEBT" | "EMERGENCY_FUND" | "INVESTMENT") || "EMERGENCY_FUND",
        emergency_fund_target: Number(safeFinance.emergency_fund_target) || 0,
        emergency_fund_current: Number(safeFinance.emergency_fund_current) || 0,
        liquid_savings: Number(safeFinance.liquid_savings) || 0,
        investment_value: Number(safeFinance.investment_value) || 0,
        cashflow_story: safeFinance.cashflow_story || "",
        other_assets: Number(safeFinance.other_assets) || 0,
        savings_story: safeFinance.savings_story || "",
        has_debt: !!safeFinance.has_debt,
        debt_high_interest: Number(safeFinance.debt_high_interest) || 0,
        debt_productive: Number(safeFinance.debt_productive) || 0,
        debt_zero_interest: Number(safeFinance.debt_zero_interest) || 0,
        debt_story: safeFinance.debt_story || "",
        has_investments: !!safeFinance.has_investments,
        investment_instruments: safeFinance.investment_instruments || [],
        investment_story: safeFinance.investment_story || "",
        financial_priorities: safeFinance.financial_priorities || [],
        financial_goals_story: safeFinance.financial_goals_story || "",
      }}
      usersCore={safeUsersCore}
      aiRecs={aiRecs}
      initialChats={chats || []}
      initialProjections={projections || []}
      initialTransactions={transactions || []}
      initialTasks={tasks || []}
    />
  );
}
