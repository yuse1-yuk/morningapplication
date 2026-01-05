import { Pool } from "pg";

const databaseUrl = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;

// Lazily create pool so build does not crash when env is unset (e.g., local build without DB).
const globalForDb = globalThis as unknown as { pgPool?: Pool };
function getPool(): Pool {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForDb.pgPool) {
    globalForDb.pgPool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    });
  }
  return globalForDb.pgPool;
}

let readyPromise: Promise<void> | null = null;
function ready() {
  if (!readyPromise) {
    readyPromise = runMigrations();
  }
  return readyPromise;
}

async function runMigrations() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      target_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_email TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS news_keywords (
      id SERIAL PRIMARY KEY,
      keyword TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_email TEXT DEFAULT ''
    );

    ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_email TEXT DEFAULT '';
    ALTER TABLE news_keywords ADD COLUMN IF NOT EXISTS user_email TEXT DEFAULT '';
    UPDATE todos SET user_email = '' WHERE user_email IS NULL;
    UPDATE news_keywords SET user_email = '' WHERE user_email IS NULL;

    CREATE INDEX IF NOT EXISTS idx_todos_user_date ON todos (user_email, target_date);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_news_keywords_user_keyword ON news_keywords (user_email, keyword);
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

export async function listTodos(
  userEmail: string,
  fromDate: string
): Promise<TodoRecord[]> {
  await ready();
  const pool = getPool();
  const { rows } = await pool.query<{
    id: number;
    text: string;
    target_date: Date;
    created_at: Date;
  }>(
    `SELECT id, text, target_date, created_at
     FROM todos
     WHERE user_email = $1 AND target_date >= $2::date
     ORDER BY target_date, id`,
    [userEmail, fromDate]
  );
  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    target_date: toDateString(row.target_date),
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
  }));
}

export async function listTodosByDate(
  userEmail: string,
  date: string
): Promise<TodoRecord[]> {
  await ready();
  const pool = getPool();
  const { rows } = await pool.query<{
    id: number;
    text: string;
    target_date: Date;
    created_at: Date;
  }>(
    `SELECT id, text, target_date, created_at
     FROM todos
     WHERE user_email = $1 AND target_date = $2::date
     ORDER BY id`,
    [userEmail, date]
  );
  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    target_date: toDateString(row.target_date),
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
  }));
}

export async function addTodo(
  userEmail: string,
  text: string,
  targetDate: string
): Promise<TodoRecord> {
  await ready();
  const pool = getPool();
  const { rows } = await pool.query<{
    id: number;
    text: string;
    target_date: Date;
    created_at: Date;
  }>(
    `INSERT INTO todos (text, target_date, user_email)
     VALUES ($1, $2::date, $3)
     RETURNING id, text, target_date, created_at`,
    [text, targetDate, userEmail]
  );
  const row = rows[0];
  return {
    id: row.id,
    text: row.text,
    target_date: toDateString(row.target_date),
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
  };
}

export async function deleteTodo(
  userEmail: string,
  id: number
): Promise<void> {
  await ready();
  const pool = getPool();
  await pool.query(`DELETE FROM todos WHERE id = $1 AND user_email = $2`, [
    id,
    userEmail,
  ]);
}

export async function listKeywords(
  userEmail: string
): Promise<KeywordRecord[]> {
  await ready();
  const pool = getPool();
  const { rows } = await pool.query<{
    id: number;
    keyword: string;
    created_at: Date;
  }>(
    `SELECT id, keyword, created_at
     FROM news_keywords
     WHERE user_email = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [userEmail]
  );
  return rows.map((row) => ({
    id: row.id,
    keyword: row.keyword,
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
  }));
}

export async function addKeyword(
  userEmail: string,
  keyword: string
): Promise<KeywordRecord> {
  await ready();
  const pool = getPool();
  const { rows } = await pool.query<{
    id: number;
    keyword: string;
    created_at: Date;
  }>(
    `INSERT INTO news_keywords (keyword, user_email)
     VALUES ($1, $2)
     ON CONFLICT (user_email, keyword) DO NOTHING
     RETURNING id, keyword, created_at`,
    [keyword, userEmail]
  );

  const row =
    rows[0] ??
    (
      await pool.query<{
        id: number;
        keyword: string;
        created_at: Date;
      }>(
        `SELECT id, keyword, created_at FROM news_keywords WHERE keyword = $1 AND user_email = $2`,
        [keyword, userEmail]
      )
    ).rows[0];

  return {
    id: row.id,
    keyword: row.keyword,
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
  };
}

export async function deleteKeyword(
  userEmail: string,
  id: number
): Promise<void> {
  await ready();
  const pool = getPool();
  await pool.query(
    `DELETE FROM news_keywords WHERE id = $1 AND user_email = $2`,
    [id, userEmail]
  );
}
