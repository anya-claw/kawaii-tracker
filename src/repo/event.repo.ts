import { db } from '../util/db'
import { TrackerEvent, QueryDTO, CreateEventDTO, UpdateEventDTO } from '../types'
import { formatIso } from '../util/time'

export class EventRepo {
    /**
     * Creates a new tracker event.
     */
    create(data: {
        tag_id: number
        parent_id: number | null
        recurring_mark: number
        completed_at: string | null
        details?: string | null
        mood?: string | null
    }): TrackerEvent {
        const now = formatIso()

        const stmt = db.prepare(`
      INSERT INTO tracker_events (tag_id, parent_id, details, mood, completed_at, recurring_mark, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

        const info = stmt.run(
            data.tag_id,
            data.parent_id,
            data.details || null,
            data.mood || null,
            data.completed_at,
            data.recurring_mark,
            now,
            now
        )
        return this.findById(info.lastInsertRowid as number)!
    }

    /**
     * Finds an event by ID.
     */
    findById(id: number): TrackerEvent | undefined {
        return db.prepare('SELECT * FROM tracker_events WHERE id = ? AND deleted_at IS NULL').get(id) as
            | TrackerEvent
            | undefined
    }

    /**
     * Finds active recurring event (placeholder) for a given tag.
     */
    findActiveRecurringEvent(tagId: number): TrackerEvent | undefined {
        return db
            .prepare(
                `
      SELECT * FROM tracker_events 
      WHERE tag_id = ? AND recurring_mark = 1 AND completed_at IS NULL AND deleted_at IS NULL
      ORDER BY created_at DESC LIMIT 1
    `
            )
            .get(tagId) as TrackerEvent | undefined
    }

    /**
     * Finds the latest recurring event (regardless of completion) for a tag since a given start time.
     * Used to check if the current cycle already has a completed placeholder.
     */
    findLatestRecurringEventSince(tagId: number, since: string): TrackerEvent | undefined {
        return db
            .prepare(
                `
      SELECT * FROM tracker_events 
      WHERE tag_id = ? AND recurring_mark = 1 AND deleted_at IS NULL AND created_at >= ?
      ORDER BY created_at DESC LIMIT 1
    `
            )
            .get(tagId, since) as TrackerEvent | undefined
    }

    /**
     * Counts the number of active sub events for a specific parent.
     */
    countSubEventsByParent(parentId: number): number {
        const result = db
            .prepare(
                `
      SELECT COUNT(*) as count FROM tracker_events 
      WHERE parent_id = ? AND deleted_at IS NULL
    `
            )
            .get(parentId) as { count: number }
        return result.count
    }

    /**
     * Returns events matching query parameters.
     */
    find(query: QueryDTO): (TrackerEvent & { tag_name: string })[] {
        let sql =
            'SELECT e.*, t.tag as tag_name FROM tracker_events e JOIN tracker_tags t ON e.tag_id = t.id WHERE e.deleted_at IS NULL AND t.deleted_at IS NULL'
        const values: any[] = []

        if (query.tag) {
            sql += ' AND t.tag = ?'
            values.push(query.tag)
        }

        if (query.since) {
            sql += ' AND e.created_at >= ?'
            values.push(query.since)
        }

        if (query.until) {
            sql += ' AND e.created_at <= ?'
            values.push(query.until)
        }

        if (query.completed !== undefined) {
            if (query.completed) {
                sql += ' AND e.completed_at IS NOT NULL'
            } else {
                sql += ' AND e.completed_at IS NULL'
            }
        }

        sql += ' ORDER BY e.created_at DESC'

        if (query.limit) {
            sql += ' LIMIT ?'
            values.push(query.limit)
        }

        return db.prepare(sql).all(...values) as (TrackerEvent & { tag_name: string })[]
    }

    /**
     * Updates an event inline.
     */
    update(id: number, data: Partial<TrackerEvent>): void {
        const fields: string[] = []
        const values: any[] = []

        if (data.details !== undefined) {
            fields.push('details = ?')
            values.push(data.details)
        }
        if (data.mood !== undefined) {
            fields.push('mood = ?')
            values.push(data.mood)
        }
        if (data.completed_at !== undefined) {
            fields.push('completed_at = ?')
            values.push(data.completed_at)
        }
        if (data.parent_id !== undefined) {
            fields.push('parent_id = ?')
            values.push(data.parent_id)
        }

        if (fields.length === 0) return

        fields.push('updated_at = ?')
        values.push(formatIso())
        values.push(id)

        const sql = `UPDATE tracker_events SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`
        db.prepare(sql).run(...values)
    }

    /**
     * Soft deletes events by ID array.
     */
    deleteByIds(ids: number[]): void {
        if (ids.length === 0) return
        const now = formatIso()
        const placeholders = ids.map(() => '?').join(',')
        const sql = `UPDATE tracker_events SET deleted_at = ?, updated_at = ? WHERE id IN (${placeholders}) AND deleted_at IS NULL`
        db.prepare(sql).run(now, now, ...ids)
    }
}

export const eventRepo = new EventRepo()
