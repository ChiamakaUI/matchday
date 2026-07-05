import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

let _pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: env().DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    _pool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
    });
  }
  return _pool;
}

/**
 * Convenience wrapper: converts snake_case DB rows to camelCase.
 * PgTyped returns snake_case column names; this avoids manual mapping everywhere.
 */
export function camelizeKeys<T extends object>(
  row: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    result[camel] = value;
  }
  return result;
}

export function camelizeRows<T extends object>(
  rows: T[],
): Record<string, unknown>[] {
  return rows.map(camelizeKeys);
}