'use client'

import { useEffect, useState } from 'react'
import { checkSupabaseConnection, formatConnectionStatus } from '@/lib/supabase/health-check'

export default function SupabaseHealthCheck() {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof checkSupabaseConnection>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSupabaseConnection().then((result) => {
      setStatus(result)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="p-4 bg-muted/30 rounded-xl">
        <p className="text-sm text-muted-foreground">Memeriksa koneksi Supabase...</p>
      </div>
    )
  }

  if (!status) {
    return null
  }

  const formatted = formatConnectionStatus(status)

  return (
    <div className={`p-4 rounded-xl border ${status.connected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${status.connected ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
        <p className={`text-xs font-bold ${status.connected ? 'text-emerald-500' : 'text-rose-500'}`}>
          {status.connected ? 'Supabase: Connected' : 'Supabase: Disconnected'}
        </p>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2">{formatted.message}</p>
      
      {status.connected && status.user && (
        <p className="text-xs text-muted-foreground">
          User: {status.user.email}
        </p>
      )}
      
      {!status.connected && status.details && (
        <div className="mt-2 space-y-1">
          {!status.details.hasUrl && (
            <p className="text-xs text-rose-500">⚠️ NEXT_PUBLIC_SUPABASE_URL tidak terdefinisi</p>
          )}
          {!status.details.hasKey && (
            <p className="text-xs text-rose-500">⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY tidak terdefinisi</p>
          )}
        </div>
      )}
    </div>
  )
}
