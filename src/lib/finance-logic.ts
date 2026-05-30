// src/lib/finance-logic.ts

export type LadderLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface FinanceSnapshot {
  liquid_savings: number;
  total_debt: number;
  emergency_fund_current: number;
  emergency_fund_target: number;
  investment_value: number;
  monthly_expenses: number;
}

/**
 * Menentukan posisi tangga finansial pengguna berdasarkan data riil.
 * Logika ini mutlak berdasarkan database, bukan asumsi.
 */
export function calculateLadderLevel(data: FinanceSnapshot): LadderLevel {
  // Tangga 1: Mode Survival (Bebas Utang Konsumtif)
  // Jika utang > 0, tetap di level 1 sampai lunas.
  if (data.total_debt > 0) return 1;

  // Tangga 2: Dana Darurat (Minimal 6x - 12x pengeluaran)
  // Kita gunakan standar 6x sebagai ambang batas minimal keamanan
  if (data.emergency_fund_current < (data.monthly_expenses * 6)) return 2;

  // Tangga 3: Investasi Konsisten
  // Jika investasi belum mencapai ambang tertentu atau belum mulai
  if (data.investment_value < 1000000) return 3;

  // Tangga 4: Dana Tujuan Hidup Besar
  if (data.investment_value < 50000000) return 4;

  // Tangga 5: Bebas Utang Jangka Panjang
  // (Logika ini akan dikembangkan sesuai data kewajiban jangka panjang)
  return 5;
}

export function isFeatureLocked(level: LadderLevel, feature: 'INVESTMENT' | 'WANTS_PURCHASE'): boolean {
  if (feature === 'INVESTMENT') {
    // Investasi hanya dibuka di Level 3 ke atas
    return level < 3;
  }
  return false;
}
