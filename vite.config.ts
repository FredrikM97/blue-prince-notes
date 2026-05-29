import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    tailwindcss(),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      spa: {
        enabled: true,
        prerender: {
          outputPath: "/index",
        },
      },
      // Keep the server runtime entry for prerendering the SPA shell at build time.
      server: { entry: "server" },
    }),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  server: { host: "::", port: 8080 },
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.tsx",
    globals: true,
    include: ["tests/**/*.test.tsx"],
    exclude: ["tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["**/*.css"],
    },
  },
});
