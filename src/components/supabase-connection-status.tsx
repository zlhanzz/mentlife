'use client'

import { useEffect, useState } from 'react'
import { validateSupabaseEnv, getEnvErrorMessage } from '@/lib/supabase/validate-env'

export default function SupabaseConnectionStatus() {
  const [validation, setValidation] = useState<ReturnType<typeof validateSupabaseEnv> | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const result = validateSupabaseEnv()
    setValidation(result)
    setChecked(true)
  }, [])

  if (!checked) return null

  if (!validation) return null

  const isError = !validation.isValid
  const hasPlaceholderKey = validation.supabaseAnonKey?.includes('YOUR_') || 
                            validation.supabaseAnonKey?.includes('EXAMPLE') ||
                            validation.supabaseAnonKey?.includes('...')

  return (
    <div className={`rounded-xl border p-4 ${isError ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2.5 h-2.5 rounded-full ${isError ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
        <p className={`text-sm font-bold ${isError ? 'text-rose-500' : 'text-emerald-500'}`}>
          {isError ? 'Koneksi Supabase: Gagal' : 'Koneksi Supabase: Berhasil'}
        </p>
      </div>

      {isError ? (
        <div className="space-y-2">
          <p className="text-xs text-rose-500 font-medium">
            {getEnvErrorMessage(validation)}
          </p>

          {hasPlaceholderKey && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-3">
              <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">Cara Mendapatkan API Key:</p>
              <ol className="text-[10px] text-amber-500/80 space-y-1 list-decimal pl-4">
                <li>Buka https://supabase.com/dashboard</li>
                <li>Pilih project → Settings → API</li>
                <li>Copy "anon/public key" (mulai dengan eyJhbG...)</li>
                <li>Update file .env.local</li>
                <li>Restart: npm run dev</li>
              </ol>
            </div>
          )}

          <div className="bg-zinc-950 rounded-lg p-3 mt-3">
            <p className="text-[10px] text-zinc-400 font-mono mb-1">File .env.local saat ini:</p>
            <pre className="text-[9px] text-zinc-500 overflow-x-auto">
              {`NEXT_PUBLIC_SUPABASE_URL="${validation.supabaseUrl || 'TIDAK ADA'}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${validation.supabaseAnonKey || 'TIDAK ADA'}"`}
            </pre>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-xs text-emerald-500">
            URL: {validation.supabaseUrl}
          </p>
          <p className="text-xs text-emerald-500/80">
            Key: {validation.supabaseAnonKey?.substring(0, 20)}...{validation.supabaseAnonKey?.substring(validation.supabaseAnonKey.length - 10)}
          </p>
        </div>
      )}
    </div>
  )
}
