import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { config } from '../src/config';

// Load environment variables
dotenv.config();

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
});

const migrationsDir = join(__dirname);

async function runMigrations(): Promise<void> {
  try {
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get all migration files
    const files = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files`);

    // Run each migration
    for (const file of files) {
      const version = file.replace('.sql', '');

      // Check if migration already applied
      const result = await pool.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [version]
      );

      if (result.rows.length > 0) {
        console.log(`Migration ${version} already applied, skipping...`);
        continue;
      }

      console.log(`Running migration ${version}...`);

      // Read and execute migration
      const migrationSQL = readFileSync(join(migrationsDir, file), 'utf-8');
      await pool.query('BEGIN');
      try {
        await pool.query(migrationSQL);
        await pool.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version]
        );
        await pool.query('COMMIT');
        console.log(`Migration ${version} applied successfully`);
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

