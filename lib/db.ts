import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add a Postgres connection string in your environment variables."
    );
  }
  return new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=disable")
      ? false
      : { rejectUnauthorized: false },
  });
}

// Lazily create the pool on first real use, so simply importing this module
// (e.g. during Next.js's build-time route analysis, before env vars exist)
// never throws. The pool is reused across hot-reloads / serverless invocations.
function getPool(): Pool {
  if (!global.__pgPool) {
    global.__pgPool = createPool();
  }
  return global.__pgPool;
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const real = getPool();
    // @ts-expect-error - dynamic proxy forwarding
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

