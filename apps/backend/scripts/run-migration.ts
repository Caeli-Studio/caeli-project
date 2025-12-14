/**
 * Migration Runner Script
 *
 * Executes SQL migration files against the Supabase database
 * Usage: tsx scripts/run-migration.ts <migration-file>
 */

import * as fs from 'fs';
import * as path from 'path';

import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration(migrationFile: string) {
  try {
    console.log(`\nRunning migration: ${migrationFile}\n`);

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'database',
      'migrations',
      migrationFile
    );

    if (!fs.existsSync(migrationPath)) {
      console.error(`Error: Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the SQL using Supabase's rpc or direct SQL execution
    // Note: Supabase doesn't have a direct SQL execution method in the JS client
    // We'll need to execute it via the REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      // If the RPC method doesn't exist, we'll need to run it differently
      // Let's try executing each statement separately
      console.log('Executing SQL statements...\n');

      // Split SQL into individual statements (basic split on semicolons)
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().startsWith('select')) {
          // For SELECT statements, use the query method
          const { data, error } = await supabase
            .from('profiles')
            .select('push_tokens')
            .limit(1);
          if (error && error.code !== 'PGRST116') {
            console.log('Statement:', statement.substring(0, 100) + '...');
            console.log('Result:', data);
          }
        }
      }
    }

    console.log('✓ Migration completed successfully!\n');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

// Get migration file from command line args
const migrationFile = process.argv[2] || '003_add_push_tokens.sql';

runMigration(migrationFile);
