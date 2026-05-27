import process from "node:process";

// Server-only config accessors. Keep env reads inside functions so values
// resolve correctly in request-scoped runtimes.
export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    // Add server-only values here, e.g.:
    // databaseUrl: process.env.DATABASE_URL,
    // stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  };
}
