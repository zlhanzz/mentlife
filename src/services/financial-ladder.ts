// Logic Engine for the 7-Step Financial Ladder ("Tangga Ternak Uang")
// Layer 2: Kurikulum Tangga Keuangan

export type FinancialLadderLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type FinancialMode = "Survival" | "Stabilitas" | "Pertumbuhan" | "Kebebasan";

export interface FinancialLadderState {
  level: FinancialLadderLevel;
  levelName: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  actionRequired: string;
  currencySymbol: string;
}

export interface FinancialModeState {
  mode: FinancialMode;
  runwayMonths: number;
  isRedAlert: boolean;
  monthlyCashflow: number;
  /** Features to lock based on mode */
  lockedFeatures: string[];
  modeLabel: string;
  modeDescription: string;
  modeColor: string;
}

export type CashflowStatus = "Kritis" | "Aman" | "Ideal";

export interface CashflowHealthState {
  status: CashflowStatus;
  /** Monthly net cashflow (income - expenses) */
  monthlyCashflow: number;
  /** Cashflow ratio: cashflow / income. e.g. 0.25 = 25% savings rate */
  cashflowRatio: number;
  /** Debt Service Ratio: monthly_debt_payment / income. Estimated as totalDebt * 0.03 / income */
  dsr: number;
  /** Human-readable label with emoji */
  label: string;
  /** Short explanation of why this status was given */
  reason: string;
  /** Color token: "rose" | "amber" | "emerald" */
  color: "rose" | "amber" | "emerald";
  /** Continuous progress score from 0 to 100 */
  cashflowScore: number;
}

export interface UserFinancialDetails {
  liquidSavings: number;
  emergencyFundCurrent: number;
  fixedExpenses: number;
  monthlyIncome: number;
  totalDebt: number;
  isSandwichGen: boolean;
  maritalStatus: 'single' | 'married' | 'previously_married' | 'pacaran';
  countryCode: string;
  investmentValue: boolean | number;
  majorLifeGoals: string[];
  ownedAssets: string[];
  passiveIncome?: number;
  rentByChoice?: boolean;
  /** Monthly debt installment (cicilan), if known precisely */
  monthlyDebtInstallment?: number;
}

/**
 * Cashflow Health Evaluator — measures monthly FLOW (not stock/time).
 *
 * Logic:
 * - KRITIS:  cashflow < 0  OR  DSR > 40%  (income less than expenses, or debt crushing)
 * - AMAN:    cashflow > 0  AND  DSR ≤ 40%  AND  savings rate < 50%
 * - IDEAL:   savings rate ≥ 50%  AND  DSR ≤ 15%  AND  emergencyFund ≥ 3x expenses
 *
 * Note: DSR estimated as (totalDebt * 3%) / monthlyIncome when exact installment unknown.
 */
export function getCashflowHealth(details: UserFinancialDetails): CashflowHealthState {
  const {
    monthlyIncome,
    fixedExpenses,
    totalDebt,
    emergencyFundCurrent,
    monthlyDebtInstallment,
  } = details;

  const monthlyCashflow = monthlyIncome - fixedExpenses;

  // Savings rate = how much of income is "left over" after expenses
  const cashflowRatio = monthlyIncome > 0 ? monthlyCashflow / monthlyIncome : -1;

  // DSR: if exact installment given, use it; otherwise estimate 3%/mo of total debt
  const estimatedDebtPayment = monthlyDebtInstallment ?? (totalDebt * 0.03);
  const dsr = monthlyIncome > 0 ? estimatedDebtPayment / monthlyIncome : (totalDebt > 0 ? 1 : 0);

  const hasDebt = totalDebt > 0;
  const hasIncome = monthlyIncome > 0;

  let cashflowScore = 0;
  let status: CashflowStatus = "Kritis";
  let color: "rose" | "amber" | "emerald" = "rose";
  let label = "🔴 Beresiko";
  let reason = "";

  if (!hasIncome) {
    if (hasDebt) {
      cashflowScore = 0;
      reason = "Beresiko Tinggi: Tidak memiliki pendapatan dan memiliki kewajiban hutang aktif.";
    } else {
      cashflowScore = 15;
      reason = "Beresiko Tinggi: Tidak memiliki sumber pendapatan aktif.";
    }
  } else {
    if (hasDebt) {
      // Punya pekerjaan/pendapatan tapi punya hutang = Beresiko (progress di atas 0-income sedikit)
      // DSR memengaruhi sisa progress di zona Beresiko (20% - 33%)
      cashflowScore = Math.round(20 + Math.max(0, Math.min(13, (1 - dsr) * 13)));
      reason = `Beresiko: Memiliki pendapatan tetapi dibebani cicilan hutang aktif sebesar ${Math.round(dsr * 100)}% dari pendapatan bulanan.`;
    } else {
      if (monthlyCashflow < 0) {
        // Arus kas defisit = Beresiko (15% - 33%)
        const deficitRatio = Math.min(1, Math.abs(monthlyCashflow) / fixedExpenses);
        cashflowScore = Math.round(15 + (1 - deficitRatio) * 18);
        reason = `Beresiko: Pengeluaran melebihi pendapatan (defisit Rp${Math.abs(monthlyCashflow).toLocaleString('id-ID')}/bln).`;
      } else {
        // Punya pendapatan dan TIDAK punya hutang
        const surplusRatio = fixedExpenses > 0 ? monthlyCashflow / fixedExpenses : 1.0;

        if (surplusRatio >= 1.0) {
          // Pendapatan jauh lebih banyak dan surplus >= 100% dari pengeluaran kebutuhan -> Ideal
          status = "Ideal";
          color = "emerald";
          label = "🟢 Ideal";
          // Progress di zona Ideal (70% - 100%)
          cashflowScore = Math.round(70 + Math.min(30, (surplusRatio - 1.0) * 30));
          reason = `Ideal: Bebas hutang dan surplus bulanan Anda sangat besar (+${Math.round(surplusRatio * 100)}% dari biaya kebutuhan).`;
        } else {
          // Pendapatan dan pengeluaran seimbang (surplus 0% - 99%) -> Aman (basic progress)
          status = "Aman";
          color = "amber";
          label = "🟡 Aman";
          // Progress di zona Aman (35% - 66%)
          cashflowScore = Math.round(35 + (surplusRatio * 31));
          reason = surplusRatio === 0
            ? "Aman (Dasar): Pendapatan seimbang dengan pengeluaran kebutuhan pokok Anda (tanpa utang)."
            : `Aman: Bebas hutang dengan surplus arus kas positif sebesar Rp${monthlyCashflow.toLocaleString('id-ID')}/bln (+${Math.round(surplusRatio * 100)}% kebutuhan).`;
        }
      }
    }
  }

  return {
    status,
    monthlyCashflow,
    cashflowRatio,
    dsr,
    label,
    reason,
    color,
    cashflowScore,
  };
}


export function getCurrencyConfig(countryCode: string) {
  switch (countryCode?.toUpperCase()) {
    case 'SG':
      return { symbol: 'S$', code: 'SGD', starterEfThreshold: 1000, locale: 'en-SG' };
    case 'US':
      return { symbol: '$', code: 'USD', starterEfThreshold: 1000, locale: 'en-US' };
    case 'MY':
      return { symbol: 'RM', code: 'MYR', starterEfThreshold: 2000, locale: 'ms-MY' };
    case 'ID':
    default:
      return { symbol: 'Rp', code: 'IDR', starterEfThreshold: 10000000, locale: 'id-ID' };
  }
}

/**
 * Layer 2 - Financial Mode State Machine
 * Determines the user's current Financial Mode based on Runway Ratio.
 * 
 * Trigger Logic:
 * - Survival:    (liquidSavings / fixedExpenses) < 3 OR monthlyCashflow < 0
 * - Stabilitas:  runway >= 3 AND <= 6 AND cashflow > 0
 * - Pertumbuhan: runway > 6 AND totalDebt (non-KPR) = 0
 * - Kebebasan:   passiveIncome >= fixedExpenses
 */
export function getFinancialMode(details: UserFinancialDetails): FinancialModeState {
  const {
    liquidSavings,
    fixedExpenses,
    monthlyIncome,
    totalDebt,
    passiveIncome = 0,
  } = details;

  const monthlyCashflow = monthlyIncome - fixedExpenses;
  const runwayMonths = fixedExpenses > 0 ? liquidSavings / fixedExpenses : 0;

  // Mode: Kebebasan (Financial Independence)
  if (passiveIncome > 0 && passiveIncome >= fixedExpenses) {
    return {
      mode: "Kebebasan",
      runwayMonths,
      isRedAlert: false,
      monthlyCashflow,
      lockedFeatures: [],
      modeLabel: "🏆 Mode Kebebasan",
      modeDescription: "Passive income sudah mencukupi kebutuhan hidupmu. Uang bekerja untukmu.",
      modeColor: "teal",
    };
  }

  // Mode: Pertumbuhan (Growth)
  if (runwayMonths > 6 && totalDebt === 0 && monthlyCashflow > 0) {
    return {
      mode: "Pertumbuhan",
      runwayMonths,
      isRedAlert: false,
      monthlyCashflow,
      lockedFeatures: [],
      modeLabel: "📈 Mode Pertumbuhan",
      modeDescription: "Fondasi keuanganmu sudah solid. Saatnya ekspansi investasi dan karir.",
      modeColor: "emerald",
    };
  }

  // Mode: Survival (Crisis)
  if (runwayMonths < 3 || monthlyCashflow < 0) {
    return {
      mode: "Survival",
      runwayMonths,
      isRedAlert: true,
      monthlyCashflow,
      lockedFeatures: ["risk_profile", "investment_module", "long_term_goals"],
      modeLabel: "🚨 Mode Survival",
      modeDescription: "Runway keuanganmu kritis. Fokus absolut pada cashflow dan kebutuhan dasar.",
      modeColor: "rose",
    };
  }

  // Default: Stabilitas (Foundation)
  return {
    mode: "Stabilitas",
    runwayMonths,
    isRedAlert: false,
    monthlyCashflow,
    lockedFeatures: ["risk_profile", "investment_module"],
    modeLabel: "🏗️ Mode Stabilitas",
    modeDescription: "Kamu bisa bernapas, tapi fondasi belum beton. Perkuat dana darurat dan Ikigai.",
    modeColor: "amber",
  };
}

/**
 * Layer 2 - 7-Step Financial Ladder Evaluator
 * Determines exactly which of the 7 rungs the user is on.
 */
export function evaluateFinancialLadder(details: UserFinancialDetails): FinancialLadderState {
  const {
    liquidSavings,
    emergencyFundCurrent,
    fixedExpenses,
    monthlyIncome,
    totalDebt,
    isSandwichGen,
    maritalStatus,
    countryCode,
    investmentValue = 0,
    majorLifeGoals = [],
    ownedAssets = [],
    rentByChoice = false
  } = details;

  const { symbol: currencySymbol, starterEfThreshold, locale } = getCurrencyConfig(countryCode);
  const fmt = (n: number) => `${currencySymbol}${Math.abs(n).toLocaleString(locale)}`;

  // Dynamic Emergency Fund Target:
  // - 9-12x fixed expenses for sandwich gen with dependents
  // - 6x for married or sandwich gen (standard)
  // - 3x for single non-sandwich gen
  const isMarriedOrSandwich = isSandwichGen || maritalStatus === 'married';
  const efMultiplier = isSandwichGen ? 9 : isMarriedOrSandwich ? 6 : 3;
  const emergencyFundTarget = fixedExpenses * efMultiplier;
  const monthlyNet = Math.max(0, monthlyIncome - fixedExpenses);

  // ─── TANGGA 0: Income Starter (Mesin Income Aktif) ───
  // Trigger: monthlyIncome === 0 DAN liquidSavings < starterEfThreshold
  if (monthlyIncome === 0 && liquidSavings < starterEfThreshold) {
    return {
      level: 0,
      levelName: 'Tangga 0: Income Starter',
      description: `Amankan sumber pemasukan pertama Anda. Saat ini pendapatan bulanan Anda Rp0 dan tabungan Anda di bawah batas minimal ${fmt(starterEfThreshold)}.`,
      targetAmount: starterEfThreshold,
      currentAmount: liquidSavings,
      progressPercentage: 0,
      actionRequired: 'Fokus penuh pada Karir / Monetisasi Skill Anda untuk mendapatkan pemasukan (cash inflow) pertama.',
      currencySymbol,
    };
  }

  // ─── TANGGA 1: Bebas Hutang (Debt Snowball) ───
  if (totalDebt > 0) {
    const progress = monthlyNet > 0 ? Math.min(Math.round((monthlyNet / totalDebt) * 100), 99) : 0;
    const isBufferCriticallyLow = liquidSavings < starterEfThreshold;
    const actionText = isBufferCriticallyLow
      ? `Gunakan metode Split Budgeting: Karena tabungan darurat awal Anda belum aman (${fmt(liquidSavings)} < ${fmt(starterEfThreshold)}), bayar cicilan minimum wajib hutang, lalu alokasikan sisa surplus bersih: 30% untuk mengisi Dana Darurat Awal dan 70% sebagai cicilan ekstra melunasi hutang paling beracun (Debt Snowball).`
      : `Alokasikan 100% sisa surplus bersih bulanan Anda (${fmt(monthlyNet)}) secara agresif untuk melunasi seluruh hutang konsumtif Anda, urutkan dari yang berbunga paling tinggi (Pinjol/Kartu Kredit).`;
    return {
      level: 1,
      levelName: 'Tangga 1: Bebas Hutang (Debt Snowball)',
      description: 'Lunasi semua hutang konsumtif secara agresif untuk menghentikan kebocoran bunga finansial Anda.',
      targetAmount: totalDebt,
      currentAmount: 0,
      progressPercentage: progress,
      actionRequired: actionText,
      currencySymbol,
    };
  }

  // ─── TANGGA 2: Dana Darurat ───
  if (emergencyFundCurrent < emergencyFundTarget) {
    const progress = emergencyFundTarget > 0 ? Math.min(Math.round((emergencyFundCurrent / emergencyFundTarget) * 100), 100) : 0;
    const remaining = emergencyFundTarget - emergencyFundCurrent;
    return {
      level: 2,
      levelName: 'Tangga 2: Dana Darurat',
      description: `Kumpulkan dana darurat penuh sebesar ${efMultiplier}x pengeluaran bulanan Anda (${isSandwichGen ? 'Sandwich Generation' : isMarriedOrSandwich ? 'Sudah Menikah' : 'Status Single'}).`,
      targetAmount: emergencyFundTarget,
      currentAmount: emergencyFundCurrent,
      progressPercentage: progress,
      actionRequired: `Tabung sisa surplus Anda untuk melengkapi kekurangan sebesar ${fmt(remaining)} lagi di rekening dana darurat yang terpisah dari tabungan operasional harian.`,
      currencySymbol,
    };
  }

  // ─── TANGGA 3: Investasi 20% ───
  const targetMonthlyInvestment = monthlyIncome * 0.20;
  const currentInvestment = Number(investmentValue);
  const investTarget6M = targetMonthlyInvestment * 6;
  if (currentInvestment < investTarget6M) {
    const progress = investTarget6M > 0 ? Math.min(Math.round((currentInvestment / investTarget6M) * 100), 100) : 0;
    return {
      level: 3,
      levelName: 'Tangga 3: Investasi Konsisten 20%',
      description: 'Mulai investasi minimal 20% dari pendapatan ke reksa dana, saham, atau instrumen pertumbuhan sesuai profil risiko.',
      targetAmount: investTarget6M,
      currentAmount: currentInvestment,
      progressPercentage: progress,
      actionRequired: `Set auto-debet ${fmt(targetMonthlyInvestment)}/bulan (20% dari pendapatan) ke produk investasi sesuai profil risikomu.`,
      currencySymbol,
    };
  }

  // ─── TANGGA 4: Dana Masa Depan (Major Life Goals) ───
  if (majorLifeGoals.length > 0 && currentInvestment < 150000000) {
    const target = countryCode === 'ID' ? 150000000 : 15000;
    const progress = Math.min(Math.round((currentInvestment / target) * 100), 100);
    return {
      level: 4,
      levelName: 'Tangga 4: Pendanaan Goal Hidup Besar',
      description: `Dana khusus untuk: ${majorLifeGoals.slice(0, 2).join(', ')}. Pisahkan dari investasi rutin.`,
      targetAmount: target,
      currentAmount: currentInvestment,
      progressPercentage: progress,
      actionRequired: `Buat rekening bucket terpisah untuk goal hidupmu. Hitung inflasi dan backward-engineer nominal yang harus ditabung per bulan.`,
      currencySymbol,
    };
  }

  // ─── TANGGA 5: Kepemilikan Properti & Bebas KPR ───
  const ownsHome = ownedAssets.some(a => ['rumah', 'apartemen', 'house', 'apartment', 'property'].some(k => a.toLowerCase().includes(k)));
  if (!ownsHome && !rentByChoice) {
    const propertyTarget = countryCode === 'ID' ? 500000000 : 300000;
    const progress = Math.min(Math.round((currentInvestment / propertyTarget) * 100), 100);
    return {
      level: 5,
      levelName: 'Tangga 5: Kepemilikan Properti & Bebas KPR',
      description: 'Lunasi cicilan rumah lebih cepat atau kumpulkan uang muka properti pertamamu secara tunai.',
      targetAmount: propertyTarget,
      currentAmount: currentInvestment,
      progressPercentage: progress,
      actionRequired: 'Alihkan seluruh dana ekstra di luar kebutuhan harian untuk mempercepat pelunasan KPR atau akuisisi properti.',
      currencySymbol,
    };
  }

  // ─── TANGGA 6: Kekayaan Abadi & Filantropi ───
  return {
    level: 6,
    levelName: 'Tangga 6: Kekayaan Abadi & Filantropi',
    description: 'Nol hutang. Investasi berjalan otomatis. AI kini memfokuskan sesi pada perencanaan warisan, pajak, dan filantropi.',
    targetAmount: 0,
    currentAmount: currentInvestment,
    progressPercentage: 100,
    actionRequired: 'Fokus pada legacy building: mentoring orang lain, optimalisasi pajak, dan perencanaan warisan antargenerasi.',
    currencySymbol,
  };
}
