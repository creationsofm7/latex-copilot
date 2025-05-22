// src/db/drizzle.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../lib/auth-schema';

const sql = neon(process.env.DATABASE_URL!); // Ensure DATABASE_URL is set in your environment variables

export const db = drizzle(sql, { schema });
