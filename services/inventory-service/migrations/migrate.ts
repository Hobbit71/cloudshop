import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { config } from '../src/config';

dotenv.config();

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
});

const runMigrations = async (): Promise<void> => {
  const migrations = [
    '001_create_warehouses_table.sql',
    '002_create_inventory_table.sql',
    '003_create_reservations_table.sql',
    '004_create_transfers_table.sql',
    '005_create_low_stock_alerts_table.sql',
    '006_create_inventory_history_table.sql',
  ];

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const migration of migrations) {
      const filePath = join(__dirname, migration);
      const sql = readFileSync(filePath, 'utf-8');
      
      console.log(`Running migration: ${migration}`);
      await client.query(sql);
      console.log(`Migration ${migration} completed successfully`);
    }

    await client.query('COMMIT');
    console.log('All migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

runMigrations().catch((error) => {
  console.error('Failed to run migrations:', error);
  process.exit(1);
});

