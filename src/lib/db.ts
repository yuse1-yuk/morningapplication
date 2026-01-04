import { Pool } from "pg";

const databaseUrl = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse the pool across hot reloads in dev
const globalForDb = globalThis as unknown as { pgPool?: Pool };
const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

if (!globalForDb.pgPool) {
  globalForDb.pgPool = pool;
}

const ready = runMigrations();

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      target_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS news_keywords (
      id SERIAL PRIMARY KEY,
      keyword TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export type TodoRecord = {
  id: number;
  text: string;
  target_date: string;
  created_at: string;
};

export type KeywordRecord = {
  id: number;
  keyword: string;
  created_at: string;
};

function toDateString(date: Date | string | null | undefined) {
  if (!date) return "";
  if (date instanceof Date) return date.toISOString().slice(0, 10);
  return date.toString().slice(0, 10);
}

export async function listTodos(fromDate: string): Promise<TodoRecord[]> {
  await ready;
  const { rows } = await pool.query(
    `SELECT id, text, target_date, created_at
     FROM todos
     WHERE target_date >= $1::date
     ORDER BY target_date, id`,
    [fromDate]
  );
  return rows.map((row: any) => ({
    id: row.id,
    text: row.text,
    target_date: toDateString(row.target_date),
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
  }));
}

export async function listTodosByDate(date: string): Promise<TodoRecord[]> {
  await ready;
  const { rows } = await pool.query(
    `SELECT id, text, target_date, created_at
     FROM todos
     WHERE target_date = $1::date
     ORDER BY id`,
    [date]
  );
  return rows.map((row: any) => ({
    id: row.id,
    text: row.text,
    target_date: toDateString(row.target_date),
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
  }));
}

export async function addTodo(
  text: string,
  targetDate: string
): Promise<TodoRecord> {
  await ready;
  const { rows } = await pool.query(
    `INSERT INTO todos (text, target_date)
     VALUES ($1, $2::date)
     RETURNING id, text, target_date, created_at`,
    [text, targetDate]
  );
  const row = rows[0] as any;
  return {
    id: row.id,
    text: row.text,
    target_date: toDateString(row.target_date),
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
  };
}

export async function deleteTodo(id: number): Promise<void> {
  await ready;
  await pool.query(`DELETE FROM todos WHERE id = $1`, [id]);
}

export async function listKeywords(): Promise<KeywordRecord[]> {
  await ready;
  const { rows } = await pool.query(
    `SELECT id, keyword, created_at
     FROM news_keywords
     ORDER BY created_at DESC
     LIMIT 50`
  );
  return rows.map((row: any) => ({
    id: row.id,
    keyword: row.keyword,
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
  }));
}

export async function addKeyword(keyword: string): Promise<KeywordRecord> {
  await ready;
  const { rows } = await pool.query(
    `INSERT INTO news_keywords (keyword)
     VALUES ($1)
     ON CONFLICT (keyword) DO NOTHING
     RETURNING id, keyword, created_at`,
    [keyword]
  );

  const row =
    (rows[0] as any) ??
    (
      await pool.query(
        `SELECT id, keyword, created_at FROM news_keywords WHERE keyword = $1`,
        [keyword]
      )
    ).rows[0];

  return {
    id: row.id,
    keyword: row.keyword,
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
  };
}

export async function deleteKeyword(id: number): Promise<void> {
  await ready;
  await pool.query(`DELETE FROM news_keywords WHERE id = $1`, [id]);
}
