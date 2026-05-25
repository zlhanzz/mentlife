// Supabase Health Check Utility
// Gunakan untuk memverifikasi koneksi Supabase di awal aplikasi

import { createBrowserClient } from '@supabase/ssr'

export async function checkSupabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      connected: false,
      error: 'Missing environment variables',
      details: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      },
    }
  }

  try {
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
    
    // Test connection dengan ping ke auth endpoint
    const response = await supabase.auth.getUser()
    
    if (response.error) {
      return {
        connected: false,
        error: response.error.message,
        details: {
          status: response.error.name,
          hasUrl: true,
          hasKey: true,
        },
      }
    }

    return {
      connected: true,
      user: response.data?.user || null,
      details: {
        hasUrl: true,
        hasKey: true,
      },
    }
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Unknown error',
      details: {
        hasUrl: true,
        hasKey: true,
      },
    }
  }
}

// Helper untuk menampilkan status koneksi
export function formatConnectionStatus(status: Awaited<ReturnType<typeof checkSupabaseConnection>>) {
  if (status.connected) {
    return {
      status: 'connected',
      message: 'Supabase terhubung successfully',
      user: status.user?.email || 'No user',
    }
  }

  return {
    status: 'disconnected',
    message: `Koneksi gagal: ${status.error}`,
    details: status.details,
  }
}
