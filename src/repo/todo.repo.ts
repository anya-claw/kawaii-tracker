import { db } from '../util/db'
import { TodoItem } from '../types'
import { formatIso } from '../util/time'

export class TodoRepo {
    create(data: {
        todo_group_id: number
        parent_id?: number | null
        title: string
        description?: string | null
        due_date?: string | null
        priority?: 'low' | 'medium' | 'high'
        status?: 'pending' | 'doing' | 'done'
        order_index?: number
    }): TodoItem {
        const now = formatIso()
        const priority = data.priority || 'medium'
        const status = data.status || 'pending'
        const orderIndex = data.order_index ?? 0

        const stmt = db.prepare(`
      INSERT INTO todo_items (todo_group_id, parent_id, title, description, due_date, priority, status, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

        const info = stmt.run(
            data.todo_group_id,
            data.parent_id || null,
            data.title,
            data.description || null,
            data.due_date || null,
            priority,
            status,
            orderIndex,
            now,
            now
        )

        return this.findById(info.lastInsertRowid as number)!
    }

    findById(id: number): TodoItem | undefined {
        return db.prepare('SELECT * FROM todo_items WHERE id = ? AND deleted_at IS NULL').get(id) as
            | TodoItem
            | undefined
    }

    findByGroup(groupId: number): TodoItem[] {
        return db
            .prepare(`SELECT * FROM todo_items WHERE todo_group_id = ? AND deleted_at IS NULL ORDER BY order_index ASC`)
            .all(groupId) as TodoItem[]
    }

    findByParent(parentId: number): TodoItem[] {
        return db
            .prepare(`SELECT * FROM todo_items WHERE parent_id = ? AND deleted_at IS NULL ORDER BY order_index ASC`)
            .all(parentId) as TodoItem[]
    }

    findAllActive(): TodoItem[] {
        return db
            .prepare(
                `SELECT * FROM todo_items WHERE deleted_at IS NULL AND archived_at IS NULL ORDER BY order_index ASC`
            )
            .all() as TodoItem[]
    }

    findAllNonDeleted(): TodoItem[] {
        return db
            .prepare(`SELECT * FROM todo_items WHERE deleted_at IS NULL ORDER BY order_index ASC`)
            .all() as TodoItem[]
    }

    findAllIncludingDeleted(): TodoItem[] {
        return db.prepare(`SELECT * FROM todo_items ORDER BY updated_at DESC`).all() as TodoItem[]
    }

    update(id: number, data: Partial<TodoItem>): void {
        const fields: string[] = []
        const values: any[] = []

        const allowed = [
            'todo_group_id',
            'parent_id',
            'title',
            'description',
            'due_date',
            'priority',
            'status',
            'order_index'
        ]

        for (const key of allowed) {
            if ((data as any)[key] !== undefined) {
                fields.push(`${key} = ?`)
                values.push((data as any)[key])
            }
        }

        if (fields.length === 0) return

        fields.push('updated_at = ?')
        values.push(formatIso())
        values.push(id)

        db.prepare(`UPDATE todo_items SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`).run(...values)
    }

    delete(id: number): void {
        const now = formatIso()
        db.prepare('UPDATE todo_items SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL').run(
            now,
            now,
            id
        )
    }

    archive(id: number): void {
        const now = formatIso()
        db.prepare(
            'UPDATE todo_items SET archived_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL AND archived_at IS NULL'
        ).run(now, now, id)
    }

    unarchive(id: number): void {
        const now = formatIso()
        db.prepare(
            'UPDATE todo_items SET archived_at = NULL, updated_at = ? WHERE id = ? AND archived_at IS NOT NULL'
        ).run(now, id)
    }
}

export const todoRepo = new TodoRepo()
