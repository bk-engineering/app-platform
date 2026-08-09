import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { ErrorEnvelopeSchema, TokenResponseSchema, type ErrorEnvelope } from "@app-platform/contracts";
import { clearSession, getSession, setSession } from "./session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://api.localhost";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly traceId: string;
  readonly details: ErrorEnvelope["details"];

  constructor(status: number, envelope: ErrorEnvelope) {
    super(envelope.message);
    this.name = "ApiError";
    this.status = status;
    this.code = envelope.code;
    this.traceId = envelope.traceId;
    this.details = envelope.details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** skip attaching the access token, e.g. for the token endpoint itself */
  skipAuth?: boolean;
  /** skip the 401 -> refresh -> retry dance, e.g. for the refresh request itself */
  skipRefresh?: boolean;
}

// single-flight: concurrent 401s share one refresh instead of each racing the rotation
let refreshInFlight: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function doRefresh(): Promise<void> {
  const current = getSession();
  if (!current) throw new ApiError(401, unauthenticatedEnvelope());

  const tokens = await request("/auth/token", TokenResponseSchema, {
    method: "POST",
    body: { grant_type: "refresh_token", refresh_token: current.refreshToken },
    skipAuth: true,
    skipRefresh: true,
  });
  setSession(tokens);
}

function unauthenticatedEnvelope(): ErrorEnvelope {
  return {
    code: "AUTH_TOKEN_INVALID",
    message: "Not authenticated",
    traceId: "no-trace",
    timestamp: new Date().toISOString(),
    path: "",
    details: [],
  };
}

export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const traceId = uuidv7();
  const session = options.skipAuth ? null : getSession();

  const isFormEncoded = path === "/auth/token";
  const headers: Record<string, string> = {
    "x-request-id": traceId,
    ...(isFormEncoded
      ? { "content-type": "application/x-www-form-urlencoded" }
      : options.body !== undefined
        ? { "content-type": "application/json" }
        : {}),
  };
  if (session) headers.authorization = `Bearer ${session.accessToken}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body:
      options.body === undefined
        ? undefined
        : isFormEncoded
          ? new URLSearchParams(options.body as Record<string, string>)
          : JSON.stringify(options.body),
  });

  if (res.status === 401 && !options.skipRefresh) {
    await refreshAccessToken();
    return request(path, schema, { ...options, skipRefresh: true });
  }

  const body = await res.json();

  if (!res.ok) {
    if (res.status === 401) clearSession();
    const envelope = ErrorEnvelopeSchema.parse(body);
    throw new ApiError(res.status, envelope);
  }

  return schema.parse(body);
}
