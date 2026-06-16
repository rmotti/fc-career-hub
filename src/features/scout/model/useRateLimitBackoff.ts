import { useEffect, useState } from "react";
import { ApiError } from "@/shared/api/client";

// Surfaces a rate-limit (429) backoff countdown from a React Query error, the
// same way the chat does for its own 429s (useJuniorChat). Since the QueryClient
// no longer auto-retries 4xx, a 429 error stays put until the user retries — so
// we can read ApiError.retryAfter off it and tick a countdown down to zero.
export function useRateLimitBackoff(error: unknown) {
  const isRateLimited = error instanceof ApiError && error.status === 429;
  const retryAfter = isRateLimited
    ? Number.isFinite(error.retryAfter) && (error.retryAfter ?? 0) > 0
      ? error.retryAfter!
      : 60
    : null;

  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);

  // Re-arm the countdown whenever a fresh rate-limit error arrives (React Query
  // hands us a new error instance per failed fetch), and clear it once the query
  // succeeds and the error goes away.
  useEffect(() => {
    setRetryAfterSeconds(retryAfter);
  }, [error, retryAfter]);

  useEffect(() => {
    if (retryAfterSeconds === null || retryAfterSeconds <= 0) return;
    const timer = setInterval(() => {
      setRetryAfterSeconds((prev) => (prev === null || prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfterSeconds]);

  return {
    isRateLimited,
    retryAfterSeconds,
  };
}
