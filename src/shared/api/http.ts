// Core HTTP layer shared by every API module: base-URL resolution, the `request`
// helper, error shaping, the 401/403 handlers, and CSRF handling. Resource
// modules under `./modules/*` import `request` (and the small query helpers)
// from here; the public surface is re-exported through `./client`.

// Same-origin API path used when VITE_API_URL is unset. The session cookie the
// API sets is httpOnly and must survive reloads, but when the SPA and the API
// live on different registrable domains the cookie is *cross-site* — Safari's
// ITP (and tightening third-party-cookie rules in other browsers) then cap or
// drop it, so the session silently dies. Routing requests through the SPA's own
// origin makes the cookie first-party, which sidesteps ITP entirely. The
// platform forwards "/api/*" to the real backend: a Vercel rewrite in
// production (see vercel.json) and the Vite dev proxy locally (see
// vite.config.ts).
const SAME_ORIGIN_API_PATH = "/api";

// Absolute fallback host, used only under the test runner, which has no origin
// to resolve a relative URL against.
const DEFAULT_API_URL = "https://ample-love-production.up.railway.app";

export function resolveBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();

  // Explicit value. Accepts both a relative same-origin path ("/api") and an
  // absolute URL ("https://host"); the latter is the cross-site escape hatch for
  // setups without a same-origin proxy. The "/api" suffix is appended if missing.
  if (configured) {
    const normalized = configured.replace(/\/+$/, "");
    return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
  }

  // Unset: default to a same-origin "/api" path in the browser, but fall back to
  // the absolute host under the test runner (relative URLs have no base there).
  return import.meta.env.MODE === "test"
    ? `${DEFAULT_API_URL}/api`
    : SAME_ORIGIN_API_PATH;
}

const BASE_URL = resolveBaseUrl();

let unauthorizedHandler: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

let forbiddenHandler: (() => void) | null = null;

export function registerForbiddenHandler(handler: (() => void) | null) {
  forbiddenHandler = handler;
}

// Endpoints that live behind a paid plan. A 403 from one of these means the
// session was downgraded to FREE mid-flight (the route guard gates on the
// locally-cached plan, which can be stale), so we route the user to /pricing
// instead of showing a dead-end permission error. A 403 from any other path is
// a genuine resource-permission error and keeps its normal generic handling.
//
// Prefix-matched roots. "/scout" also covers "/scouting" and "/scout/*" by design.
const PRO_FEATURE_PREFIXES = ["/fc26-players", "/scout", "/chat"];
// PRO sub-resources nested under /saves/:saveId/... — matched by path segment so we
// gate only these, not the whole (non-PRO) /saves tree (players, transfers, trophies,
// team-stats, club-stints, snapshots, … all live under /saves and must NOT redirect).
const PRO_FEATURE_SEGMENTS = ["shortlist", "saved-searches"];

export function isProFeaturePath(path: string): boolean {
  const pathname = path.split("?")[0];
  if (PRO_FEATURE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  const segments = pathname.split("/");
  return PRO_FEATURE_SEGMENTS.some((segment) => segments.includes(segment));
}

// The session token lives in an httpOnly cookie, so the SPA can't read the
// matching csrf cookie via document.cookie. Instead it keeps the CSRF token in
// memory (from the sign-in body or GET /auth/csrf) and echoes it back in the
// X-CSRF-Token header on writes (double-submit).
let inMemoryCsrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  inMemoryCsrfToken = token;
}

export function clearCsrfToken() {
  inMemoryCsrfToken = null;
}

// Read-only access to the in-memory CSRF token, for callers (e.g. the SSE
// streaming consumer) that issue their own `fetch` outside `request`.
export function getCsrfToken(): string | null {
  return inMemoryCsrfToken;
}

// Ensures a CSRF token is available before a manual (non-`request`) write such
// as the SSE stream POST. Mirrors what `request` does internally for mutations.
export async function ensureCsrfTokenForStream(): Promise<void> {
  await ensureCsrfToken();
}

export class ApiError extends Error {
  status?: number;
  data?: any;
  isNetworkError?: boolean;
  retryAfter?: number;
  retriesExhausted?: boolean;

  constructor(
    message: string,
    status?: number,
    data?: any,
    isNetworkError?: boolean,
    retryAfter?: number,
    retriesExhausted?: boolean,
  ) {
    super(message);
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
    this.retryAfter = retryAfter;
    this.retriesExhausted = retriesExhausted;
    this.name = "ApiError";
  }
}

export function extractErrorMessage(err: any): string {
  if (err?.isNetworkError || err?.message === "Failed to fetch" || err?.message?.includes("NetworkError")) {
    return "Could not connect to the server. Check your connection.";
  }

  if (err?.data?.error === "SHIRT_NUMBER_CONFLICT") {
    return err.data.message;
  }

  if (err?.data?.error === "SERVICE_UNAVAILABLE") {
    return err.data.message || "Service temporarily unavailable. Try again in a moment.";
  }

  // Standardized API errors: { error, statusCode, code? }.
  if (err?.data?.code === "DELETE_CONFIRMATION_REQUIRED") {
    return "Delete confirmation is required. Please try again.";
  }

  const status = err?.status || err?.response?.status;
  const apiError = err?.data?.error || err?.response?.data?.error;

  if (status === 400) return apiError || err.message || "Invalid data. Check the information and try again.";
  if (status === 401) return apiError || err.message || "Session expired. Please sign in again.";
  if (status === 403) return apiError || err.message || "You don't have permission to perform this action.";
  if (status === 404) return apiError || err.message || "Resource not found.";
  if (status === 409) return apiError || err.message || "Conflict while saving data. Try again.";
  if (status === 503) return "Service temporarily unavailable. Try again in a moment.";
  if (status >= 500) return "Internal error. Try again in a moment.";

  return apiError || err?.message || "Unexpected error. Try again.";
}

const CSRF_EXEMPT_PREFIXES = ["/auth/sign-in", "/auth/sign-up"];
const NON_MUTATING_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Returns the delay in ms for a retry attempt. Respects Retry-After (seconds);
// falls back to exponential backoff: 1 s → 2 s → 4 s.
function retryDelayMs(attempt: number, retryAfterHeader: string | null): number {
  const secs = retryAfterHeader !== null ? parseInt(retryAfterHeader, 10) : NaN;
  if (!isNaN(secs) && secs > 0) return secs * 1000;
  return 1000 * Math.pow(2, attempt);
}

type RetryNotification = (info: { status: number; attempt: number; delayMs: number }) => void;
let onRetry: RetryNotification | null = null;

// Register a callback to be notified when a 503 retry is about to happen.
// The callback receives the HTTP status, which retry attempt (0-indexed), and
// the delay in ms. Intended for UI toasts ("instability, retrying in Xs…").
export function registerRetryHandler(handler: RetryNotification | null) {
  onRetry = handler;
}

// Lazily fetch a CSRF token (e.g. after a reload, when the in-memory token was
// lost but the session cookie persists). GET /auth/csrf is itself exempt, so
// this never recurses.
async function ensureCsrfToken() {
  if (inMemoryCsrfToken) return;
  try {
    const res = await request<{ csrfToken: string }>("/auth/csrf");
    inMemoryCsrfToken = res.csrfToken;
  } catch {
    // Leave it unset; the write will be rejected and the error surfaces normally.
  }
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  const needsCsrf =
    !NON_MUTATING_METHODS.has(method) &&
    !CSRF_EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (needsCsrf) {
    await ensureCsrfToken();
  }

  // 503 retries: up to 2 retries (3 total attempts) for all methods. The backend
  // guarantees that a 503 means the write was NOT applied, so retrying is safe
  // even for mutations. Retry-After header is respected; falls back to exponential.
  const MAX_503_RETRIES = 2;
  let attempt503 = 0;

  while (true) {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(needsCsrf && inMemoryCsrfToken ? { "X-CSRF-Token": inMemoryCsrfToken } : {}),
          ...options?.headers,
        },
      });
    } catch (err: any) {
      throw new ApiError(err.message, undefined, undefined, true);
    }

    if (res.ok) {
      if (res.status === 204) return undefined as T;
      return res.json();
    }

    if (res.status === 503 && attempt503 < MAX_503_RETRIES) {
      const delayMs = retryDelayMs(attempt503, res.headers.get("Retry-After"));
      onRetry?.({ status: 503, attempt: attempt503, delayMs });
      attempt503++;
      await sleep(delayMs);
      continue;
    }

    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    const retryAfter = res.status === 429
      ? parseInt(res.headers.get("Retry-After") ?? "60", 10)
      : undefined;
    const retriesExhausted = res.status === 503 && attempt503 >= MAX_503_RETRIES;

    if (
      res.status === 401 &&
      !path.startsWith("/auth/sign-in") &&
      !path.startsWith("/auth/sign-up") &&
      // GET /auth/session now answers 401 when unauthenticated. That's the probe
      // we use to learn we're logged out — handling it here would just re-enter
      // the same clearSession the caller already runs, so let the caller decide.
      !path.startsWith("/auth/session")
    ) {
      unauthorizedHandler?.();
    }
    if (res.status === 403 && isProFeaturePath(path)) {
      forbiddenHandler?.();
    }

    throw new ApiError(
      err.error || `HTTP ${res.status}`,
      res.status,
      err,
      false,
      retryAfter,
      retriesExhausted,
    );
  }
}

// ─── Shared querystring helpers ─────────────────────────────────────

export function appendNumberParam(params: URLSearchParams, key: string, value: number | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    params.set(key, String(value));
  }
}

export function appendCsvParam(params: URLSearchParams, key: string, values: readonly string[] | undefined) {
  const normalizedValues = values?.map((value) => value.trim()).filter(Boolean);
  if (normalizedValues?.length) {
    params.set(key, normalizedValues.join(","));
  }
}
