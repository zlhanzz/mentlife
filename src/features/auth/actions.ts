"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "./schemas";
import { redirect } from "next/navigation";

export type AuthState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  redirectTo?: string;
};

export async function loginAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validation
  const validatedFields = loginSchema.safeParse({ email, password });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validasi gagal, periksa kembali email dan password.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Provide a friendlier error message in Indonesian
    let msg = error.message;
    if (error.message.includes("Invalid login credentials")) {
      msg = "Email atau password salah. Periksa kembali dan coba lagi.";
    } else if (error.message.includes("Email not confirmed")) {
      msg = "Email belum dikonfirmasi. Silakan cek inbox dan klik link konfirmasi, atau nonaktifkan email confirmation di Supabase Dashboard.";
    }
    return {
      success: false,
      message: msg,
    };
  }

  redirect("/dashboard");
}

export async function signupAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validation
  const validatedFields = registerSchema.safeParse({
    fullName,
    email,
    password,
    confirmPassword,
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validasi gagal, periksa kembali data yang diisi.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  // If session is immediately available (email confirmation disabled), redirect to onboarding
  if (data.session) {
    redirect("/onboarding");
  }

  // Otherwise, email confirmation is required
  return {
    success: true,
    message: "Pendaftaran berhasil! Silakan cek email Anda untuk mengkonfirmasi akun, lalu login.",
  };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Google OAuth Actions
export async function loginWithGoogleAction(): Promise<never> {
  const supabase = await createClient();
  
  // Redirect to Google OAuth
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  
  if (error) {
    console.error('Google login error:', error);
    redirect('/login?error=google_failed');
  }
  
  // Supabase will redirect to the callback URL
  redirect(data.url);
}

export async function registerWithGoogleAction(): Promise<never> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  
  if (error) {
    console.error('Google register error:', error);
    redirect('/register?error=google_failed');
  }
  
  redirect(data.url);
}
