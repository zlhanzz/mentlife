"use client";

import { useActionState, startTransition } from "react";
import { loginAction, loginWithGoogleAction, AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Lock, Mail, Loader2 } from "lucide-react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

const initialState: AuthState = {
  success: false,
  message: "",
};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const t = useTranslations("auth.login");
  const tCommon = useTranslations("common");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="w-full max-w-md px-4 flex flex-col justify-center min-h-screen">
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl rounded-3xl">
        <CardHeader className="space-y-3 flex flex-col items-center pt-8">
          <div className="bg-primary/10 p-2.5 rounded-2xl ring-1 ring-primary/20">
            <BrainCircuit className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">{t("title")}</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              {tCommon("signInDesc")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Google Login Button */}
          <form action={loginWithGoogleAction} className="mb-4">
            <Button
              type="submit"
              variant="outline"
              className="w-full h-12 rounded-xl font-semibold border-border/60 hover:bg-muted/50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  className="text-[#4285F4]"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  className="text-[#34A853]"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  className="text-[#FBBC05]"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                  className="text-[#EA4335]"
                />
              </svg>
              {t("google")}
            </Button>
          </form>

          <div className="relative flex items-center justify-center mb-4">
            <div className="flex-1 border-t border-border/30"></div>
            <span className="px-3 text-xs text-muted-foreground uppercase font-semibold">{tCommon("or")}</span>
            <div className="flex-1 border-t border-border/30"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {state?.message && !state.success && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium">
                {state.message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("email")}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="pl-11 h-12 rounded-xl border-border/60 bg-background/40 focus:bg-background/80 transition-all"
                />
              </div>
              {state?.errors?.email && (
                <p className="text-xs text-destructive font-medium">{state.errors.email[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("password")}
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {t("forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="pl-11 h-12 rounded-xl border-border/60 bg-background/40 focus:bg-background/80 transition-all"
                />
              </div>
              {state?.errors?.password && (
                <p className="text-xs text-destructive font-medium">{state.errors.password[0]}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 rounded-xl font-semibold mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {tCommon("loading")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pb-8 justify-center">
          <p className="text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              {t("signUp")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
