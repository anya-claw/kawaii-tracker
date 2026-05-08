import Database from 'better-sqlite3';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import './env';

const rawPath = process.env.DB_PATH || 'data/tracker.db';
const expandedPath = rawPath.replace(/^~/, os.homedir());
const dbPath = path.isAbsolute(expandedPath)
  ? expandedPath
  : path.resolve(os.homedir(), expandedPath);

// Ensure directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize tables based on CONTRACTS.md
db.exec(`
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag TEXT UNIQUE NOT NULL,
    description TEXT,
    is_daily INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id INTEGER NOT NULL,
    details TEXT,
    mood TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    daily_mark INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY(tag_id) REFERENCES tags(id)
  );
`);
