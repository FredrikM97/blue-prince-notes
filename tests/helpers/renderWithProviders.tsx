import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { RootLayoutView } from "@/router";

/**
 * Creates a QueryClient configured for deterministic tests.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/**
 * Renders the app root layout with a test QueryClient.
 */
export function renderRootLayoutWithProviders() {
  const queryClient = createTestQueryClient();
  return {
    queryClient,
    ...render(<RootLayoutView queryClient={queryClient} />),
  };
}
