import Database from 'better-sqlite3'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import './env'

const rawPath = process.env.DB_PATH || 'data/tracker.db'
const expandedPath = rawPath.replace(/^~/, os.homedir())
const dbPath = path.isAbsolute(expandedPath) ? expandedPath : path.resolve(os.homedir(), expandedPath)

// Ensure directory exists
const dir = path.dirname(dbPath)
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
}

export const db = new Database(dbPath)

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL')

// Initialize tables based on CONTRACTS.md
db.exec(`
  CREATE TABLE IF NOT EXISTS tracker_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag TEXT UNIQUE NOT NULL,
    description TEXT,
    options TEXT NOT NULL DEFAULT '{"recurring":null,"repeat":{"target":1}}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS tracker_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id INTEGER NOT NULL,
    parent_id INTEGER,
    details TEXT,
    mood TEXT,
    completed_at TEXT,
    recurring_mark INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY(tag_id) REFERENCES tracker_tags(id),
    FOREIGN KEY(parent_id) REFERENCES tracker_events(id)
  );

  CREATE TABLE IF NOT EXISTS todo_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT -1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS todo_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_group_id INTEGER NOT NULL,
    parent_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'pending',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    archived_at TEXT,
    FOREIGN KEY(todo_group_id) REFERENCES todo_groups(id),
    FOREIGN KEY(parent_id) REFERENCES todo_items(id)
  );
`)

// ---- Schema migration helpers ----
function tableColumns(table: string): string[] {
    return (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(c => c.name)
}

function renameColumnIf(table: string, oldName: string, newName: string) {
    const cols = tableColumns(table)
    if (cols.includes(oldName) && !cols.includes(newName)) {
        db.exec(`ALTER TABLE ${table} RENAME COLUMN ${oldName} TO ${newName}`)
    }
}

function addColumnIfMissing(table: string, column: string, definition: string) {
    const cols = tableColumns(table)
    if (!cols.includes(column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
    }
}

// Migrate todo_groups: position -> order_index, drop description (SQLite can't drop columns easily, just leave it)
renameColumnIf('todo_groups', 'position', 'order_index')

// Migrate todo_items: name -> title, group_id -> todo_group_id, position -> order_index
renameColumnIf('todo_items', 'name', 'title')
renameColumnIf('todo_items', 'group_id', 'todo_group_id')
renameColumnIf('todo_items', 'position', 'order_index')

// Add missing columns to todo_items
addColumnIfMissing('todo_items', 'description', 'TEXT')
addColumnIfMissing('todo_items', 'due_date', 'TEXT')
addColumnIfMissing('todo_items', 'priority', "TEXT NOT NULL DEFAULT 'medium'")
addColumnIfMissing('todo_items', 'status', "TEXT NOT NULL DEFAULT 'pending'")

// Add archived_at columns
addColumnIfMissing('todo_items', 'archived_at', 'TEXT')
addColumnIfMissing('todo_groups', 'archived_at', 'TEXT')
