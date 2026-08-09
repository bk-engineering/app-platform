"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { login } from "@/lib/auth";

const LoginFormSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});
type LoginForm = z.infer<typeof LoginFormSchema>;

export default function LoginPage() {
  const t = useTranslations("LoginPage");
  const router = useRouter();
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
      router.push("/");
    } catch (error) {
      if (error instanceof ApiError && error.code === "AUTH_TOKEN_INVALID") {
        setFormError(t("invalidCredentials"));
      } else {
        setFormError(t("genericError"));
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-sm flex-col gap-4"
        noValidate
      >
        <h1 className="text-2xl font-semibold">{t("title")}</h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            {t("email")}
          </label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            {t("password")}
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>
    </main>
  );
}
