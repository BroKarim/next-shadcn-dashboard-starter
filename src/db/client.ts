import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// Direct local connection, no pooler (task_plan.md D3).
const client = postgres(connectionString);

export const db = drizzle(client, { schema });
