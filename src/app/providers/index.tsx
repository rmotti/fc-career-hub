import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { Toaster as Sonner } from "@/shared/ui/sonner";
import { AuthProvider } from "@/features/auth/model/AuthContext";
import type { ReactNode } from "react";

const queryClient = new QueryClient();

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
