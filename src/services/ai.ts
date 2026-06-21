// AI Mentor Service

import { callGemini } from "./ai-caller";
import { createClient } from "@/lib/supabase/server";
import { getCachedAI, setCachedAI, createCacheKey } from "./ai-cache";

export interface AIRecommendations {
  targetGoal: string;
  advice: string;
  sideHustles: Array<{
    title: string;
    description: string;
    difficulty: "Mudah" | "Sedang" | "Sulit";
    estimatedIncome: string;
    relevance: string;
    ikigaiMatch: number; // 0-100%
    ikigaiAnalysis: string;
  }>;
  dailyInsight: string;
  careerPath?: string; // Recommended career trajectory
  skillGaps?: string[]; // Skills user needs to develop
  quickWins?: Array<{ title: string; effort: "low" | "medium" | "high"; impact: "low" | "medium" | "high" }>;
}

export interface AIProfileInsight {
  understandingScore: number; // 0-100
  memoryCompleteness: number; // 0-100
  keyInsights: string[];
  recommendations: string[];
  confidenceLevel: 'low' | 'medium' | 'high';
}

export interface DecisionProjectionResult {
  verdict: "Sangat Direkomendasikan" | "Cukup Berisiko" | "Tidak Direkomendasikan";
  summary: string;
  growthChart: Array<{ year: string; value: number }>;
  pros: string[];
  cons: string[];
  riskFactor: number; // 1-100
}

/**
 * Generate dynamic personalized recommendations from the AI Mentor.
 * If GEMINI_API_KEY is present, it calls Gemini. otherwise, it falls back to a smart local generator.
 */
function calculateAge(birthDateString: string): number {
  if (!birthDateString) return 0;
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Preprocess raw text to escape unescaped newlines inside JSON string values.
 * Walks character by character, tracking string state and escape sequences.
 */
function escapeNewlinesInStrings(raw: string): string {
  let result = "";
  let inString = false;
  let escape = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (escape) {
      // Previous char was backslash — this char is escaped
      result += ch;
      escape = false;
      continue;
    }

    if (ch === "\\") {
      result += ch;
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString) {
      // Escape control characters inside strings
      if (ch === "\n" || ch === "\r") {
        result += "\\n";
        continue;
      }
      if (ch === "\t") {
        result += "\\t";
        continue;
      }
      if (ch === "\b") {
        result += "\\b";
        continue;
      }
      if (ch === "\f") {
        result += "\\f";
        continue;
      }
      // Escape other control characters (ASCII 0-31)
      const code = ch.charCodeAt(0);
      if (code < 32) {
        result += "\\u" + code.toString(16).padStart(4, "0");
        continue;
      }
    }

    result += ch;
  }

  return result;
}

/**
 * Repair truncated JSON by closing open strings and objects.
 * Handles cases where AI response is cut off mid-string.
 */
function repairTruncatedJSON(raw: string): string {
  let result = raw;
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  // First, close any open string
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
    }
    if (!inString) {
      if (ch === "{" || ch === "[") {
        stack.push(ch);
      } else if (ch === "}" || ch === "]") {
        stack.pop();
      }
    }
  }

  // Close open string if needed
  if (inString) {
    result += '"';
  }

  // Close open objects/arrays
  while (stack.length > 0) {
    const open = stack.pop()!;
    if (open === "{") {
      result += "}";
    } else if (open === "[") {
      result += "]";
    }
  }

  return result;
}

/**
 * Safely parse JSON from Gemini responses.
 * Gemini sometimes wraps JSON in markdown fences or includes extra text.
 * Also handles unescaped newlines inside string values.
 */
function safeParseJSON<T>(raw: string): T {
  let cleaned = raw.trim();

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "");

  // Strip any leading/trailing text, find the first '{' or '['
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let start = 0;
  if (firstBrace >= 0 && (firstBracket < 0 || firstBrace < firstBracket)) {
    start = firstBrace;
  } else if (firstBracket >= 0) {
    start = firstBracket;
  }
  if (start > 0) {
    cleaned = cleaned.substring(start);
  }

  // Find matching close bracket (tracks string state)
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) {
        cleaned = cleaned.substring(0, i + 1);
        break;
      }
    }
  }

  // Try parsing; if it fails, preprocess to escape unescaped control characters in strings
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.warn("[AI] Initial JSON parse failed, attempting repair:", (e as Error).message);
    try {
      const repaired = escapeNewlinesInStrings(cleaned);
      return JSON.parse(repaired) as T;
    } catch (e2) {
      console.warn("[AI] Control character repair failed, attempting truncated JSON repair:", (e2 as Error).message);
      try {
        const truncatedRepaired = repairTruncatedJSON(cleaned);
        return JSON.parse(truncatedRepaired) as T;
      } catch (e3) {
        console.error("[AI] All JSON repair attempts failed:", (e3 as Error).message);
        console.error("[AI] Raw JSON (first 500 chars):", cleaned.substring(0, 500));
        throw new Error(`Failed to parse AI response as JSON: ${(e3 as Error).message}`);
      }
    }
  }
}

export async function getAIRecommendations(
  profile: {
    full_name: string;
    skills: string[];
    experience: string;
    hobbies: string[];
    interests: string[];
    career_goal: string;
    background?: string;
    life_goal?: string;
    health_mental?: 'fit' | 'burnout_alert' | 'physical_limitation';
    communication_style?: 'empatis_sabar' | 'tegas_disiplin' | 'logis_objektif';
    time_availability?: number;
    financial_literacy_level?: 'pemula' | 'menengah' | 'ahli';
    income_type?: 'tetap' | 'tidak_tetap' | 'bisnis' | 'investasi' | 'campuran';
    location?: string;
    education?: string;
    ikigai_passion?: string[];
    ikigai_profession?: string[];
    ikigai_mission?: string[];
    ikigai_vocation?: string[];
    skills_assessment?: Record<string, number>;
    values_and_beliefs?: string[];
    current_challenges?: string[];
    support_system?: string[];
    learning_preference?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    motivation_triggers?: string[];
  },
  finance: {
    monthly_income: number;
    fixed_expenses: number;
    total_debt: number;
    current_stage: string;
    liquid_savings?: number;
    investment_value?: number;
    emergency_fund_current?: number;
  },
  usersCore?: {
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
    ai_memory?: Array<{ context: string; insight: string; confidence: number }>;
    learning_preference?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    motivation_triggers?: string[];
    display_name?: string;
    birth_date?: string;
    gender?: 'Laki-laki' | 'Perempuan' | 'Memilih untuk tidak menjawab';
    domicile?: string;
    living_situation?: 'Tinggal Bersama Orang Tua/Keluarga' | 'Sewa/Ngekost Bulanan' | 'Sewa/Kontrak Tahunan' | 'Milik Sendiri (KPR)' | 'Milik Sendiri (Lunas)';
    has_physical_limitation?: boolean;
    physical_limitation_details?: string;
    work_devices?: string[];
    device_brands?: Record<string, string>;
    mobility_assets?: string[];
    life_goal?: string;
  }
): Promise<AIRecommendations> {
  const currencySymbol = usersCore?.country_code === "SG" ? "S$" : usersCore?.country_code === "US" ? "$" : "Rp";

  // ── DB Cache Check (replaces useless in-memory Map that dies on Vercel cold starts) ──
  let userId: string | undefined;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch {}

  const cacheKey = createCacheKey({
    income: finance.monthly_income,
    expenses: finance.fixed_expenses,
    debt: finance.total_debt,
    stage: finance.current_stage,
    savings: finance.liquid_savings,
    skills: profile.skills,
    roadblock: usersCore?.current_roadblock,
    financialState: usersCore?.financial_state_id,
    health: usersCore?.health_baseline
  });

  if (userId) {
    const cached = await getCachedAI<AIRecommendations>(userId, cacheKey, "recommendations");
    if (cached) {
      console.log("[AI] Cache HIT: Serving recommendations from DB cache (0 tokens).");
      return cached;
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      // Build instructions based on rules
      let healthInstruction = "";
      if (usersCore?.has_physical_limitation) {
        healthInstruction = `\n⚠️ STATUS KESEHATAN/FISIK PENGGUNA: KETERBATASAN FISIK (${usersCore.physical_limitation_details || "tidak dijelaskan secara rinci"}). JANGAN menyarankan pekerjaan lapangan atau fisik yang mustahil dikerjakan. Arahkan murni ke tugas digital/manajerial yang sesuai dengan keterbatasan fisiknya.`;
      } else if (usersCore?.health_baseline === "physical_limitation") {
        healthInstruction = `\n⚠️ STATUS KESEHATAN PENGGUNA: KETERBATASAN FISIK. JANGAN menyarankan pekerjaan lapangan atau fisik. Rekomendasikan hanya pekerjaan digital/intelektual.`;
      }

      let assetInstruction = "";
      const workDevices = usersCore?.work_devices || [];
      const mobilityAssets = usersCore?.mobility_assets || [];
      
      assetInstruction += `\n- Perangkat kerja utama: ${workDevices.join(", ") || "Tidak ada perangkat kerja tercantum"}.`;
      // Include brand details if available
      const deviceBrands = usersCore?.device_brands || {};
      const brandEntries = Object.entries(deviceBrands).filter(([, v]) => v?.trim());
      if (brandEntries.length > 0) {
        assetInstruction += `\n- Detail merek/tipe perangkat: ${brandEntries.map(([k, v]) => `${k} = ${v}`).join("; ")}. Gunakan informasi merek ini untuk menilai kemampuan spesifikasi perangkat secara lebih akurat.`;
      }
      assetInstruction += `\n- Aset mobilitas: ${mobilityAssets.join(", ") || "Tidak ada aset mobilitas tercantum"}.`;
      
      if (workDevices.length > 0) {
        const hasHighPerfPC = workDevices.some(d => d.toLowerCase().includes("performa tinggi"));
        const hasPC = workDevices.some(d => d.toLowerCase().includes("laptop/pc"));
        if (!hasHighPerfPC) {
          assetInstruction += `\n- Pengguna TIDAK MEMILIKI Laptop/PC Performa Tinggi. Jangan menyarankan pekerjaan coding berat, desain 3D, game development, atau video editing resolusi tinggi.`;
        }
        if (!hasPC) {
          assetInstruction += `\n- Pengguna TIDAK MEMILIKI Laptop/PC Standar. Jangan menyarankan pekerjaan programming, administrasi perkantoran rumit, atau entry data massal yang butuh komputer.`;
        }
      } else {
        assetInstruction += `\n- Pengguna tidak memiliki PC/Laptop. Hanya sarankan pekerjaan yang dapat dijalankan lewat Smartphone.`;
      }
      
      if (mobilityAssets.length > 0) {
        const hasMotor = mobilityAssets.some(a => a.toLowerCase().includes("motor"));
        if (!hasMotor) {
          assetInstruction += `\n- Pengguna TIDAK MEMILIKI Motor Pribadi. Jangan menyarankan pekerjaan kurir motor, ojek online, atau kanvasing fisik keliling kota.`;
        }
      } else {
        assetInstruction += `\n- Pengguna tidak memiliki kendaraan pribadi. Jangan sarankan pekerjaan kurir atau ojek online.`;
      }

      let livingSituationInstruction = "";
      if (usersCore?.living_situation) {
        livingSituationInstruction = `\n🏠 STATUS TEMPAT TINGGAL: ${usersCore.living_situation}.`;
        if (usersCore.living_situation.includes("Sewa") && usersCore.financial_state_id === "Survival") {
          livingSituationInstruction += ` Peringatan: Pengguna menyewa tempat tinggal bulanan/tahunan dan sedang dalam mode Survival. Ini adalah situasi kritis. AI wajib membunyikan alarm "Mode Survival" level tertinggi dan fokus mengamankan kas sewa agar tidak terusir.`;
        }
      }

      let domicileInstruction = "";
      if (usersCore?.domicile) {
        domicileInstruction = `\n📍 DOMISILI: ${usersCore.domicile}. Sesuaikan strategi bisnis atau side hustle dengan standar hidup dan peluang di domisili tersebut.`;
      }

      let crisisInstruction = "";
      if (usersCore?.financial_state_id === "Survival") {
        crisisInstruction = `\n🚨 MODE KRISIS (SURVIVAL): Bertindaklah sebagai Manajer Krisis. Berikan saran taktis untuk mengamankan kebutuhan primer dasar (makanan, sewa) secara mendesak. Jangan sarankan investasi/pertumbuhan jangka panjang; amankan cashflow jangka pendek dulu.`;
      }

      // AI Communication Style instruction
      let communicationStyleInstruction = "";
      if (usersCore?.ai_communication_style === "empatis_sabar") {
        communicationStyleInstruction = `\n💬 GAYA KOMUNIKASI AI: Empatis & Penyabar. Gunakan nama panggilan '${usersCore?.display_name || profile.full_name}' untuk menyapa pengguna. Gunakan nada bicara yang ramah, hangat, penuh empati, memvalidasi perasaan pengguna, dan berikan kata-kata penyemangat hangat.`;
      } else if (usersCore?.ai_communication_style === "tegas_disiplin") {
        communicationStyleInstruction = `\n💬 GAYA KOMUNIKASI AI: Tegas & Disiplin. Gunakan nama panggilan '${usersCore?.display_name || profile.full_name}' untuk menyapa pengguna. Gunakan nada bicara yang lugas, langsung ke sasaran (to-the-point), tegas, fokus pada kedisiplinan dan akuntabilitas tindakan nyata, tanpa basa-basi berlebih.`;
      } else if (usersCore?.ai_communication_style === "logis_objektif") {
        communicationStyleInstruction = `\n💬 GAYA KOMUNIKASI AI: Logis & Objektif. Gunakan nama panggilan '${usersCore?.display_name || profile.full_name}' untuk menyapa pengguna. Gunakan nada bicara yang rasional, objektif, analitis, menyajikan fakta dan data secara terstruktur, serta menghindari kalimat emosional yang berlebihan.`;
      }

      // Roadblock instruction
      let roadblockInstruction = "";
      if (usersCore?.current_roadblock === "sulit_menabung") {
        roadblockInstruction = `\n⚠️ HAMBATAN UTAMA: Sulit Menabung. Selipkan saran praktis tentang pelacakan pengeluaran kecil (leakage), teknik budgeting otomatis di awal bulan, dan pemisahan rekening tabungan.`;
      } else if (usersCore?.current_roadblock === "arah_karir") {
        roadblockInstruction = `\n⚠️ HAMBATAN UTAMA: Bingung Arah Karir. Selipkan saran eksplorasi diri berbasis Ikigai, identifikasi skill gap, riset demand pasar, dan cara membangun portfolio.`;
      } else if (usersCore?.current_roadblock === "kurang_disiplin") {
        roadblockInstruction = `\n⚠️ HAMBATAN UTAMA: Kurang Disiplin. Sajikan tugas atau action plan dalam bentuk langkah-langkah mikro (micro-steps) yang sangat mudah dimulai (kurang dari 10 menit) untuk membangun momentum.`;
      }

      const userAge = usersCore?.birth_date ? calculateAge(usersCore.birth_date) : 0;
      const currentLifeGoal = usersCore?.life_goal || profile.life_goal;
      const greetingName = usersCore?.display_name || profile.full_name || "Mentee";

      const prompt = `
        Anda adalah Mentlife AI, seorang mentor keuangan dan karir pribadi profesional berlandaskan filosofi IKIGAI.
        
        Analisis profil pengguna berikut:
        Nama Sapaan (Nama Panggilan): ${greetingName}
        Nama Lengkap: ${profile.full_name}
        Usia: ${userAge > 0 ? `${userAge} tahun` : "Tidak ditentukan"}
        Domisili: ${usersCore?.domicile || "Tidak ditentukan"}
        Latar Belakang: ${profile.background || "Tidak ada informasi"}
        Tujuan Hidup Terbesar (Life Goal / North Star): ${currentLifeGoal || "Tidak ada informasi"}
        Keahlian (Apa yang dikuasai): ${profile.skills.join(", ")}
        Pengalaman: ${profile.experience}
        Hobi (Apa yang dicintai): ${profile.hobbies.join(", ")}
        Minat (Apa yang dibutuhkan dunia): ${profile.interests.join(", ")}
        Tujuan Karir: ${profile.career_goal}
        
        Ikigai Vectors:
        - Passion: ${profile.ikigai_passion?.join(", ") || "Belum diisi"}
        - Profession: ${profile.ikigai_profession?.join(", ") || "Belum diisi"}
        - Mission: ${profile.ikigai_mission?.join(", ") || "Belum diisi"}
        - Vocation: ${profile.ikigai_vocation?.join(", ") || "Belum diisi"}
        
        Kondisi Keuangan:
        Pendapatan Bulanan: ${currencySymbol}${finance.monthly_income}
        Pengeluaran Tetap: ${currencySymbol}${finance.fixed_expenses}
        Total Hutang: ${currencySymbol}${finance.total_debt}
        Dana Darurat: ${currencySymbol}${finance.emergency_fund_current || 0}
        Simpanan Liquid: ${currencySymbol}${finance.liquid_savings || 0}
        Investasi: ${currencySymbol}${finance.investment_value || 0}
        Tahapan Finansial Saat Ini: ${finance.current_stage}

        Konteks Tambahan Pengguna:
        Status Formal: ${usersCore?.formal_status || "Belum ditentukan"}
        Fokus Utama: ${usersCore?.primary_focus || "Belum ditentukan"}
        Waktu Luang Harian: ${usersCore?.daily_free_hours || 0} jam
        Keadaan Finansial: ${usersCore?.financial_state_id || "Stabilitas"}
        Kode Negara: ${usersCore?.country_code || "ID"}
        Kesehatan Baseline: ${usersCore?.health_baseline || "fit"}
        Sandwich Generation: ${usersCore?.is_sandwich_gen ? "Ya" : "Tidak"}
        Jumlah Tanggungan: ${usersCore?.dependents_count || 0} orang
        Status Pernikahan: ${usersCore?.marital_status || "single"}
        Gaya Komunikasi AI Pilihan: ${usersCore?.ai_communication_style || "empatis_sabar"}
        Hambatan Terbesar Saat Ini: ${usersCore?.current_roadblock || "sulit_menabung"}
        ${healthInstruction}${assetInstruction}${livingSituationInstruction}${domicileInstruction}${crisisInstruction}${communicationStyleInstruction}${roadblockInstruction}
        
        AI Memory Insights (dari riwayat chat):
        ${usersCore?.ai_memory?.map(m => `- [${m.context}] ${m.insight} (confidence: ${m.confidence}%)`).join("\n") || "Belum ada insight tersimpan"}
        
        ${profile.motivation_triggers ? `Motivasi User: ${profile.motivation_triggers.join(", ")}` : ''}
        ${profile.learning_preference ? `Gaya Belajar: ${profile.learning_preference}` : ''}
        ${profile.current_challenges ? `Tantangan Saat Ini: ${profile.current_challenges.join(", ")}` : ''}
        ${profile.support_system ? `Dukungan: ${profile.support_system.join(", ")}` : ''}
  
        Berikan respon JSON murni dengan skema berikut (tanpa markdown backticks):
        {
          "targetGoal": "Satu target konkret dan realistis dalam 1-3 bulan ke depan sesuai tangga keuangan",
          "advice": "Saran mentor komprehensif maksimal 3 kalimat terkait pengelolaan dana sesuai tahapan mereka saat ini",
          "sideHustles": [
            {
              "title": "Judul pekerjaan sampingan/utama yang realistis sesuai keahlian/hobi",
              "description": "Deskripsi singkat cara memulainya",
              "difficulty": "Mudah" / "Sedang" / "Sulit",
              "estimatedIncome": "Estimasi pendapatan tambahan per bulan (misal: ${currencySymbol}1.000.000)",
              "relevance": "Penjelasan mengapa ini cocok berdasarkan keahlian atau hobi mereka",
              "ikigaiMatch": 85,
              "ikigaiAnalysis": "Deskripsi singkat irisan Ikigai"
            }
          ] (berikan 2 rekomendasi),
          "dailyInsight": "Satu motivasi/tips keuangan harian singkat khusus hari ini (maksimal 15 kata)",
          "careerPath": "Jalur karir yang direkomendasikan berdasarkan Ikigai dan kondisi saat ini",
          "skillGaps": ["Skill yang perlu dikembangkan untuk mencapai tujuan"],
          "quickWins": [
            {
              "title": "Aksi cepat yang berdampak",
              "effort": "low" / "medium" / "high",
              "impact": "low" / "medium" / "high"
            }
          ] (berikan 2-3 quick wins)
        }
      `;
 
      const result = await callGemini({
        prompt,
        responseFormat: "json",
        maxTokens: 2048,  // 2.5-flash is a thinking model, needs room for reasoning + JSON
      }, { userId, callType: "recommendations" });

      const parsed = safeParseJSON<AIRecommendations>(result.text);

      // Save to DB cache before returning
      if (userId) {
        await setCachedAI(userId, cacheKey, "recommendations", parsed);
      }
      return parsed;
    } catch (e) {
      console.error("Gemini API call failed, using fallback generator:", e);
    }
  }
 
  return getFallbackRecommendations(profile, finance, usersCore, currencySymbol);
}

function getFallbackRecommendations(
  profile: any,
  finance: any,
  usersCore: any,
  currencySymbol: string
): AIRecommendations {
  // Smart Fallback Generator (Ikigai Oriented + Constraints Aware)
  const skillsStr = profile.skills?.slice(0, 2).join(" & ") || "Analisis";
  const hobbiesStr = profile.hobbies.slice(0, 2).join(" & ") || "Harian";
  const interest = profile.interests[0] || "pengembangan diri";
  const hasLaptop = usersCore?.owned_assets?.includes("laptop") ?? true;
  const hasMotor = usersCore?.owned_assets?.includes("motor") ?? true;
 
  let targetGoal = "";
  let advice = "";
  let sideHustles: AIRecommendations["sideHustles"] = [];
  let dailyInsight = "";
 
  if (usersCore?.financial_state_id === "Survival") {
    targetGoal = `Amankan Kebutuhan Dasar (Survival Mode)`;
    advice = `Anda berada dalam taraf bertahan hidup (Mode Survival). Prioritaskan untuk menekan semua pengeluaran sekunder, amankan makan dan tempat tinggal terlebih dahulu.`;
    dailyInsight = "Fokus amankan cashflow minggu ini terlebih dahulu. Tunda semua pengeluaran tidak mendesak.";
    
    sideHustles = [
      {
        title: `Pekerjaan Sampingan Taktis`,
        description: `Tawarkan jasa bantuan harian atau maksimalkan aset/koneksi terdekat untuk mendatangkan uang tunai cepat.`,
        difficulty: "Mudah",
        estimatedIncome: `${currencySymbol}500.000 - ${currencySymbol}1.500.000`,
        relevance: `Cocok untuk kebutuhan dana darurat jangka pendek yang mendesak.`,
        ikigaiMatch: 70,
        ikigaiAnalysis: `Fokus murni pada irisan penghasilan instan (Paid For) untuk mengatasi krisis saat ini.`
      },
      {
        title: `Pangkas Pengeluaran Radikal`,
        description: `Lakukan audit seluruh pengeluaran untuk menekan bocornya kas bulanan Anda secara agresif.`,
        difficulty: "Mudah",
        estimatedIncome: `${currencySymbol}200.000 - ${currencySymbol}600.000`,
        relevance: `Bermanfaat untuk mengurangi defisit arus kas.`,
        ikigaiMatch: 80,
        ikigaiAnalysis: `Mengamankan sisa kas bernilai sama pentingnya dengan menambah pemasukan.`
      }
    ];
  } else if (finance.current_stage === "DEBT") {
    targetGoal = `Melunasi Hutang ${currencySymbol}${finance.total_debt.toLocaleString()}`;
    advice = `Fokus utama Anda saat ini adalah melunasi hutang. Batasi pengeluaran non-esensial dan gunakan keahlian Anda di bidang ${skillsStr} untuk mendapatkan penghasilan tambahan.`;
    dailyInsight = "Setiap rupiah yang dihemat dari pengeluaran kecil hari ini mempercepat pelunasan hutang Anda.";
    
    const title1 = hasLaptop ? `Jasa Freelance ${profile.skills[0] || "Umum"}` : `Asisten / Konsultan Online`;
    const desc1 = hasLaptop 
      ? `Buka layanan jasa freelance memanfaatkan keahlian ${profile.skills[0] || "analisis"} Anda di platform lokal/internasional.`
      : `Gunakan smartphone untuk membantu koordinasi bisnis, administrasi, atau riset mini.`;
 
    sideHustles = [
      {
        title: title1,
        description: desc1,
        difficulty: "Sedang",
        estimatedIncome: `${currencySymbol}1.500.000 - ${currencySymbol}3.500.000`,
        relevance: `Cocok karena Anda memiliki keahlian dalam ${profile.skills.join(", ") || "komunikasi"}.`,
        ikigaiMatch: 80,
        ikigaiAnalysis: `Mengawinkan keahlian profesional Anda dengan kebutuhan pasar yang membutuhkan eksekusi cepat.`
      },
      {
        title: `Kreator Konten seputar ${profile.hobbies[0] || "Harian"}`,
        description: `Mulailah berbagi tips, tutorial, atau hobi ${profile.hobbies[0] || "kreatif"} Anda di media sosial untuk monetisasi.`,
        difficulty: "Mudah",
        estimatedIncome: `${currencySymbol}500.000 - ${currencySymbol}2.000.000`,
        relevance: `Sangat relevan dengan kegemaran Anda dalam ${hobbiesStr}.`,
        ikigaiMatch: 90,
        ikigaiAnalysis: `Irisan sempurna dari apa yang Anda cintai dengan apa yang sedang dibutuhkan audiens internet.`
      }
    ];
  } else if (finance.current_stage === "EMERGENCY_FUND") {
    const targetVal = finance.fixed_expenses * 6;
    targetGoal = `Kumpulkan Dana Darurat ${currencySymbol}${targetVal.toLocaleString()}`;
    advice = `Hutang Anda sudah lunas! Sekarang saatnya menyisihkan sisa pendapatan bersih untuk membangun dana cadangan sebesar 6 kali pengeluaran tetap bulanan Anda.`;
    dailyInsight = "Dana darurat bukanlah tentang imbal hasil, melainkan tentang ketenangan pikiran dan perlindungan.";
    
    sideHustles = [
      {
        title: `Konsultan Online ${profile.skills[0] || "Bisnis"}`,
        description: `Tawarkan sesi konsultasi online privat berbayar per jam tentang bidang ${interest} Anda.`,
        difficulty: "Sedang",
        estimatedIncome: `${currencySymbol}2.000.000 - ${currencySymbol}5.000.000`,
        relevance: `Memanfaatkan pemahaman mendalam Anda di bidang ${interest}.`,
        ikigaiMatch: 85,
        ikigaiAnalysis: `Memadukan keahlian dengan kebutuhan pasar konsultasi bernilai tinggi.`
      },
      {
        title: `Jual Produk Digital terkait ${profile.hobbies[0] || "Desain"}`,
        description: `Buat template e-book, panduan, atau aset digital berdasarkan hobi Anda dan jual secara online.`,
        difficulty: "Mudah",
        estimatedIncome: `${currencySymbol}1.000.000 - ${currencySymbol}3.000.000`,
        relevance: `Menyalurkan hobi ${hobbiesStr} menjadi aset produktif.`,
        ikigaiMatch: 88,
        ikigaiAnalysis: `Hobi yang dikemas menjadi produk digital sekali-buat (passive income) yang memiliki daya jual tinggi.`
      }
    ];
  } else {
    targetGoal = "Mulai Berinvestasi Secara Konsisten";
    advice = `Selamat! Anda berada di fase kemakmuran. Mulailah mengalokasikan minimal 10-20% dari pendapatan Anda ke instrumen investasi berisiko rendah hingga menengah secara disiplin.`;
    dailyInsight = "Bukan seberapa besar nominalnya, melainkan seberapa konsisten Anda melatih otot investasi Anda.";
    
    sideHustles = [
      {
        title: `E-Commerce / Reseller Produk ${interest}`,
        description: `Mulai bisnis e-commerce dengan sistem dropship atau reseller produk yang diminati di ceruk pasar ${interest}.`,
        difficulty: "Sedang",
        estimatedIncome: `${currencySymbol}3.000.000 - ${currencySymbol}10.000.000`,
        relevance: `Tingkat minat Anda yang tinggi di bidang ${interest} mempermudah pemasaran.`,
        ikigaiMatch: 75,
        ikigaiAnalysis: `Menghubungkan ketertarikan Anda pada ${interest} dengan peluang komersial retail.`
      },
      {
        title: `Mengajar Kelas Workshop Mini`,
        description: `Buat program kelas belajar daring berdurasi 2 jam untuk mengajarkan ${profile.skills[0] || "keahlian khusus"} Anda.`,
        difficulty: "Sulit",
        estimatedIncome: `${currencySymbol}4.000.000 - ${currencySymbol}8.000.000`,
        relevance: `Sesuai dengan track record pengalaman Anda yang mumpuni di bidang tersebut.`,
        ikigaiMatch: 92,
        ikigaiAnalysis: `Irisan tertinggi Ikigai: Membagikan apa yang Anda kuasai kepada orang yang membutuhkannya dan bersedia membayar lisensinya.`
      }
    ];
  }

  return { 
    targetGoal, 
    advice, 
    sideHustles, 
    dailyInsight,
    careerPath: usersCore?.formal_status === "Mahasiswa" 
      ? "Karir Akademik / Peneliti / Konsultan" 
      : usersCore?.formal_status === "Karyawan"
        ? "Manajemen / Leadership Track" 
        : "Bisnis / Entrepreneurship",
    skillGaps: profile.skills.length < 3 
      ? ["Komunikasi", "Manajemen Waktu", "Digital Literacy"] 
      : [],
    quickWins: [
      { title: "Catat semua transaksi hari ini", effort: "low", impact: "medium" },
      { title: "Review 1 skill yang bisa dikembangkan", effort: "low", impact: "high" }
    ]
  };
}

/**
 * Mirofish simulator helper to project difficult decisions
 */
export async function getDecisionProjection(
  decisionTitle: string,
  description: string,
  horizonYears: number
): Promise<DecisionProjectionResult> {
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `
        Anda adalah Mentlife AI, simulator keputusan karir dan keuangan profesional ("Mirofish").
        Analisis keputusan berikut:
        Judul Keputusan: ${decisionTitle}
        Deskripsi/Detail: ${description}
        Horizon Waktu: ${horizonYears} tahun

        Berikan respon JSON murni dengan skema berikut (tanpa markdown backticks):
        {
          "verdict": "Sangat Direkomendasikan" / "Cukup Berisiko" / "Tidak Direkomendasikan",
          "summary": "Analisis ringkas dan kritis mengenai keputusan ini dalam 2-3 kalimat",
          "growthChart": [
            {"year": "Tahun 1", "value": 30},
            {"year": "Tahun 2", "value": 50},
            {"year": "Tahun 3", "value": 65},
            {"year": "Tahun 4", "value": 80},
            {"year": "Tahun 5", "value": 95}
          ] (berikan deret angka fiktif potensi pertumbuhan nilai/peluang dari keputusan ini skala 0-100),
          "pros": ["Keuntungan 1", "Keuntungan 2", "Keuntungan 3"],
          "cons": ["Kekhawatiran 1", "Kekhawatiran 2", "Kekhawatiran 3"],
          "riskFactor": 65 (skala risiko angka 1-100)
        }
      `;

      const result = await callGemini({
        prompt,
        responseFormat: "json",
        maxTokens: 1536,  // thinking model overhead
      }, { callType: "decision_projection" });

      return safeParseJSON<DecisionProjectionResult>(result.text);
    } catch (e) {
      console.error("Gemini decision simulation failed, using fallback:", e);
    }
  }

  // Fallback decision simulation logic
  const isBusiness = decisionTitle.toLowerCase().includes("bisnis") || decisionTitle.toLowerCase().includes("usaha");
  const isJobChange = decisionTitle.toLowerCase().includes("kerja") || decisionTitle.toLowerCase().includes("resign");

  let verdict: DecisionProjectionResult["verdict"] = "Cukup Berisiko";
  let summary = `Keputusan untuk "${decisionTitle}" memerlukan alokasi waktu dan kesiapan mental yang matang. Dalam rentang waktu ${horizonYears} tahun, langkah ini bisa menjadi pivot yang menguntungkan jika diiringi manajemen risiko yang baik.`;
  let pros = ["Membuka peluang penghasilan mandiri baru", "Mengembangkan keterampilan manajerial", "Meningkatkan kepemilikan aset personal"];
  let cons = ["Memerlukan modal awal yang berisiko hilang", "Tekanan stres tinggi di 1-2 tahun pertama", "Mengurangi waktu luang harian"];
  let riskFactor = 70;

  if (isJobChange) {
    verdict = "Sangat Direkomendasikan";
    summary = `Beralih peran pekerjaan atau pindah karir berpotensi meningkatkan pertumbuhan finansial Anda secara signifikan dalam jangka pendek hingga menengah.`;
    pros = ["Kenaikan gaji/pendapatan tetap", "Lingkungan kerja dan koneksi baru", "Akselerasi keahlian baru"];
    cons = ["Masa percobaan/probation yang berisiko", "Harus beradaptasi kembali dengan kultur tim", "Kurva pembelajaran ulang yang curam"];
    riskFactor = 45;
  } else if (isBusiness) {
    verdict = "Cukup Berisiko";
    riskFactor = 75;
  }

  const growthChart = Array.from({ length: horizonYears }, (_, i) => ({
    year: `Tahun ${i + 1}`,
    value: Math.round(30 + (i * (70 / (horizonYears - 1 || 1))) + (Math.random() * 10 - 5)),
  }));

  return { verdict, summary, growthChart, pros, cons, riskFactor };
}

export interface ChatExtractionResult {
  users_core?: {
    formal_status?: 'Mahasiswa' | 'Karyawan' | 'Pengusaha' | 'Freelancer' | 'Menganggur';
    primary_focus?: string;
    daily_free_hours?: number;
    risk_profile?: 'konservatif' | 'moderat' | 'agresif';
    dependents_count?: number;
    is_sandwich_gen?: boolean;
    marital_status?: 'single' | 'married' | 'previously_married' | 'pacaran';
    owned_assets?: string[];
    country_code?: string;
    health_baseline?: 'fit' | 'physical_limitation' | 'burnout_alert';
    major_life_goals?: string[];
  };
  financial_ledger?: {
    amount: number;
    transaction_type: 'income' | 'expense';
    category: 'kebutuhan_dasar' | 'sewa' | 'variabel' | 'investasi' | 'cicilan_hutang';
    is_recurring: boolean;
    debt_type: 'high_interest_toxic' | 'bank_standard' | 'family_zero_interest' | 'none';
    description?: string;
  };
  ikigai_vectors?: Array<{
    content: string;
    category: 'passion' | 'skill' | 'market_demand' | 'life_goal' | 'social_capital';
  }>;
}

export async function extractDataFromChat(
  content: string,
  chatHistory: string[]
): Promise<ChatExtractionResult> {
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `
        Anda adalah AI Data Extractor untuk aplikasi MentLife. Tugas Anda adalah menganalisis pesan percakapan terakhir pengguna dan mengekstrak informasi terstruktur jika pengguna menceritakan atau memperbarui kondisi demografi, aset, keuangan, hobi, keahlian, atau tujuan hidup mereka.
        
        Masing-masing entitas yang bisa Anda ekstrak adalah:
        1. "users_core": Info profil (formal_status, primary_focus, daily_free_hours, risk_profile, dependents_count, is_sandwich_gen, marital_status, owned_assets, country_code, health_baseline, major_life_goals).
           - formal_status harus salah satu dari: 'Mahasiswa', 'Karyawan', 'Pengusaha', 'Freelancer', 'Menganggur'.
           - risk_profile harus salah satu dari: 'konservatif', 'moderat', 'agresif'.
           - marital_status harus salah satu dari: 'single', 'married', 'previously_married', 'pacaran'.
           - health_baseline harus salah satu dari: 'fit' atau 'physical_limitation' (deteksi 'physical_limitation' hanya jika cedera/sakit fisik eksplisit).
           - country_code harus berupa kode ISO Alpha-2 2-karakter (misal: 'ID', 'SG', 'US').
        2. "financial_ledger": Jika pengguna menyebutkan transaksi baru (income/expense) yang baru terjadi atau sedang berjalan. Kategori harus salah satu dari: 'kebutuhan_dasar', 'sewa', 'variabel', 'investasi', 'cicilan_hutang'. Tipe hutang (debt_type) jika relevan: 'high_interest_toxic', 'bank_standard', 'family_zero_interest', 'none'.
        3. "ikigai_vectors": Pernyataan tentang passion (hobi/suka), skill (keahlian), market_demand, life_goal, atau social_capital (koneksi/modal sosial).
        
        Pesan Pengguna: "${content}"
        Riwayat Singkat Percakapan:
        ${chatHistory.join("\n")}
        
        Kembalikan respon JSON murni dengan skema berikut (tanpa markdown backticks):
        {
          "users_core": { ... } // opsional, hanya jika ada info yang berubah atau terdeteksi baru
          "financial_ledger": { ... } // opsional, hanya jika menyebutkan transaksi baru
          "ikigai_vectors": [ ... ] // opsional, array objek { "content": string, "category": string }
        }
        
        Aturan penting:
        - Jangan mengarang data. Hanya ekstrak jika secara eksplisit atau sangat kuat diimplikasikan oleh pesan pengguna.
        - Untuk "users_core.country_code", gunakan standar ISO Alpha-2 (ID/SG/US) jika disebutkan secara eksplisit.
        - Untuk "users_core.owned_assets", kumpulkan aset seperti motor, laptop, mobil, rumah, dll.
        - "users_core.health_baseline" hanya diekstrak jika user menyebut cedera/sakit fisik eksplisit → 'physical_limitation', selain itu default 'fit'.
      `;

      const result = await callGemini({
        prompt,
        responseFormat: "json",
        maxTokens: 256,
        model: "lite",  // Simple extraction = economy model (higher free-tier quota)
      }, { callType: "data_extraction" });

      return safeParseJSON<ChatExtractionResult>(result.text);
    } catch (e) {
      console.error("Gemini data extraction failed, using fallback:", e);
    }
  }

  // Fallback regex-based extraction
  const lower = content.toLowerCase();
  const result: ChatExtractionResult = {};
  
  // 1. Detect formal_status
  let formal_status: any;
  if (lower.includes("mahasiswa") || lower.includes("kuliah") || lower.includes("kampus")) formal_status = "Mahasiswa";
  else if (lower.includes("karyawan") || lower.includes("bekerja") || lower.includes("kantor") || lower.includes("pns")) formal_status = "Karyawan";
  else if (lower.includes("bisnis") || lower.includes("pengusaha") || lower.includes("wirausaha") || lower.includes("toko") || lower.includes("startup")) formal_status = "Pengusaha";
  else if (lower.includes("freelance") || lower.includes("lepas") || lower.includes("proyekan") || lower.includes("sambilan")) formal_status = "Freelancer";
  else if (lower.includes("menganggur") || lower.includes("nganggur") || lower.includes("phk") || lower.includes("tidak bekerja")) formal_status = "Menganggur";

  // 2. Detect health_baseline
  let health_baseline: any;
  if (lower.includes("cedera") || lower.includes("sakit") || lower.includes("lumpuh") || lower.includes("fisik terganggu") || lower.includes("difabel")) health_baseline = "physical_limitation";
  else if (lower.includes("bugar") || lower.includes("sehat") || lower.includes("fit")) health_baseline = "fit";

  // 3. Detect marital_status
  let marital_status: any;
  if (lower.includes("menikah") || lower.includes("istri") || lower.includes("suami") || lower.includes("keluarga")) {
    marital_status = "married";
  } else if (lower.includes("pacar") || lower.includes("pacaran") || lower.includes("hubungan") || lower.includes("dating") || lower.includes("pasangan")) {
    marital_status = "pacaran";
  } else if (lower.includes("cerai") || lower.includes("janda") || lower.includes("duda")) {
    marital_status = "previously_married";
  } else if (lower.includes("single") || lower.includes("lajang") || lower.includes("belum nikah")) {
    marital_status = "single";
  }

  // 4. Detect sandwich generation
  let is_sandwich_gen: boolean | undefined;
  if (lower.includes("sandwich gen") || lower.includes("tanggung ortu") || lower.includes("biayain orang tua") || lower.includes("menanggung orang tua") || lower.includes("kirim uang bulanan ke ortu")) {
    is_sandwich_gen = true;
  }

  // 5. Detect owned assets
  const owned_assets: string[] = [];
  if (lower.includes("motor") || lower.includes("sepeda motor")) owned_assets.push("motor");
  if (lower.includes("mobil") || lower.includes("kendaraan roda empat")) owned_assets.push("mobil");
  if (lower.includes("laptop") || lower.includes("komputer") || lower.includes("pc")) owned_assets.push("laptop");
  if (lower.includes("rumah") || lower.includes("apartemen")) owned_assets.push("rumah");

  // 6. Detect country_code
  let country_code: string | undefined;
  if (lower.includes("singapura") || lower.includes("singapore") || lower.includes(" sg ")) country_code = "SG";
  else if (lower.includes("amerika") || lower.includes("amerika serikat") || lower.includes(" us ") || lower.includes("usa")) country_code = "US";
  else if (lower.includes("indonesia") || lower.includes(" id ")) country_code = "ID";

  if (formal_status || health_baseline || marital_status || is_sandwich_gen !== undefined || owned_assets.length > 0 || country_code) {
    result.users_core = {};
    if (formal_status) result.users_core.formal_status = formal_status;
    if (health_baseline) result.users_core.health_baseline = health_baseline;
    if (marital_status) result.users_core.marital_status = marital_status;
    if (is_sandwich_gen !== undefined) result.users_core.is_sandwich_gen = is_sandwich_gen;
    if (owned_assets.length > 0) result.users_core.owned_assets = owned_assets;
    if (country_code) result.users_core.country_code = country_code;
  }

  // 7. Detect financial transaction (e.g. "pemasukan 5 juta", "beli makan 50 ribu")
  const numMatches = content.match(/\d+[\d\.,]*/g);
  if (numMatches && numMatches.length > 0) {
    let amount = parseFloat(numMatches[0].replace(/[\.,]/g, ""));
    // Normalize if short scale (e.g., "50k" -> 50000)
    if (lower.includes("k") && content.includes(numMatches[0] + "k")) amount *= 1000;
    else if (lower.includes("juta") && content.includes(numMatches[0] + " juta")) amount *= 1000000;

    let transaction_type: "income" | "expense" | undefined;
    let category: any;
    let debt_type: any = "none";

    if (lower.includes("gaji") || lower.includes("pemasukan") || lower.includes("dapat uang") || lower.includes("dibayar") || lower.includes("untung")) {
      transaction_type = "income";
      category = "kebutuhan_dasar"; // default
    } else if (lower.includes("beli") || lower.includes("bayar") || lower.includes("pengeluaran") || lower.includes("jajan") || lower.includes("belanja") || lower.includes("sewa") || lower.includes("kos") || lower.includes("hutang") || lower.includes("cicilan")) {
      transaction_type = "expense";
      if (lower.includes("sewa") || lower.includes("kos") || lower.includes("kontrakan")) category = "sewa";
      else if (lower.includes("investasi") || lower.includes("saham") || lower.includes("crypto") || lower.includes("emas")) category = "investasi";
      else if (lower.includes("hutang") || lower.includes("pinjol") || lower.includes("cicilan") || lower.includes("kredit")) {
        category = "cicilan_hutang";
        if (lower.includes("pinjol") || lower.includes("toxic") || lower.includes("rentenir") || lower.includes("paylater")) debt_type = "high_interest_toxic";
        else if (lower.includes("bank") || lower.includes("kpr") || lower.includes("standard")) debt_type = "bank_standard";
        else if (lower.includes("teman") || lower.includes("keluarga") || lower.includes("tanpa bunga")) debt_type = "family_zero_interest";
      } else {
        category = "variabel";
      }
    }

    if (transaction_type && amount > 0) {
      result.financial_ledger = {
        amount,
        transaction_type,
        category: category || "variabel",
        is_recurring: lower.includes("rutin") || lower.includes("tiap bulan") || lower.includes("bulanan"),
        debt_type: debt_type || "none",
        description: content.substring(0, 100)
      };
    }
  }

  // 8. Detect Ikigai Vectors
  const ikigai_vectors: any[] = [];
  if (lower.includes("saya suka") || lower.includes("gemar") || lower.includes("hobi")) {
    ikigai_vectors.push({ content, category: "passion" });
  }
  if (lower.includes("bisa coding") || lower.includes("keahlian saya") || lower.includes("saya menguasai") || lower.includes("jago")) {
    ikigai_vectors.push({ content, category: "skill" });
  }
  if (lower.includes("makelar") || lower.includes("kenalan") || lower.includes("punya jaringan") || lower.includes("relasi")) {
    ikigai_vectors.push({ content, category: "social_capital" });
  }
  if (lower.includes("ingin membeli") || lower.includes("target hidup") || lower.includes("impian saya")) {
    ikigai_vectors.push({ content, category: "life_goal" });
  }

  if (ikigai_vectors.length > 0) {
    result.ikigai_vectors = ikigai_vectors;
  }

  return result;
}

// ── Onboarding Step Curation (Lite Model) ──
// Lightweight AI analysis per onboarding step. Returns a short insight
// about the user's position in the financial/career framework.
// Uses gemini-2.5-flash-lite for token efficiency (~50-100 tokens per call).

export interface StepCurationResult {
  insight: string;       // Short 1-2 sentence AI insight
  tanggaLevel: number;   // Current Tangga level (0-3)
  tanggaName: string;    // Tangga name
  mode: string;          // Survival/Stabilitas/Pertumbuhan
  positionSummary: string; // Brief position summary
}

const STEP_CURATION_PROMPTS: Record<number, string> = {
  0: "Pengguna baru saja memberikan data identitas dasar (nama, tanggal lahir, domisili). Berikan sambutan hangat singkat dan konfirmasi bahwa data ini membantu AI menyesuaikan konteks geografis dan demografis.",
  1: "Pengguna baru saja memberikan data keahlian dan pengalaman kerja. Analisis singkat: apakah skill mereka cukup untuk monetisasi cepat? Apakah ada skill gap yang perlu ditutup? Berikan 1 kalimat insight tentang potensi karir mereka.",
  2: "Pengguna baru saja memberikan data hobi dan minat. Analisis: apakah ada irisan antara skill (dari step sebelumnya) dengan hobi/minat yang bisa jadi peluang Ikigai? Berikan 1 kalimat insight.",
  3: "Pengguna baru saja memberikan data keuangan (pendapatan, pengeluaran, tabungan, hutang). Hitung: cashflow bulanan, saving rate, runway bulan. Tentukan posisi Tangga Finansial (0-3) dan Mode (Survival/Stabilitas/Pertumbuhan). Berikan 1 kalimat insight tegas tentang kondisi keuangan mereka.",
  4: "Pengguna baru saja memberikan data karir dan tujuan hidup. Analisis: apakah tujuan hidup mereka realistis dengan kondisi keuangan saat ini? Berikan 1 kalimat insight tentang alignment karir-keuangan.",
  5: "Pengguna baru saja memberikan data tempat tinggal dan aset produktif. Analisis: apakah aset mereka mendukung strategi monetisasi? Berikan 1 kalimat insight tentang kesiapan eksekusi.",
  6: "Semua data onboarding telah terkumpul. Berikan analisis KOMPREHENSIF dalam 2-3 kalimat tentang: (1) posisi Tangga Finansial dan Mode pengguna, (2) kekuatan utama mereka berdasarkan skill+aset, (3) 1 prioritas paling kritis untuk 30 hari ke depan. Bahasa Indonesia, tegas, profesional, tanpa sapaan.",
};

export async function curateOnboardingStep(
  step: number,
  collectedData: {
    name?: string;
    birthDate?: string;
    domicile?: string;
    dependents?: string;
    skills?: string[];
    experience?: string;
    hobbies?: string[];
    interests?: string[];
    income?: number;
    expenses?: number;
    savings?: number;
    investment?: number;
    debt?: number;
    gender?: string;
    insurance?: string;
    investmentExperience?: string[];
    formalStatus?: string;
    educationHistory?: string[];
    careerGoal?: string;
    lifeGoal?: string;
    dailyFreeHours?: number;
    livingSituation?: string;
    workDevices?: string[];
    deviceBrands?: Record<string, string>;
    mobilityAssets?: string[];
  }
): Promise<StepCurationResult> {
  // Compute Tangga & Mode client-equivalent (no AI needed for math)
  const income = collectedData.income || 0;
  const expenses = collectedData.expenses || 0;
  const debt = collectedData.debt || 0;
  const savings = collectedData.savings || 0;
  const cashflow = income - expenses;
  const runway = expenses > 0 ? savings / expenses : 0;

  let tanggaLevel = 2;
  let tanggaName = "Dana Darurat";
  if (income === 0 && savings < 10_000_000) { tanggaLevel = 0; tanggaName = "Income Starter"; }
  else if (debt > 0) { tanggaLevel = 1; tanggaName = "Bebas Hutang"; }
  else if (savings < expenses * 3) { tanggaLevel = 2; tanggaName = "Dana Darurat"; }
  else if (cashflow > 0 && runway >= 6) { tanggaLevel = 3; tanggaName = "Investasi 20%"; }

  let mode = "Stabilitas";
  if (cashflow < 0 || runway < 3) mode = "Survival";
  else if (runway >= 6 && debt === 0 && cashflow > 0) mode = "Pertumbuhan";

  const positionSummary = `Tangga ${tanggaLevel}: ${tanggaName} | Mode ${mode} | Cashflow Rp${cashflow.toLocaleString("id-ID")}/bln | Runway ${runway.toFixed(1)} bulan`;

  if (!process.env.GEMINI_API_KEY) {
    // Fallback: deterministic insight based on step + data
    return {
      insight: getFallbackStepInsight(step, collectedData, tanggaLevel, tanggaName, mode),
      tanggaLevel, tanggaName, mode, positionSummary,
    };
  }

  try {
    const prompt = `${STEP_CURATION_PROMPTS[step] || "Berikan insight singkat tentang data yang baru saja dikumpulkan."}

Data yang terkumpul sejauh ini:
- Nama: ${collectedData.name || "—"}
- Domisili: ${collectedData.domicile || "—"}
- Tanggungan: ${collectedData.dependents || "Tidak ada"}
- Keahlian: ${(collectedData.skills || []).join(", ") || "—"}
- Pengalaman: ${collectedData.experience || "—"}
- Hobi: ${(collectedData.hobbies || []).join(", ") || "—"}
- Minat: ${(collectedData.interests || []).join(", ") || "—"}
- Pendapatan: Rp${income.toLocaleString("id-ID")}/bln
- Pengeluaran: Rp${expenses.toLocaleString("id-ID")}/bln
- Tabungan: Rp${savings.toLocaleString("id-ID")}
- Investasi: Rp${(collectedData.investment || 0).toLocaleString("id-ID")}
- Pengalaman Investasi: ${(collectedData.investmentExperience || []).join(", ") || "Belum pernah"}
- Hutang: Rp${debt.toLocaleString("id-ID")}
- Status: ${collectedData.formalStatus || "—"}
- Pendidikan: ${(collectedData.educationHistory || []).join(", ") || "—"}
- Target Karir: ${collectedData.careerGoal || "—"}
- Tujuan Hidup: ${collectedData.lifeGoal || "—"}
- Kapasitas Eksekusi: ${collectedData.dailyFreeHours || 0} jam/hari
- Gender: ${collectedData.gender || "—"}
- Asuransi: ${collectedData.insurance || "—"}
- Tempat Tinggal: ${collectedData.livingSituation || "—"}
- Perangkat: ${(collectedData.workDevices || []).join(", ") || "—"}
${Object.entries(collectedData.deviceBrands || {}).filter(([, v]) => v?.trim()).map(([k, v]) => `  - ${k}: ${v}`).join("\n") || ""}
- Mobilitas: ${(collectedData.mobilityAssets || []).join(", ") || "—"}

Posisi Sistem: Tangga ${tanggaLevel}: ${tanggaName} | Mode ${mode}

Berikan ${step === 6 ? "2-3 kalimat analisis komprehensif" : "HANYA 1 kalimat insight singkat (maksimal 20 kata)"} dalam bahasa Indonesia yang tegas dan profesional tentang posisi pengguna saat ini dan apa yang paling penting untuk mereka fokuskan selanjutnya. Jangan gunakan sapaan atau basa-basi.`;

    const result = await callGemini({
      prompt,
      responseFormat: "text",
      maxTokens: 256,
      model: "lite",
    }, { callType: "onboarding_curation" });

    const insight = result.text.trim().replace(/^["']|["']$/g, "");

    return {
      insight: insight || getFallbackStepInsight(step, collectedData, tanggaLevel, tanggaName, mode),
      tanggaLevel, tanggaName, mode, positionSummary,
    };
  } catch (e) {
    console.error("Step curation AI failed, using fallback:", e);
    return {
      insight: getFallbackStepInsight(step, collectedData, tanggaLevel, tanggaName, mode),
      tanggaLevel, tanggaName, mode, positionSummary,
    };
  }
}

function getFallbackStepInsight(
  step: number,
  data: { income?: number; expenses?: number; debt?: number; skills?: string[] },
  tanggaLevel: number,
  tanggaName: string,
  mode: string
): string {
  const fallbacks: Record<number, string> = {
    0: "Data identitas tercatat. AI akan menyesuaikan strategi berdasarkan konteks demografis Anda.",
    1: `${(data.skills || []).length} keahlian terdeteksi. ${data.skills && data.skills.length >= 3 ? "Portfolio skill cukup solid untuk monetisasi." : "Perlu ekspansi skill untuk meningkatkan peluang income."}`,
    2: "Hobi dan minat terekam. AI akan mencari irisan Ikigai antara passion dan keahlian Anda.",
    3: `Posisi: Tangga ${tanggaLevel} (${tanggaName}). Mode ${mode}. ${mode === "Survival" ? "Fokus absolut: amankan cashflow dan lunasi hutang." : mode === "Pertumbuhan" ? "Fondasi solid. Siap ekspansi investasi." : "Perkuat dana darurat sebelum investasi."}`,
    4: "Tujuan hidup dan karir tercatat. AI akan menyelaraskan strategi dengan North Star Anda.",
    5: "Aset dan perangkat kerja terekam. AI akan menyesuaikan rekomendasi dengan kapasitas eksekusi Anda.",
    6: `Analisis lengkap: Tangga ${tanggaLevel} (${tanggaName}), Mode ${mode}. ${(data.skills || []).length} keahlian + aset produktif terdeteksi. Prioritas 30 hari: ${mode === "Survival" ? "amankan cashflow positif dan lunasi hutang konsumtif" : mode === "Pertumbuhan" ? "mulai alokasi 20% pendapatan ke instrumen investasi" : "bangun dana darurat minimal 3x pengeluaran bulanan"}.`,
  };
  return fallbacks[step] || "Data berhasil dikumpulkan.";
}

// ── Welcome Page AI Analysis ──
// Real Gemini-generated diagnosis + solution for the welcome page.
// Produces a natural, mentor-style narrative — NOT a template.

export interface WelcomeAnalysisResult {
  greeting: string;
  diagnosis: string;
  solution: string;
}

export async function generateWelcomeAnalysis(data: {
  name: string;
  birthDate?: string;
  domicile?: string;
  dependents?: string;
  skills?: string[];
  experience?: string;
  hobbies?: string[];
  interests?: string[];
  income?: number;
  expenses?: number;
  savings?: number;
  investment?: number;
  debt?: number;
  debtHighInterest?: string;
  debtProductive?: string;
  debtZeroInterest?: string;
  investmentExperience?: string[];
  riskProfile?: string;
  formalStatus?: string;
  careerGoal?: string;
  lifeGoal?: string;
  dailyFreeHours?: number;
  livingSituation?: string;
  workDevices?: string[];
  deviceBrands?: Record<string, string>;
  mobilityAssets?: string[];
  gender?: string;
  insurance?: string;
  tanggaLevel?: number;
  tanggaName?: string;
  mode?: string;
}): Promise<WelcomeAnalysisResult> {
  const income = Number(data.income || 0);
  const expenses = Number(data.expenses || 0);
  const savings = Number(data.savings || 0);
  const investment = Number(data.investment || 0);
  const debt = Number(data.debt || 0);
  const cashflow = income - expenses;
  const runway = expenses > 0 ? (savings / expenses).toFixed(1) : "0";
  const name = data.name || "User";
  const BT = String.fromCharCode(96); // backtick character

  console.log("[Welcome Analysis] Called for:", name, "| API Key:", process.env.GEMINI_API_KEY ? "present (" + process.env.GEMINI_API_KEY.length + " chars)" : "MISSING");

  if (!process.env.GEMINI_API_KEY) {
    return {
      greeting: `Halo ${name}! Selamat datang di Mentlife.`,
      diagnosis: "Data keuangan Anda telah kami analisis. Fondasi keuangan Anda perlu diperkuat secara bertahap.",
      solution: "Kita akan mulai dari langkah paling dasar dan membangun satu per satu. Saya akan temani Anda di setiap langkahnya.",
    };
  }

  try {
    const prompt = `Anda adalah Mentlife AI — mentor keuangan dan karir pribadi yang empatis, cerdas, dan realistis.

Seorang pengguna baru saja menyelesaikan onboarding. Anda telah membaca SEMUA data mereka. Sekarang, tulis sambutan personal yang alami dan hangat.

DATA PENGGUNA:
- Nama: ${name}
- Usia: ${data.birthDate ? calculateAge(data.birthDate) + " tahun" : "Tidak diketahui"}
- Domisili: ${data.domicile || "Tidak diketahui"}
- Status: ${data.formalStatus || "Tidak diketahui"}
- Tanggungan: ${data.dependents || "Tidak ada"}
- Keahlian: ${(data.skills || []).join(", ") || "Tidak ada"}
- Pengalaman: ${data.experience || "Tidak ada"}
- Hobi: ${(data.hobbies || []).join(", ") || "Tidak ada"}
- Minat: ${(data.interests || []).join(", ") || "Tidak ada"}
- Pendapatan: Rp${income.toLocaleString("id-ID")}/bln
- Pengeluaran: Rp${expenses.toLocaleString("id-ID")}/bln
- Cashflow: Rp${cashflow.toLocaleString("id-ID")}/bln (${cashflow >= 0 ? "surplus" : "defisit"})
- Tabungan: Rp${savings.toLocaleString("id-ID")}
- Investasi: Rp${investment.toLocaleString("id-ID")}
- Hutang: Rp${debt.toLocaleString("id-ID")}
- Runway: ${runway} bulan
- Tujuan Hidup: ${data.lifeGoal || "Belum ditentukan"}
- Target Karir: ${data.careerGoal || "Belum ditentukan"}
- Waktu Luang: ${data.dailyFreeHours || 0} jam/hari
- Tempat Tinggal: ${data.livingSituation || "Tidak diketahui"}
- Perangkat: ${(data.workDevices || []).join(", ") || "Tidak ada"}
${Object.entries(data.deviceBrands || {}).filter(([, v]) => v?.trim()).map(([k, v]) => `  - ${k}: ${v}`).join("\n") || ""}
- Mobilitas: ${(data.mobilityAssets || []).join(", ") || "Tidak ada"}
- Posisi Tangga: ${data.tanggaLevel || 0} - ${data.tanggaName || "Income Starter"}
- Mode: ${data.mode || "Stabilitas"}

TULIS 3 BAGIAN (dalam bahasa Indonesia, nada hangat seperti mentor yang tulus):

1. "greeting" — Sapaan pembuka singkat (1 kalimat), gunakan nama mereka. Buat terasa personal dan optimis.

2. "diagnosis" — "Yang Saya Lihat": Analisis jujur kondisi keuangan mereka. JANGAN ulang data mentah. Sintesis — katakan apa ARTINYA. Contoh:
   - Kalau cashflow negatif: "Setiap bulan Anda jalan minus, dan itu yang bikin susah maju."
   - Kalau punya skill digital + waktu luang: "Keahlian digital yang Anda punya itu aset nyata yang bisa langsung dimonetisasi."
   - Kalau hutang tinggi: "Beban hutang sedang menyedot potensi Anda untuk tumbuh."
   Gabungkan observasi menjadi narasi mengalir (3-5 kalimat). Akui yang buruk TAPI juga soroti kekuatan mereka.

3. "solution" — "Arah Program": Gambaran umum solusi yang akan mereka jalani bersama Mentlife. Jangan kaku/checklist. Buat seperti mentor yang menjelaskan rencana:
   - Kalau kondisi kritis: fokus stabilisasi cashflow + income tambahan
   - Kalau sedang: perkuat fondasi + lunasi hutang
   - kalau sehat: optimasi + investasi + pertumbuhan
   Hubungkan ke tujuan hidup mereka jika ada. (2-4 kalimat)

ATURAN:
- Bahasa Indonesia, conversational tapi profesional
- JANGAN mengulang angka/data mentah kecuali untuk penekanan
- JANGAN gunakan format list/bullet
- Tulis seperti Anda benar-benar mengenal mereka
- Nada: hangat, jujur, optimis tapi realistis

Format output (HANYA ini, tanpa teks lain):
${BT}${BT}${BT}json
{
  "greeting": "...",
  "diagnosis": "...",
  "solution": "..."
}
${BT}${BT}${BT}`;

    const result = await callGemini({
      prompt,
      responseFormat: "text",
      maxTokens: 2048,
      model: "flash",
      temperature: 0.8,
    }, { callType: "welcome_analysis" });

    console.log("[Welcome Analysis] Raw response (first 200 chars):", result.text.substring(0, 200));

    const parsed = safeParseJSON<WelcomeAnalysisResult>(result.text);
    console.log("[Welcome Analysis] Parsed:", JSON.stringify(parsed).substring(0, 200));

    return {
      greeting: parsed.greeting || `Halo ${name}! Selamat datang di Mentlife.`,
      diagnosis: parsed.diagnosis || "Data keuangan Anda telah kami analisis.",
      solution: parsed.solution || "Kita akan mulai dari langkah paling dasar dan membangun bersama.",
    };
  } catch (e: any) {
    console.error("[Welcome Analysis] AI call failed:", e?.message || e);
    console.error("[Welcome Analysis] Stack:", e?.stack);
    return {
      greeting: `Halo ${name}! Selamat datang di Mentlife.`,
      diagnosis: "Data keuangan Anda telah kami analisis. Fondasi keuangan Anda perlu diperkuat secara bertahap.",
      solution: "Kita akan mulai dari langkah paling dasar dan membangun satu per satu. Saya akan temani Anda di setiap langkahnya.",
    };
  }
}

