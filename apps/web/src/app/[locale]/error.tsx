"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { v7 as uuidv7 } from "uuid";
import { Button } from "@/core/ui";
import { env } from "@/core/api-client";

const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

function reportClientError(error: Error & { digest?: string }) {
  const traceId = uuidv7();
  void fetch(`${API_BASE_URL}/v1/client-errors`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-request-id": traceId },
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      traceId,
    }),
    // best-effort — never let error reporting itself surface an error to the user
  }).catch(() => {});
}

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorPage");

  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <main
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <Button onClick={reset}>{t("retry")}</Button>
    </main>
  );
}
