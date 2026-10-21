import fs from 'fs';
import path from 'path';
import { pool, query } from './index';

export const runMigrations = async (): Promise<void> => {
  try {
    console.log('[DB Migration] Starting migration...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await query(schemaSql);
    console.log('[DB Migration] Migration completed successfully.');
  } catch (error) {
    console.error('[DB Migration] Migration failed:', error);
    throw error;
  }
};

// Run automatically if invoked via CLI
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('[DB Migration] Done.');
      pool.end();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DB Migration] Error:', err);
      pool.end();
      process.exit(1);
    });
}
