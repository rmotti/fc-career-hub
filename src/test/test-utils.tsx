import { type ReactElement, type ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * A QueryClient tuned for tests: no retries and no caching between tests so
 * mutations/queries resolve deterministically and don't leak across cases.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

/** Wrapper providing a React Query client — for `renderHook` of data hooks. */
export function createQueryWrapper(client: QueryClient = createTestQueryClient()) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return { client, Wrapper };
}

/** Render a component wrapped in a React Query provider. */
export function renderWithProviders(
  ui: ReactElement,
  options: { client?: QueryClient } & Omit<RenderOptions, "wrapper"> = {},
) {
  const { client, ...renderOptions } = options;
  const { client: usedClient, Wrapper } = createQueryWrapper(client);

  return { client: usedClient, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
