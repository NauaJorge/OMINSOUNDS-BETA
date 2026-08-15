// Zera as conversas, mantendo contas e catalogo.
//   node --env-file=.env.local scripts/limpar-conversas.mjs
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const [{ c }] = await sql`SELECT count(*)::int AS c FROM conversas`;
await sql`DELETE FROM conversas`;
const [{ u }] = await sql`SELECT count(*)::int AS u FROM usuarios`;
const [{ b }] = await sql`SELECT count(*)::int AS b FROM beats`;

console.log(`conversas removidas: ${c}`);
console.log(`usuarios: ${u} | beats: ${b}`);
