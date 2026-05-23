"use server";

import { createClient } from "@/lib/supabase/server";
import { getDecisionProjection, DecisionProjectionResult, extractDataFromChat, getAIRecommendations } from "@/services/ai";
import { evaluateFinancialLadder, getCurrencyConfig } from "@/services/financial-ladder";
import { revalidatePath } from "next/cache";

export type ActionResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
};

// 0. Action: Update full user profile + financial profile
export async function updateProfileAction(data: {
  full_name: string;
  age: number; // Added age
  background: string;
  skills: string[];
  hobbies: string[];
  interests: string[];
  experience: string;
  career_state: string;
  career_goal: string;
  life_goal: string;
  monthly_income: number;
  fixed_expenses: number;
  total_debt: number;
  debt_details: string;
  liquid_savings?: number;
  investment_value?: number;
  emergency_fund_current?: number;
  
  // 6 Sections fields
  education_options?: string[];
  education_story?: string;
  status_options?: string[];
  status_story?: string;
  skills_story?: string;
  hobbies_story?: string;
  interests_story?: string;
  north_star_options?: string[];
  north_star_story?: string;

  // FinanceProfileTab fields
  cashflow_story?: string;
  other_assets?: number;
  savings_story?: string;
  has_debt?: boolean;
  debt_high_interest?: number;
  debt_productive?: number;
  debt_zero_interest?: number;
  debt_story?: string;
  has_investments?: boolean;
  investment_instruments?: string[];
  investment_story?: string;
  financial_priorities?: string[];
  financial_goals_story?: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, message: "Sesi tidak ditemukan. Silakan login ulang." };

  const currentStage = data.total_debt > 0 ? "DEBT" : "EMERGENCY_FUND";
  const emergencyFundTarget = data.fixed_expenses * 6;

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: data.full_name,
    age: data.age, // Persist age
    skills: data.skills,
    hobbies: data.hobbies,
    interests: data.interests,
    experience: data.experience,
    career_state: data.career_state,
    career_goal: data.career_goal,
    life_goal: data.life_goal,
    background: data.background,
    
    // Save new 6 sections columns
    education_options: data.education_options || [],
    education_story: data.education_story || "",
    status_options: data.status_options || [],
    status_story: data.status_story || "",
    skills_story: data.skills_story || "",
    hobbies_story: data.hobbies_story || "",
    interests_story: data.interests_story || "",
    north_star_options: data.north_star_options || [],
    north_star_story: data.north_star_story || "",
    
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });

  if (profileError) return { success: false, message: `Gagal menyimpan profil: ${profileError.message}` };

  // Map career_state to formal_status for users_core
  const careerStateLower = (data.career_state || "").toLowerCase();
  let formalStatus: 'Mahasiswa' | 'Karyawan' | 'Pengusaha' | 'Freelancer' | 'Menganggur' | undefined = undefined;
  if (careerStateLower) {
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
  }

  const usersCorePayload: Record<string, any> = {
    id: user.id,
    updated_at: new Date().toISOString(),
  };
  if (formalStatus) {
    usersCorePayload.formal_status = formalStatus;
  }
  if (data.career_goal) {
    usersCorePayload.primary_focus = data.career_goal;
  }
  if (data.life_goal) {
    usersCorePayload.life_goal = data.life_goal;
  }

  const { error: usersCoreError } = await supabase
    .from("users_core")
    .upsert(usersCorePayload, { onConflict: "id" });

  if (usersCoreError) {
    return { success: false, message: `Gagal memperbarui data inti pengguna (users_core): ${usersCoreError.message}` };
  }

  const { data: existingFin } = await supabase.from("financial_profiles").select("*").eq("id", user.id).single();

  const liquidSavingsVal = data.liquid_savings !== undefined ? data.liquid_savings : (existingFin?.liquid_savings ?? 0);
  const investmentValueVal = data.investment_value !== undefined ? data.investment_value : (existingFin?.investment_value ?? 0);
  const emergencyFundCurrentVal = data.emergency_fund_current !== undefined ? data.emergency_fund_current : (existingFin?.emergency_fund_current ?? 0);

  const { error: finError } = await supabase.from("financial_profiles").upsert({
    id: user.id,
    monthly_income: data.monthly_income,
    fixed_expenses: data.fixed_expenses,
    total_debt: data.total_debt,
    debt_details: data.debt_details,
    liquid_savings: liquidSavingsVal,
    investment_value: investmentValueVal,
    emergency_fund_current: emergencyFundCurrentVal,
    current_stage: currentStage,
    emergency_fund_target: emergencyFundTarget,
    
    cashflow_story: data.cashflow_story || "",
    other_assets: data.other_assets || 0,
    savings_story: data.savings_story || "",
    has_debt: data.has_debt || false,
    debt_high_interest: data.debt_high_interest || 0,
    debt_productive: data.debt_productive || 0,
    debt_zero_interest: data.debt_zero_interest || 0,
    debt_story: data.debt_story || "",
    has_investments: data.has_investments || false,
    investment_instruments: data.investment_instruments || [],
    investment_story: data.investment_story || "",
    financial_priorities: data.financial_priorities || [],
    financial_goals_story: data.financial_goals_story || "",
    
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });

  if (finError) return { success: false, message: `Gagal menyimpan data keuangan: ${finError.message}` };

  revalidatePath("/dashboard");
  return { success: true, message: "Profil berhasil diperbarui! AI akan menyesuaikan saran untuk Anda." };
}

// 0a. Action: Update Sandbox (users_core)
export async function updateSandboxAction(data: {
  formal_status?: 'Mahasiswa' | 'Karyawan' | 'Pengusaha' | 'Freelancer' | 'Menganggur';
  primary_focus?: string;
  daily_free_hours?: number;
  financial_state_id?: 'Survival' | 'Stabilitas' | 'Pertumbuhan' | 'Kebebasan';
  country_code?: string;
  risk_profile?: 'konservatif' | 'moderat' | 'agresif';
  dependents_count?: number;
  is_sandwich_gen?: boolean;
  owned_assets?: string[];
  marital_status?: 'single' | 'married' | 'previously_married' | 'pacaran';
  major_life_goals?: string[];
  health_baseline?: 'fit' | 'physical_limitation' | 'burnout_alert';
  rent_by_choice?: boolean;
  ai_communication_style?: 'empatis_sabar' | 'tegas_disiplin' | 'logis_objektif';
  current_roadblock?: 'sulit_menabung' | 'arah_karir' | 'burnout_lelah' | 'kurang_disiplin';
  display_name?: string;
  birth_date?: string;
  gender?: 'Laki-laki' | 'Perempuan' | 'Memilih untuk tidak menjawab';
  domicile?: string;
  living_situation?: 'Tinggal Bersama Orang Tua/Keluarga' | 'Sewa/Ngekost Bulanan' | 'Sewa/Kontrak Tahunan' | 'Milik Sendiri (KPR)' | 'Milik Sendiri (Lunas)';
  has_physical_limitation?: boolean;
  physical_limitation_details?: string;
  work_devices?: string[];
  mobility_assets?: string[];
  life_goal?: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, message: "Sesi tidak ditemukan." };

  const { error } = await supabase
    .from("users_core")
    .upsert({
      id: user.id,
      ...data,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (error) return { success: false, message: `Gagal memperbarui sandbox: ${error.message}` };

  revalidatePath("/dashboard");
  return { success: true, message: "Sandbox parameter berhasil diperbarui." };
}

// 0b. Action: Update financial condition snapshot (balance sheet)
export async function updateFinancialConditionAction(data: {
  liquid_savings?: number;
  investment_value?: number;
  total_debt?: number;
  debt_details?: string;
  emergency_fund_current?: number;
}): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, message: "Sesi tidak ditemukan." };

  const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
  if (data.liquid_savings !== undefined) updatePayload.liquid_savings = data.liquid_savings;
  if (data.investment_value !== undefined) updatePayload.investment_value = data.investment_value;
  if (data.total_debt !== undefined) {
    updatePayload.total_debt = data.total_debt;
    updatePayload.current_stage = data.total_debt > 0 ? "DEBT" : "EMERGENCY_FUND";
  }
  if (data.debt_details !== undefined) updatePayload.debt_details = data.debt_details;
  if (data.emergency_fund_current !== undefined) updatePayload.emergency_fund_current = data.emergency_fund_current;

  const { error } = await supabase.from("financial_profiles").update(updatePayload).eq("id", user.id);
  if (error) return { success: false, message: `Gagal memperbarui: ${error.message}` };

  revalidatePath("/dashboard");
  return { success: true, message: "Kondisi finansial berhasil diperbarui." };
}

async function awardXp(userId: string, amount: number): Promise<{ leveledUp: boolean; newLevel: number; newXp: number }> {
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", userId)
    .single();

  if (!profile) return { leveledUp: false, newLevel: 1, newXp: 0 };

  let xp = Number(profile.xp) + amount;
  let level = Number(profile.level);
  let leveledUp = false;

  // Level Up requirement: level * 100 XP
  const xpNeeded = level * 100;
  if (xp >= xpNeeded) {
    xp = xp - xpNeeded;
    level += 1;
    leveledUp = true;
  }

  await supabase
    .from("profiles")
    .update({ xp, level })
    .eq("id", userId);

  return { leveledUp, newLevel: level, newXp: xp };
}

// 1. Action: Add new Transaction
export async function addTransactionAction(
  type: "INCOME" | "EXPENSE",
  category: string,
  amount: number,
  description: string
): Promise<ActionResponse<{ xpGained: number; leveledUp: boolean; newLevel: number }>> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "Sesi pengguna tidak ditemukan." };
  }

  // Insert transaction
  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type,
    category,
    amount,
    description,
    date: new Date().toISOString().split("T")[0],
  });

  if (error) {
    return { success: false, message: `Gagal mencatat transaksi: ${error.message}` };
  }

  if (type === "INCOME" && category.toLowerCase().includes("tabung")) {
    const { data: finProfile } = await supabase
      .from("financial_profiles")
      .select("emergency_fund_current")
      .eq("id", user.id)
      .single();
      
    if (finProfile) {
      const newCurrent = Number(finProfile.emergency_fund_current) + amount;
      await supabase
        .from("financial_profiles")
        .update({ emergency_fund_current: newCurrent })
        .eq("id", user.id);
    }
  }

  const xpReward = 15;
  const { leveledUp, newLevel } = await awardXp(user.id, xpReward);

  revalidatePath("/dashboard");
  return { 
    success: true, 
    message: `Transaksi berhasil dicatat! (+${xpReward} XP${leveledUp ? `, Level Up ke ${newLevel}!` : ""})`,
    data: { xpGained: xpReward, leveledUp, newLevel }
  };
}

// 1b. Action: Add new Financial Transaction (with double-entry balance updates)
export async function addFinancialTransactionAction(
  type: "INCOME" | "EXPENSE" | "ALLOCATION",
  category: "Gaji" | "Bisnis" | "Lainnya" | "Kebutuhan Wajib" | "Keinginan" | "Dana Darurat" | "Bayar Utang" | "Investasi",
  amount: number,
  description: string
): Promise<ActionResponse<{ xpGained: number; leveledUp: boolean; newLevel: number }>> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "Sesi pengguna tidak ditemukan." };
  }

  // 1. Catat ke tabel financial_transactions
  const { error: insertError } = await supabase.from("financial_transactions").insert({
    user_id: user.id,
    type,
    category,
    amount,
    description,
  });

  if (insertError) {
    return { success: false, message: `Gagal mencatat transaksi: ${insertError.message}` };
  }

  // 2. Ambil data keuangan profil saat ini
  const { data: finProfile, error: profileFetchError } = await supabase
    .from("financial_profiles")
    .select("liquid_savings, emergency_fund_current, total_debt, investment_value")
    .eq("id", user.id)
    .single();

  if (profileFetchError) {
    return { success: false, message: `Transaksi berhasil dicatat, namun gagal memperbarui saldo: ${profileFetchError.message}` };
  }

  let liquidSavings = Number(finProfile.liquid_savings) || 0;
  let emergencyFundCurrent = Number(finProfile.emergency_fund_current) || 0;
  let totalDebt = Number(finProfile.total_debt) || 0;
  let investmentValue = Number(finProfile.investment_value) || 0;

  // 3. Terapkan logika double-entry update
  if (type === "INCOME") {
    liquidSavings += amount;
  } else if (type === "EXPENSE") {
    liquidSavings -= amount;
  } else if (type === "ALLOCATION") {
    liquidSavings -= amount;
    if (category === "Dana Darurat") {
      emergencyFundCurrent += amount;
    } else if (category === "Bayar Utang") {
      totalDebt = Math.max(0, totalDebt - amount);
    } else if (category === "Investasi") {
      investmentValue += amount;
    }
  }

  // 4. Update data ke financial_profiles
  const currentStage = totalDebt > 0 ? "DEBT" : "EMERGENCY_FUND";
  const { error: updateError } = await supabase
    .from("financial_profiles")
    .update({
      liquid_savings: liquidSavings,
      emergency_fund_current: emergencyFundCurrent,
      total_debt: totalDebt,
      investment_value: investmentValue,
      current_stage: currentStage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return { success: false, message: `Transaksi berhasil dicatat, namun gagal memperbarui saldo profil: ${updateError.message}` };
  }

  // 5. Berikan XP reward
  const xpReward = 15;
  const { leveledUp, newLevel } = await awardXp(user.id, xpReward);

  revalidatePath("/dashboard");
  return { 
    success: true, 
    message: `Transaksi berhasil dicatat! (+${xpReward} XP${leveledUp ? `, Level Up ke ${newLevel}!` : ""})`,
    data: { xpGained: xpReward, leveledUp, newLevel }
  };
}

// 2. Action: Run Mirofish Decision Simulator
export async function simulateDecisionAction(
  title: string,
  description: string,
  horizonYears: number
): Promise<ActionResponse<DecisionProjectionResult>> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "Sesi pengguna tidak ditemukan." };
  }

  try {
    const result = await getDecisionProjection(title, description, horizonYears);
    
    // Save to database
    const { error } = await supabase.from("decision_projections").insert({
      user_id: user.id,
      title,
      description,
      horizon_years: horizonYears,
      projection_output: result,
    });

    if (error) {
      console.error("Gagal menyimpan proyeksi keputusan:", error.message);
    }

    await awardXp(user.id, 25);

    revalidatePath("/dashboard");
    return { success: true, message: "Simulasi berhasil dijalankan! (+25 XP)", data: result };
  } catch (err: any) {
    return { success: false, message: `Gagal mensimulasikan keputusan: ${err.message}` };
  }
}

// 3. Action: Send Message in Chat Discussion
export async function sendChatMessageAction(
  content: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>
): Promise<ActionResponse<{ reply: string }>> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "Sesi pengguna tidak ditemukan." };
  }

  // 1. Simpan pesan user
  await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content });

  try {
    // 2. EXTRACTION AGENT (Background Learning)
    // Di masa depan, ini bisa dipindah ke Edge Function / Queue untuk skalabilitas
    const extracted = await extractDataFromChat(content, chatHistory.map(c => `${c.role}: ${c.content}`));
    
    if (extracted.users_core) {
      await supabase.from("users_core").upsert({
        id: user.id,
        ...extracted.users_core,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });
    }
    
    // Simpan Ikigai Vectors & Insights ke AI Memory
    if (extracted.ikigai_vectors && extracted.ikigai_vectors.length > 0) {
      for (const vec of extracted.ikigai_vectors) {
        // Insert ke ai_memory untuk "Long-term Persistence"
        await supabase.from("ai_memory").insert({
          user_id: user.id,
          context: vec.category,
          insight: vec.content,
          confidence: 0.9 // Default high confidence for explicit statements
        });
      }
    }

    // 3. MENTOR AGENT (Generate Personalized Reply)
    // Ambil 5 memori terakhir/paling relevan untuk memperkaya konteks
    const { data: memories } = await supabase
      .from("ai_memory")
      .select("insight, context")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const memoryContext = memories?.map(m => `[Memory - ${m.context}]: ${m.insight}`).join("\n") || "";

    // 4. Fetch User Context & Framework
    const [profileRes, financeRes, usersCoreRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("financial_profiles").select("*").eq("id", user.id).single(),
      supabase.from("users_core").select("*").eq("id", user.id).single(),
    ]);

    // Generate recommendations via 9Router logic (Pluggable)
    // Di sini kita bisa menyisipkan 9Router API call di masa depan
    const aiRecs = await getAIRecommendations(
      { ...profileRes.data, background: profileRes.data?.background }, // Enrichment
      financeRes.data,
      { ...usersCoreRes.data, ai_memory: memories as any }
    );

    // (Simulasi balasan - Di produksi ini akan memanggil LLM Mentor)
    const reply = `Saya mengerti kondisi Anda. Berdasarkan riwayat kita, saya melihat Anda sedang fokus pada ${aiRecs.targetGoal}. ${aiRecs.advice}`;

    await supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: reply });
    await awardXp(user.id, 5);

    revalidatePath("/dashboard");
    return { success: true, message: "Pesan terkirim.", data: { reply } };
  } catch (err: any) {
    console.error("Chat Error:", err);
    return { success: false, message: "Gagal memproses pesan." };
  }
}



// 4. Action: Claim Goal/Milestone Reward & Upgrade Stage
export async function claimGoalRewardAction(badgeName: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "Sesi pengguna tidak ditemukan." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("badges")
    .eq("id", user.id)
    .single();

  const { data: finance } = await supabase
    .from("financial_profiles")
    .select("current_stage, total_debt, fixed_expenses")
    .eq("id", user.id)
    .single();

  if (!profile || !finance) {
    return { success: false, message: "Profil data tidak ditemukan." };
  }

  const currentBadges = profile.badges || [];
  if (currentBadges.includes(badgeName)) {
    return { success: false, message: "Lencana ini sudah diklaim sebelumnya." };
  }

  const updatedBadges = [...currentBadges, badgeName];

  const { error: profileUpdateErr } = await supabase
    .from("profiles")
    .update({ badges: updatedBadges })
    .eq("id", user.id);

  if (profileUpdateErr) {
    return { success: false, message: "Gagal memperbarui lencana profil." };
  }

  let nextStage = finance.current_stage;
  let updateParams: any = {};

  if (badgeName === "Pemberantas Hutang" && finance.current_stage === "DEBT") {
    nextStage = "EMERGENCY_FUND";
    updateParams = {
      total_debt: 0,
      current_stage: nextStage,
      emergency_fund_target: Number(finance.fixed_expenses) * 6,
      emergency_fund_current: 0
    };
  } else if (badgeName === "Penjaga Badai" && finance.current_stage === "EMERGENCY_FUND") {
    nextStage = "INVESTMENT";
    updateParams = {
      current_stage: nextStage
    };
  }

  if (Object.keys(updateParams).length > 0) {
    const { error: finUpdateErr } = await supabase
      .from("financial_profiles")
      .update(updateParams)
      .eq("id", user.id);

    if (finUpdateErr) {
      return { success: false, message: "Gagal memperbarui status finansial." };
    }
  }

  await awardXp(user.id, 150);

  revalidatePath("/dashboard");
  return { success: true, message: `Lencana "${badgeName}" berhasil didapatkan! +150 XP ditambahkan.` };
}

// 5. Action: Add new Productivity Task
export async function addTaskAction(title: string, dueDate: string, category: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "Sesi pengguna tidak ditemukan." };
  }

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title,
    due_date: dueDate || null,
    category: category || "Personal",
    completed: false,
  });

  if (error) {
    return { success: false, message: `Gagal menambahkan tugas: ${error.message}` };
  }

  revalidatePath("/dashboard");
  return { success: true, message: "Tugas berhasil ditambahkan." };
}

// 6. Action: Toggle Task completion status
export async function toggleTaskAction(taskId: string, currentCompleted: boolean): Promise<ActionResponse<{ xpGained: number }>> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "Sesi pengguna tidak ditemukan." };
  }

  const newCompleted = !currentCompleted;

  const { error } = await supabase
    .from("tasks")
    .update({ completed: newCompleted })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, message: `Gagal memperbarui tugas: ${error.message}` };
  }

  let xpAwarded = 0;
  // Award +10 XP ONLY if checking task as completed
  if (newCompleted) {
    xpAwarded = 10;
    await awardXp(user.id, xpAwarded);
  }

  revalidatePath("/dashboard");
  return { 
    success: true, 
    message: newCompleted ? `Tugas selesai! (+${xpAwarded} XP)` : "Tugas diaktifkan kembali.",
    data: { xpGained: xpAwarded }
  };
}

// 7. Action: Delete Task
export async function deleteTaskAction(taskId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "Sesi pengguna tidak ditemukan." };
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, message: `Gagal menghapus tugas: ${error.message}` };
  }

  revalidatePath("/dashboard");
  return { success: true, message: "Tugas berhasil dihapus." };
}
