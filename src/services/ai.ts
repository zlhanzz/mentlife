// AI Mentor Service

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
    mobility_assets?: string[];
    life_goal?: string;
  }
): Promise<AIRecommendations> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const currencySymbol = usersCore?.country_code === "SG" ? "S$" : usersCore?.country_code === "US" ? "$" : "Rp";

  if (geminiApiKey) {
    try {
      // Build instructions based on rules
      let healthInstruction = "";
      if (usersCore?.has_physical_limitation) {
        healthInstruction = `\n⚠️ STATUS KESEHATAN/FISIK PENGGUNA: KETERBATASAN FISIK (${usersCore.physical_limitation_details || "tidak dijelaskan secara rinci"}). JANGAN menyarankan pekerjaan lapangan atau fisik yang mustahil dikerjakan. Arahkan murni ke tugas digital/manajerial yang sesuai dengan keterbatasan fisiknya.`;
      } else if (usersCore?.health_baseline === "burnout_alert") {
        healthInstruction = `\n⚠️ STATUS KESEHATAN PENGGUNA: ALARM BURNOUT. JANGAN menyarankan side-hustle tambahan atau beban produktivitas tinggi. Fokuskan saran pada pemulihan, istirahat, efisiensi waktu, dan kesehatan mental.`;
      } else if (usersCore?.health_baseline === "physical_limitation") {
        healthInstruction = `\n⚠️ STATUS KESEHATAN PENGGUNA: KETERBATASAN FISIK. JANGAN menyarankan pekerjaan lapangan atau fisik. Rekomendasikan hanya pekerjaan digital/intelektual.`;
      }

      let assetInstruction = "";
      const workDevices = usersCore?.work_devices || [];
      const mobilityAssets = usersCore?.mobility_assets || [];
      
      assetInstruction += `\n- Perangkat kerja utama: ${workDevices.join(", ") || "Tidak ada perangkat kerja tercantum"}.`;
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
      } else if (usersCore?.current_roadblock === "burnout_lelah") {
        roadblockInstruction = `\n⚠️ HAMBATAN UTAMA: Burnout & Lelah. Prioritaskan saran pemulihan energi, pembatasan jam kerja, pendelegasian, dan pencegahan stress fisik/mental sebelum mendorong karir/finansial secara agresif.`;
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
 
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );
 
      const json = await response.json();
      const text = json.candidates[0].content.parts[0].text;
      return JSON.parse(text) as AIRecommendations;
    } catch (e) {
      console.error("Gemini API call failed, using fallback generator:", e);
    }
  }
 
  // Smart Fallback Generator (Ikigai Oriented + Constraints Aware)
  const skillsStr = profile.skills.slice(0, 2).join(" & ") || "Analisis";
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
  } else if (usersCore?.health_baseline === "burnout_alert") {
    targetGoal = `Pemulihan Energi & Manajemen Burnout`;
    advice = `Anda sedang dalam alarm burnout. Jangan mengambil pekerjaan tambahan yang melelahkan. Fokus pada efisiensi jam kerja utama dan istirahat yang cukup.`;
    dailyInsight = "Kesehatan Anda adalah aset investasi terbesar. Istirahat sejenak untuk melangkah lebih jauh.";
    
    sideHustles = [
      {
        title: `Fokus Istirahat & Meditasi`,
        description: `Sisihkan waktu luang harian Anda (${usersCore?.daily_free_hours || 2} jam) untuk memulihkan stres fisik dan mental.`,
        difficulty: "Mudah",
        estimatedIncome: `${currencySymbol}0`,
        relevance: `Sesuai kondisi burnout alert Anda agar tidak memperparah stres.`,
        ikigaiMatch: 95,
        ikigaiAnalysis: `Menjaga keseimbangan hidup sebelum siap mengeksplorasi peluang karir kembali.`
      },
      {
        title: `Optimalkan Waktu Luang Harian`,
        description: `Rampingkan rutinitas Anda dan delegasikan tugas non-esensial untuk mengurangi kelelahan mental.`,
        difficulty: "Mudah",
        estimatedIncome: `${currencySymbol}0`,
        relevance: `Cocok karena Anda memiliki waktu luang harian terbatas sebesar ${usersCore?.daily_free_hours || 2} jam.`,
        ikigaiMatch: 90,
        ikigaiAnalysis: `Mengelola waktu secara seimbang merupakan pondasi penting Ikigai.`
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
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
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

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      const json = await response.json();
      const text = json.candidates[0].content.parts[0].text;
      return JSON.parse(text) as DecisionProjectionResult;
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
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const prompt = `
        Anda adalah AI Data Extractor untuk aplikasi MentLife. Tugas Anda adalah menganalisis pesan percakapan terakhir pengguna dan mengekstrak informasi terstruktur jika pengguna menceritakan atau memperbarui kondisi demografi, aset, keuangan, hobi, keahlian, atau tujuan hidup mereka.
        
        Masing-masing entitas yang bisa Anda ekstrak adalah:
        1. "users_core": Info profil (formal_status, primary_focus, daily_free_hours, risk_profile, dependents_count, is_sandwich_gen, marital_status, owned_assets, country_code, health_baseline, major_life_goals).
           - formal_status harus salah satu dari: 'Mahasiswa', 'Karyawan', 'Pengusaha', 'Freelancer', 'Menganggur'.
           - risk_profile harus salah satu dari: 'konservatif', 'moderat', 'agresif'.
           - marital_status harus salah satu dari: 'single', 'married', 'previously_married', 'pacaran'.
           - health_baseline harus salah satu dari: 'fit', 'physical_limitation', 'burnout_alert'.
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
        - "users_core.health_baseline" dapat diekstrak menjadi 'burnout_alert' jika user bercerita lelah/burnout, 'physical_limitation' jika cedera/sakit fisik, atau 'fit'.
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      const json = await response.json();
      const text = json.candidates[0].content.parts[0].text;
      return JSON.parse(text) as ChatExtractionResult;
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
  if (lower.includes("burnout") || lower.includes("capek") || lower.includes("lelah") || lower.includes("stres") || lower.includes("stress") || lower.includes("letih")) health_baseline = "burnout_alert";
  else if (lower.includes("cedera") || lower.includes("sakit") || lower.includes("lumpuh") || lower.includes("fisik terganggu") || lower.includes("difabel")) health_baseline = "physical_limitation";
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

