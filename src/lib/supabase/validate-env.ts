// Supabase Environment Validator
// Validasi environment variables sebelum aplikasi berjalan

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export function validateSupabaseEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Validasi URL
  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL tidak ditemukan di .env.local');
  } else {
    try {
      new URL(supabaseUrl);
      if (!supabaseUrl.includes('supabase.co')) {
        warnings.push('URL tidak mengandung "supabase.co" - pastikan URL benar');
      }
    } catch {
      errors.push('NEXT_PUBLIC_SUPABASE_URL tidak valid (bukan URL yang valid)');
    }
  }
  
  // Validasi API Key
  if (!supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY tidak ditemukan di .env.local');
  } else {
    // Cek apakah key terlalu pendek (kemungkinan terpotong)
    if (supabaseAnonKey.length < 50) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY terlalu pendek - kemungkinan terpotong');
    }
    
    // Cek apakah key terlihat seperti placeholder
    if (supabaseAnonKey.includes('YOUR_') || supabaseAnonKey.includes('EXAMPLE') || supabaseAnonKey.includes('...')) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY masih menggunakan placeholder - ganti dengan key yang valid');
    }
    
    // Cek format JWT dasar (eyJ开头)
    if (!supabaseAnonKey.startsWith('eyJ')) {
      warnings.push('NEXT_PUBLIC_SUPABASE_ANON_KEY tidak dimulai dengan "eyJ" - pastikan ini adalah JWT token');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    supabaseUrl,
    supabaseAnonKey,
  };
}

// Helper untuk menampilkan error message
export function getEnvErrorMessage(result: EnvValidationResult): string {
  if (result.isValid) return '';
  
  const lines = [
    '❌ Koneksi Supabase Gagal',
    '',
    'Masalah:',
    ...result.errors.map(e => `   • ${e}`),
  ];
  
  if (result.warnings.length > 0) {
    lines.push('', 'Peringatan:', ...result.warnings.map(w => `   • ${w}`));
  }
  
  lines.push(
    '',
    'Solusi:',
    '   1. Buka file .env.local di root project',
    '   2. Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY terisi',
    '   3. Dapatkan key dari: Supabase Dashboard → Settings → API',
    '   4. Restart development server: npm run dev'
  );
  
  return lines.join('\n');
}
