import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL nao definida. Em desenvolvimento, copie .env.example para .env.local.'
  );
}

export const sql = neon(process.env.DATABASE_URL);
