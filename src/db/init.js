const db = require('./index');

db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        command TEXT,
        state TEXT,
        attempts INTEGER,
        max_retries INTEGER,
        created_at TEXT,
        updated_at TEXT,
        locked_by TEXT,
        locked_at TEXT,
        run_after INTEGER
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS dlq (
        id TEXT PRIMARY KEY,
        command TEXT,
        reason TEXT,
        failed_at TEXT
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT
    );
`);

console.log("Database initialized");
