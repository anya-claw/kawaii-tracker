import { db } from '../util/db';
import { Event, CreateEventDTO, UpdateEventDTO, QueryDTO } from '../types';
import { formatIso } from '../util/time';

export class EventRepo {
  /**
   * Creates an event.
   */
  create(tagId: number, dto: CreateEventDTO, completed = 1, dailyMark = 0): Event {
    const now = formatIso();
    
    const stmt = db.prepare(`
      INSERT INTO events (tag_id, details, mood, completed, daily_mark, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(tagId, dto.details || null, dto.mood || null, completed, dailyMark, now, now);
    return this.findById(info.lastInsertRowid as number)!;
  }

  /**
   * Creates a placeholder event for a daily task.
   */
  createPlaceholder(tagId: number): void {
    const now = formatIso();
    const stmt = db.prepare(`
      INSERT INTO events (tag_id, completed, daily_mark, created_at, updated_at)
      VALUES (?, 0, 1, ?, ?)
    `);
    stmt.run(tagId, now, now);
  }

  /**
   * Finds an event by ID.
   */
  findById(id: number): Event | undefined {
    return db.prepare('SELECT * FROM events WHERE id = ?').get(id) as Event | undefined;
  }

  /**
   * Finds the placeholder event for a tag created today.
   */
  findPlaceholderForToday(tagId: number, since: string): Event | undefined {
    return db.prepare(`
      SELECT * FROM events 
      WHERE tag_id = ? AND daily_mark = 1 AND created_at >= ? AND deleted_at IS NULL
      ORDER BY created_at DESC LIMIT 1
    `).get(tagId, since) as Event | undefined;
  }

  /**
   * Returns events matching query parameters.
   */
  find(query: QueryDTO): Event[] {
    let sql = 'SELECT events.*, tags.tag as tag_name FROM events JOIN tags ON events.tag_id = tags.id WHERE events.deleted_at IS NULL AND tags.deleted_at IS NULL';
    const values: any[] = [];

    if (query.tag) {
      sql += ' AND tags.tag = ?';
      values.push(query.tag);
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

    sql += ' ORDER BY events.created_at DESC';

    if (query.limit) {
      sql += ' LIMIT ?';
      values.push(query.limit);
    }

    return db.prepare(sql).all(...values) as Event[];
  }

  /**
   * Updates an event.
   */
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

  /**
   * Completes a placeholder.
   */
  completePlaceholder(id: number, dto: CreateEventDTO): void {
    const now = formatIso();
    const sql = `
      UPDATE events SET completed = 1, details = ?, mood = ?, updated_at = ?
      WHERE id = ? AND deleted_at IS NULL
    `;
    db.prepare(sql).run(dto.details || null, dto.mood || null, now, id);
  }

  /**
   * Soft deletes events by ID array.
   */
  deleteByIds(ids: number[]): void {
    const now = formatIso();
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE events SET deleted_at = ?, updated_at = ? WHERE id IN (${placeholders}) AND deleted_at IS NULL`;
    db.prepare(sql).run(now, now, ...ids);
  }
}

export const eventRepo = new EventRepo();
