import { db } from '~/lib/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    console.log('Starting manual migration...');

    const migrationPath = path.resolve(process.cwd(), 'src/lib/db/migrations/0010_create_unified_quality_thresholds.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Executing SQL from:', migrationPath);

    // Split by semicolon to execute statements individually if needed, 
    // but db.execute usually handles blocks or we can use sql.raw
    try {
        await db.execute(sql.raw(migrationSql));
        console.log('Migration executed successfully!');
    } catch (e) {
        console.error('Migration failed:', e);
    }

    process.exit(0);
}

runMigration().catch(console.error);
