import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
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
    setupFiles: "./tests/setup.ts",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
