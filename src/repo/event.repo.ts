import { db } from '../util/db';
import { Event, CreateEventDTO, UpdateEventDTO, QueryDTO, Task } from '../types';
import { formatIso } from '../util/time';
import { TaskRepo } from './task.repo';

export class EventRepo {
  create(taskId: number, dto: CreateEventDTO, completed = 1, dailyMark = 0): Event {
    const now = formatIso();

    const stmt = db.prepare(`
      INSERT INTO events (task_id, details, mood, completed, daily_mark, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(taskId, dto.details || null, dto.mood || null, completed, dailyMark, now, now);
    return this.findById(info.lastInsertRowid as number)!;
  }

  createMainEvent(taskId: number, target: number): Event {
    const now = formatIso();
    const stmt = db.prepare(`
      INSERT INTO events (task_id, completed, daily_mark, progress, created_at, updated_at)
      VALUES (?, 0, 1, 0, ?, ?)
    `);
    const info = stmt.run(taskId, now, now);
    return this.findById(info.lastInsertRowid as number)!;
  }

  createSubEvent(taskId: number, parentId: number, dto: CreateEventDTO): Event {
    const now = formatIso();
    const stmt = db.prepare(`
      INSERT INTO events (task_id, parent_id, details, mood, completed, daily_mark, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, 0, ?, ?)
    `);
    const info = stmt.run(taskId, parentId, dto.details || null, dto.mood || null, now, now);
    db.prepare(`UPDATE events SET progress = progress + 1, updated_at = ? WHERE id = ?`).run(now, parentId);
    return this.findById(info.lastInsertRowid as number)!;
  }

  findMainEventForWeek(taskId: number, weekStart: string): Event | undefined {
    return db.prepare(`
      SELECT * FROM events
      WHERE task_id = ? AND parent_id IS NULL AND daily_mark = 1 AND created_at >= ? AND deleted_at IS NULL
      ORDER BY created_at DESC LIMIT 1
    `).get(taskId, weekStart) as Event | undefined;
  }

  findMainEventForToday(taskId: number, todayStart: string): Event | undefined {
    return db.prepare(`
      SELECT * FROM events
      WHERE task_id = ? AND parent_id IS NULL AND daily_mark = 1 AND created_at >= ? AND deleted_at IS NULL
      ORDER BY created_at DESC LIMIT 1
    `).get(taskId, todayStart) as Event | undefined;
  }

  countSubEventsToday(parentId: number, todayStart: string): number {
    const row = db.prepare(`
      SELECT COUNT(*) as cnt FROM events
      WHERE parent_id = ? AND created_at >= ? AND deleted_at IS NULL
    `).get(parentId, todayStart) as { cnt: number };
    return row.cnt;
  }

  countSubEvents(parentId: number): number {
    const row = db.prepare(`
      SELECT COUNT(*) as cnt FROM events
      WHERE parent_id = ? AND deleted_at IS NULL
    `).get(parentId) as { cnt: number };
    return row.cnt;
  }

  createPlaceholder(taskId: number): void {
    const now = formatIso();
    const stmt = db.prepare(`
      INSERT INTO events (task_id, completed, daily_mark, created_at, updated_at)
      VALUES (?, 0, 1, ?, ?)
    `);
    stmt.run(taskId, now, now);
  }

  findById(id: number): Event | undefined {
    return db.prepare('SELECT * FROM events WHERE id = ?').get(id) as Event | undefined;
  }

  findPlaceholderForToday(taskId: number, since: string): Event | undefined {
    return db.prepare(`
      SELECT * FROM events
      WHERE task_id = ? AND daily_mark = 1 AND created_at >= ? AND deleted_at IS NULL
      ORDER BY created_at DESC LIMIT 1
    `).get(taskId, since) as Event | undefined;
  }

  find(query: QueryDTO): Event[] {
    let sql = 'SELECT events.*, tasks.task as task_name, tasks.recurring_option as task_recurring_option FROM events JOIN tasks ON events.task_id = tasks.id WHERE events.deleted_at IS NULL AND tasks.deleted_at IS NULL';
    const values: any[] = [];

    if (query.task) {
      sql += ' AND tasks.task = ?';
      values.push(query.task);
    }

    if (query.since) {
      sql += ' AND events.created_at >= ?';
      values.push(query.since);
    }

    if (query.until) {
      sql += ' AND events.created_at <= ?';
      values.push(query.until);
    }

    if (query.completed !== undefined) {
      sql += ' AND events.completed = ?';
      values.push(query.completed ? 1 : 0);
    }

    if (query.parent_id !== undefined) {
      if (query.parent_id === 'null') {
        sql += ' AND events.parent_id IS NULL';
      } else {
        sql += ' AND events.parent_id = ?';
        values.push(query.parent_id);
      }
    }

    sql += ' ORDER BY events.created_at DESC';

    if (query.limit) {
      sql += ' LIMIT ?';
      values.push(query.limit);
    }
    if (query.offset) {
      sql += ' OFFSET ?';
      values.push(query.offset);
    }

    return db.prepare(sql).all(...values) as Event[];
  }

  count(query: QueryDTO): number {
    let sql = 'SELECT COUNT(*) as cnt FROM events JOIN tasks ON events.task_id = tasks.id WHERE events.deleted_at IS NULL AND tasks.deleted_at IS NULL';
    const values: any[] = [];

    if (query.task) {
      sql += ' AND tasks.task = ?';
      values.push(query.task);
    }

    if (query.since) {
      sql += ' AND events.created_at >= ?';
      values.push(query.since);
    }

    if (query.until) {
      sql += ' AND events.created_at <= ?';
      values.push(query.until);
    }

    if (query.completed !== undefined) {
      sql += ' AND events.completed = ?';
      values.push(query.completed ? 1 : 0);
    }

    if (query.parent_id !== undefined) {
      if (query.parent_id === 'null') {
        sql += ' AND events.parent_id IS NULL';
      } else {
        sql += ' AND events.parent_id = ?';
        values.push(query.parent_id);
      }
    }

    const row = db.prepare(sql).get(...values) as { cnt: number };
    return row.cnt;
  }

  update(id: number, dto: UpdateEventDTO): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (dto.details !== undefined) {
      fields.push('details = ?');
      values.push(dto.details);
    }
    if (dto.mood !== undefined) {
      fields.push('mood = ?');
      values.push(dto.mood);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(formatIso());
    values.push(id);

    const sql = `UPDATE events SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
    db.prepare(sql).run(...values);
  }

  completePlaceholder(id: number, dto: CreateEventDTO): void {
    const now = formatIso();
    const sql = `
      UPDATE events SET completed = 1, details = ?, mood = ?, updated_at = ?
      WHERE id = ? AND deleted_at IS NULL
    `;
    db.prepare(sql).run(dto.details || null, dto.mood || null, now, id);
  }

  deleteByIds(ids: number[]): void {
    const now = formatIso();
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE events SET deleted_at = ?, updated_at = ? WHERE id IN (${placeholders}) AND deleted_at IS NULL`;
    db.prepare(sql).run(now, now, ...ids);
  }
}

export const eventRepo = new EventRepo();
