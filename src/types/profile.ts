// AI Memory Core Types & Interfaces
// Updated untuk mendukung kolom-kolom baru dari migration SQL

export interface ProfileData {
  id: string;
  full_name: string;
  age?: number; // Added age
  background?: string;
  life_goal?: string;
  skills: string[];
  experience: string;
  hobbies: string[];
  interests: string[];
  career_state?: string;
  career_goal: string;
  xp: number;
  level: number;
  badges: string[];
  
  // New columns from migration
  health_mental?: 'fit' | 'burnout_alert' | 'physical_limitation';
  communication_style?: 'empatis_sabar' | 'tegas_disiplin' | 'logis_objektif';
  risk_tolerance?: 'konservatif' | 'moderat' | 'agresif';
  time_availability?: number; // hours per day
  financial_literacy_level?: 'pemula' | 'menengah' | 'ahli';
  income_type?: 'tetap' | 'tidak_tetap' | 'bisnis' | 'investasi' | 'campuran';
  location?: string;
  education?: string;
  
  // Ikigai columns
  ikigai_passion?: string[];
  ikigai_profession?: string[];
  ikigai_mission?: string[];
  ikigai_vocation?: string[];
  skills_assessment?: Record<string, number>; // skill -> confidence level (1-10)
  values_and_beliefs?: string[];
  current_challenges?: string[];
  support_system?: string[];
  learning_preference?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  motivation_triggers?: string[];
  
  // Financial columns
  financial_behavior_score?: number;
  financial_goals?: string[];
  credit_score?: number;
  financial_literacy_score?: number;

  // CareerProfileTab columns (6 sections)
  education_options?: string[];
  education_story?: string;
  status_options?: string[];
  status_story?: string;
  skills_story?: string;
  hobbies_story?: string;
  interests_story?: string;
  north_star_options?: string[];
  north_star_story?: string;
}

export interface FinancialProfileData {
  id: string;
  monthly_income: number;
  fixed_expenses: number;
  total_debt: number;
  debt_paid?: number;
  debt_details?: string;
  liquid_savings: number;
  investment_value: number;
  emergency_fund_current: number;
  emergency_fund_target: number;
  current_stage: 'DEBT' | 'EMERGENCY_FUND' | 'INVESTMENT';
  
  // New columns from migration
  monthly_expenses_breakdown?: Record<string, number>; // category -> amount
  assets?: string[];
  debt_type?: 'high_interest_toxic' | 'bank_standard' | 'family_zero_interest' | 'mixed';

  // Columns for FinanceProfileTab
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
}

export interface UsersCoreData {
  id: string;
  formal_status: 'Mahasiswa' | 'Karyawan' | 'Pengusaha' | 'Freelancer' | 'Menganggur';
  primary_focus: string;
  daily_free_hours: number;
  financial_state_id: 'Survival' | 'Stabilitas' | 'Pertumbuhan' | 'Kebebasan';
  country_code: string;
  risk_profile: 'konservatif' | 'moderat' | 'agresif';
  dependents_count: number;
  is_sandwich_gen: boolean;
  owned_assets: string[];
  marital_status: 'single' | 'married' | 'previously_married' | 'pacaran';
  major_life_goals: string[];
  health_baseline: 'fit' | 'physical_limitation' | 'burnout_alert';
  rent_by_choice: boolean;
  ai_communication_style: 'empatis_sabar' | 'tegas_disiplin' | 'logis_objektif';
  current_roadblock: 'sulit_menabung' | 'arah_karir' | 'burnout_lelah' | 'kurang_disiplin';
  
  // Tab PRIBADI (Final Blueprint) fields
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

  // New columns from migration
  ai_memory?: AIChatMemory[];
  learning_preference?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  motivation_triggers?: string[];
}

export interface AIChatMemory {
  id: string;
  user_id: string;
  context: string; // "career", "finance", "health", "motivation"
  insight: string; // AI's learned insight
  confidence: number; // 0-100
  created_at: string;
}

export interface FinancialLadderLevel {
  id: 'DEBT' | 'EMERGENCY_FUND' | 'INVESTMENT' | 'FIRE' | 'LEGACY';
  name: string;
  description: string;
  target: string;
  action_required: string;
}

export interface IkigaiAssessment {
  id: string;
  user_id: string;
  passion: string[];
  profession: string[];
  mission: string[];
  vocation: string[];
  market_demand: string[];
  financial_value: number;
  created_at: string;
}

// AI Agent Input Interfaces
export interface AIPerformanceInput {
  profile: ProfileData;
  financial: FinancialProfileData;
  usersCore: UsersCoreData;
  ladderState: FinancialLadderState;
  financialMode: FinancialModeState;
}

export interface FinancialLadderState {
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  levelName: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  actionRequired: string;
  currencySymbol: string;
}

export interface FinancialModeState {
  mode: 'Survival' | 'Stabilitas' | 'Pertumbuhan' | 'Kebebasan';
  runwayMonths: number;
  isRedAlert: boolean;
  monthlyCashflow: number;
  lockedFeatures: string[];
  modeLabel: string;
  modeDescription: string;
  modeColor: string;
}
