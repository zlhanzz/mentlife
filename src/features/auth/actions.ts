"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "./schemas";
import { redirect } from "next/navigation";
import { z } from "zod";

export type AuthState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  redirectTo?: string;
};

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

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
    let msg = error.message;
    if (error.message.includes("Invalid login credentials")) {
      msg = "Email atau password salah. Periksa kembali dan coba lagi.";
    } else if (error.message.includes("Email not confirmed")) {
      msg = "Email belum dikonfirmasi. Silakan cek inbox Anda dan klik link konfirmasi yang telah kami kirimkan.";
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
      emailRedirectTo: `${getSiteUrl()}/auth/callback?type=signup`,
    },
  });

  if (error) {
    let msg = error.message;
    if (error.message.includes("already registered")) {
      msg = "Email ini sudah terdaftar. Silakan gunakan email lain atau login dengan akun yang sudah ada.";
    }
    return {
      success: false,
      message: msg,
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

// ─── Forgot Password ───────────────────────────────────────────────────────────

const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export async function forgotPasswordAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = formData.get("email") as string;

  const validated = forgotPasswordSchema.safeParse({ email });
  if (!validated.success) {
    return {
      success: false,
      message: "Format email tidak valid.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/callback?type=recovery`,
  });

  if (error) {
    return {
      success: false,
      message: error.message.includes("not found")
        ? "Email ini belum terdaftar di sistem kami."
        : `Gagal mengirim link reset: ${error.message}`,
    };
  }

  return {
    success: true,
    message: "Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.",
  };
}

// ─── Reset Password ────────────────────────────────────────────────────────────

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export async function resetPasswordAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const validated = resetPasswordSchema.safeParse({ password, confirmPassword });
  if (!validated.success) {
    return {
      success: false,
      message: "Validasi gagal.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      success: false,
      message: error.message.includes("same password")
        ? "Password baru harus berbeda dari password sebelumnya."
        : `Gagal mengubah password: ${error.message}`,
    };
  }

  return {
    success: true,
    message: "Password berhasil diubah! Anda sekarang bisa login dengan password baru.",
  };
}

// ─── Google OAuth Actions ──────────────────────────────────────────────────────

export async function loginWithGoogleAction(): Promise<never> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("Google login error:", error);
    redirect("/login?error=google_failed");
  }

  redirect(data.url);
}

export async function registerWithGoogleAction(): Promise<never> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("Google register error:", error);
    redirect("/register?error=google_failed");
  }

  redirect(data.url);
}
