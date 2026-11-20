// server.js — entry point: checks the database connection, then starts listening.
import { env } from './config/env.js';
import app from './app.js';
import { testConnection } from './config/db.js';

async function startServer() {
  try {
    const db = await testConnection();
    console.log(`Connected to PostgreSQL database: "${db}"`);
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`CampusCore Student Portal API running on http://localhost:${env.port}`);
    console.log(`Environment: ${env.nodeEnv}`);
  });
}

startServer();
