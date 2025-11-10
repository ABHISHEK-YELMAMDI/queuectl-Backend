const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'queuectl.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Failed to connect", err);
  else console.log("Connected to SQLite DB");
});

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      command TEXT,
      state TEXT,
      attempts INTEGER,
      max_retries INTEGER,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  

  db.run(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS dlq (
    id TEXT PRIMARY KEY,
    command TEXT NOT NULL,
    attempts INTEGER,
    failed_at TEXT,
    reason TEXT
  )
`);


  console.log("Tables initialized");
});

// Export db object
module.exports = db;
