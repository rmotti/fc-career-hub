import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { Toaster as Sonner } from "@/shared/ui/sonner";
import { AuthProvider } from "@/features/auth/model/AuthContext";
import { ApiError } from "@/shared/api/client";
import type { ReactNode } from "react";

// React Query's default is 3 blind retries. That's wrong for 4xx responses:
// a 429 must honor its Retry-After (re-firing immediately makes rate limiting
// worse), and a 403 will never succeed on retry. Only retry transient failures
// — 5xx and network errors — keeping the same 3-attempt budget for those.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && typeof error.status === "number") {
          if (error.status >= 400 && error.status < 500) return false;
        }
        return failureCount < 3;
      },
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          {children}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
