import app from './app';
import { config } from './config';
import { runMigrations } from './db/migrate';
import { pool } from './db';

const startServer = async () => {
  try {
    // Automatically ensure tables exist on startup
    console.log('[MiniLedger] Checking database connectivity and schema...');
    await runMigrations();

    const server = app.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 MiniLedger Backend Server is running!`);
      console.log(`📍 URL: http://localhost:${config.port}`);
      console.log(`📋 Health check: http://localhost:${config.port}/health`);
      console.log(`🔒 Mode: ${config.nodeEnv}`);
      console.log(`💾 PostgreSQL: ${config.db.host}:${config.db.port}/${config.db.name}`);
      console.log(`======================================================\n`);
    });

    const shutdown = async () => {
      console.log('\n[MiniLedger] Gracefully shutting down...');
      server.close(async () => {
        await pool.end();
        console.log('[MiniLedger] Server and DB pool closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[MiniLedger] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
