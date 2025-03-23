// db-init.ts
// This script initializes the database schema directly using drizzle-orm

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./shared/schema.js";
import { sql } from "drizzle-orm";

// Check for DATABASE_URL environment variable
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

async function main() {
  console.log("Initializing database...");

  // Connect to the database
  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });

  try {
    console.log("Creating tables...");
    
    // Users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        first_name TEXT,
        last_name TEXT,
        bio TEXT,
        headline TEXT,
        profile_image_url TEXT,
        activity_pub_id TEXT UNIQUE,
        actor_url TEXT,
        inbox_url TEXT,
        outbox_url TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Work experiences table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS work_experiences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company TEXT NOT NULL,
        title TEXT NOT NULL,
        location TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        current BOOLEAN DEFAULT FALSE,
        description TEXT
      )
    `);
    
    // Educations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS educations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        school TEXT NOT NULL,
        degree TEXT,
        field TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        current BOOLEAN DEFAULT FALSE,
        description TEXT
      )
    `);
    
    // Skills table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      )
    `);
    
    // User skills table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_skills (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        endorsements INTEGER DEFAULT 0,
        UNIQUE(user_id, skill_id)
      )
    `);
    
    // Categories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT
      )
    `);
    
    // Services table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        price TEXT,
        location TEXT,
        remote BOOLEAN DEFAULT FALSE,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Posts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        media_url TEXT,
        activity_id TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Comments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Reactions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(post_id, user_id)
      )
    `);
    
    // Instances table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS instances (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        logo TEXT,
        domain TEXT UNIQUE,
        admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        registration_type TEXT DEFAULT 'open',
        content_moderation JSONB DEFAULT '{}',
        required_fields JSONB DEFAULT '{}',
        federation_rules JSONB DEFAULT '{}',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Federated instances table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS federated_instances (
        id SERIAL PRIMARY KEY,
        instance_id INTEGER NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
        fed_with_instance_id INTEGER NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(instance_id, fed_with_instance_id)
      )
    `);
    
    // Activities table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        instance_id INTEGER NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
        actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        object_id TEXT,
        target_id TEXT,
        payload JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Session table for connect-pg-simple
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    
    console.log("Database initialization completed successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    // Close the database connection
    await client.end();
  }
}

main().catch(console.error);