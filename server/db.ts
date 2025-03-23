import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import pg from "pg";
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// Create a connection pool for SQL client queries
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create a SQL client for drizzle ORM using postgres-js (No WebSocket needed)
const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client);

// Export a client object with a query method for session store
export const pgClient = pool;
