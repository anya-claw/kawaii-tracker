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

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT UNIQUE NOT NULL,
    description TEXT,
    recurring_option TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    parent_id INTEGER REFERENCES events(id),
    details TEXT,
    mood TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    daily_mark INTEGER NOT NULL DEFAULT 0,
    progress INTEGER DEFAULT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY(task_id) REFERENCES tasks(id)
  );

  CREATE TABLE IF NOT EXISTS todo_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS todo_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    completed_at TEXT,
    parent_id INTEGER REFERENCES todo_items(id),
    group_id INTEGER NOT NULL REFERENCES todo_groups(id),
    recurring_option TEXT,
    started_at TEXT,
    end_at TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
`);
