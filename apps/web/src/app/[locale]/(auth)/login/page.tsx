"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Command } from "lucide-react";
import { useRouter } from "@/core/i18n";
import { Button } from "@/core/ui";
import { Input } from "@/core/ui";
import { Field, FieldError } from "@/core/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/ui";
import { ApiError } from "@/core/api-client";
import { login } from "@/core/auth";

const LoginFormSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});
type LoginForm = z.infer<typeof LoginFormSchema>;

export default function LoginPage() {
  const t = useTranslations("LoginPage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(LoginFormSchema) });

  const onSubmit = async (data: LoginForm) => {
    setFormError(null);
    try {
      await login(data.email, data.password);
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") ? next : "/dashboard");
    } catch (error) {
      if (error instanceof ApiError && error.code === "AUTH_TOKEN_INVALID") {
        setFormError(t("invalidCredentials"));
      } else {
        setFormError(t("genericError"));
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Command className="size-4" />
        </div>
        <span className="text-lg font-semibold">app-platform</span>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Field label={t("email")} htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
            </Field>

            <Field label={t("password")} htmlFor="password" error={errors.password?.message}>
              <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            </Field>

            {formError && <FieldError>{formError}</FieldError>}

            <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
