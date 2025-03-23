import { drizzle } from "drizzle-orm/neon-serverless";
import { neon, Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// Create a connection pool for SQL client queries
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create a serverless SQL client for drizzle ORM
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql);

// Export a client object with a query method for session store
export const client = {
  query: (...args: any[]) => pool.query(...args)
};
