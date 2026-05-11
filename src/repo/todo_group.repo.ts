import { db } from '../util/db'
import { TodoGroup } from '../types'
import { formatIso } from '../util/time'

export class TodoGroupRepo {
    create(name: string, orderIndex: number = -1): TodoGroup {
        const now = formatIso()
        const stmt = db.prepare(`
      INSERT INTO todo_groups (name, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `)
        const info = stmt.run(name, orderIndex, now, now)
        return this.findById(info.lastInsertRowid as number)!
    }

    findById(id: number): TodoGroup | undefined {
        return db.prepare('SELECT * FROM todo_groups WHERE id = ? AND deleted_at IS NULL').get(id) as
            | TodoGroup
            | undefined
    }

    findAllActive(): TodoGroup[] {
        return db
            .prepare(
                'SELECT * FROM todo_groups WHERE deleted_at IS NULL ORDER BY CASE WHEN order_index = -1 THEN 1 ELSE 0 END, order_index ASC, created_at ASC'
            )
            .all() as TodoGroup[]
    }

    update(id: number, data: Partial<TodoGroup>): void {
        const fields: string[] = []
        const values: any[] = []

        if (data.name !== undefined) {
            fields.push('name = ?')
            values.push(data.name)
        }
        if (data.order_index !== undefined) {
            fields.push('order_index = ?')
            values.push(data.order_index)
        }

        if (fields.length === 0) return

        fields.push('updated_at = ?')
        values.push(formatIso())
        values.push(id)

        db.prepare(`UPDATE todo_groups SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`).run(...values)
    }

    delete(id: number): void {
        const now = formatIso()
        db.prepare('UPDATE todo_groups SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL').run(
            now,
            now,
            id
        )
    }
}

export const todoGroupRepo = new TodoGroupRepo()
