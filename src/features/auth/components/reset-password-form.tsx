"use client";

import { useActionState, startTransition } from "react";
import { resetPasswordAction, AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

const initialState: AuthState = {
  success: false,
  message: "",
};

export default function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);
  const t = useTranslations("auth.resetPassword");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  // Success state — redirect to login
  if (state?.success) {
    return (
      <div className="w-full max-w-md px-4 flex flex-col justify-center min-h-screen">
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl rounded-3xl text-center">
          <CardHeader className="space-y-3 flex flex-col items-center pt-8">
            <div className="bg-emerald-500/10 p-3 rounded-full text-emerald-500">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">{t("successTitle")}</CardTitle>
            <CardDescription className="text-muted-foreground text-sm max-w-xs">
              {state.message}
            </CardDescription>
          </CardHeader>
          <CardFooter className="pb-8 justify-center">
            <Link href="/login" className="w-full max-w-xs">
              <Button className="w-full h-12 rounded-xl font-semibold">
                {t("goToLogin")}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
              {t("desc")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {state?.message && !state.success && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium">
                {state.message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("newPassword")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="pl-11 h-12 rounded-xl border-border/60 bg-background/40 focus:bg-background/80 transition-all"
                />
              </div>
              {state?.errors?.password && (
                <p className="text-xs text-destructive font-medium">{state.errors.password[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("confirmPassword")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="pl-11 h-12 rounded-xl border-border/60 bg-background/40 focus:bg-background/80 transition-all"
                />
              </div>
              {state?.errors?.confirmPassword && (
                <p className="text-xs text-destructive font-medium">{state.errors.confirmPassword[0]}</p>
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
                  {t("saving")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pb-8 justify-center">
          <p className="text-sm text-muted-foreground">
            {t("rememberPassword")}{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t("signIn")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
