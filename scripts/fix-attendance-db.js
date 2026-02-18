const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env.local manually since we might not have dotenv in scripts context (though package.json has it)
// But to be safe and standalone:
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
                process.env[key] = value;
            }
        });
    } catch (e) {
        console.log("Could not load .env.local, checking process.env...");
    }
}

loadEnv();

async function migrate() {
    console.log("Connecting to database...");
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Supabase connection
    });

    try {
        await client.connect();
        console.log("Connected.");

        console.log("Updating foreign key constraint...");

        // Transaction to ensure atomicity
        await client.query('BEGIN');

        // 1. Drop existing FK
        await client.query('ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_user_id_fkey');

        // 2. Add new FK referencing members
        await client.query(`
            ALTER TABLE attendance
            ADD CONSTRAINT attendance_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES members(id)
            ON DELETE CASCADE
        `);

        await client.query('COMMIT');
        console.log("SUCCESS: Foreign key updated to reference 'members' table.");

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("MIGRATION FAILED:", err);
    } finally {
        await client.end();
    }
}

migrate();
