const path = require("path");
const Database = require("better-sqlite3");

// ALWAYS create DB inside server/db
const dbPath = path.join(__dirname, "visitor_kiosk.db");
const db = new Database(dbPath);

// create tables
db.exec(`
CREATE TABLE IF NOT EXISTS hosts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  photo_path TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id INTEGER NOT NULL,
  host_id INTEGER NOT NULL,
  purpose TEXT NOT NULL,
  qr_token TEXT NOT NULL UNIQUE,
  check_in_at TEXT DEFAULT CURRENT_TIMESTAMP,
  check_out_at TEXT,
  FOREIGN KEY (visitor_id) REFERENCES visitors(id),
  FOREIGN KEY (host_id) REFERENCES hosts(id)
);
`);

console.log("✅ Database initialized successfully");
