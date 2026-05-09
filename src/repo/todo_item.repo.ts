import { db } from '../util/db';
import { TodoItem, CreateTodoItemDTO, UpdateTodoItemDTO, TodoQueryDTO, RecurringOption } from '../types';
import { formatIso } from '../util/time';

export class TodoItemRepo {
  create(dto: CreateTodoItemDTO): TodoItem {
    const now = formatIso();
    const position = dto.position ?? this.nextPosition(dto.group_id);
    const recurringJson = dto.recurring_option ? JSON.stringify(dto.recurring_option) : null;

    const stmt = db.prepare(`
      INSERT INTO todo_items (name, group_id, parent_id, recurring_option, started_at, end_at, position, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      dto.name, dto.group_id, dto.parent_id || null, recurringJson,
      dto.started_at || null, dto.end_at || null, position, now, now
    );
    return this.findById(info.lastInsertRowid as number)!;
  }

  findById(id: number): TodoItem | undefined {
    return db.prepare('SELECT * FROM todo_items WHERE id = ?').get(id) as TodoItem | undefined;
  }

  find(query: TodoQueryDTO): TodoItem[] {
    let sql = 'SELECT * FROM todo_items WHERE deleted_at IS NULL';
    const values: any[] = [];

    if (query.group_id !== undefined) {
      sql += ' AND group_id = ?';
      values.push(query.group_id);
    }

    if (query.parent_id !== undefined) {
      if (query.parent_id === 'null') {
        sql += ' AND parent_id IS NULL';
      } else {
        sql += ' AND parent_id = ?';
        values.push(query.parent_id);
      }
    }

    if (query.completed !== undefined) {
      if (query.completed) {
        sql += ' AND completed_at IS NOT NULL';
        // By default, hide completed items older than 24h
        if (!query.show_hidden) {
          sql += " AND completed_at >= datetime('now', '-24 hours')";
        }
      } else {
        sql += ' AND completed_at IS NULL';
      }
    }

    sql += ' ORDER BY position ASC, created_at DESC';

    if (query.limit) {
      sql += ' LIMIT ?';
      values.push(query.limit);
    }
    if (query.offset) {
      sql += ' OFFSET ?';
      values.push(query.offset);
    }

    return db.prepare(sql).all(...values) as TodoItem[];
  }

  update(id: number, dto: UpdateTodoItemDTO): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (dto.name !== undefined) { fields.push('name = ?'); values.push(dto.name); }
    if (dto.group_id !== undefined) { fields.push('group_id = ?'); values.push(dto.group_id); }
    if (dto.parent_id !== undefined) { fields.push('parent_id = ?'); values.push(dto.parent_id); }
    if (dto.recurring_option !== undefined) {
      fields.push('recurring_option = ?');
      values.push(dto.recurring_option ? JSON.stringify(dto.recurring_option) : null);
    }
    if (dto.started_at !== undefined) { fields.push('started_at = ?'); values.push(dto.started_at); }
    if (dto.end_at !== undefined) { fields.push('end_at = ?'); values.push(dto.end_at); }
    if (dto.position !== undefined) { fields.push('position = ?'); values.push(dto.position); }
    if (dto.completed_at !== undefined) { fields.push('completed_at = ?'); values.push(dto.completed_at); }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(formatIso());
    values.push(id);

    db.prepare(`UPDATE todo_items SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`).run(...values);
  }

  /**
   * Complete a todo item. If it has sub-todos, all sub-todos must be completed first.
   * Returns the updated item, or null if sub-todos are not all completed.
   */
  complete(id: number): TodoItem | null {
    const item = this.findById(id);
    if (!item) return null;

    // If has sub-todos, check they're all completed
    const subTodos = this.find({ parent_id: id, completed: false });
    if (subTodos.length > 0) return null;

    const now = formatIso();
    db.prepare('UPDATE todo_items SET completed_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
      .run(now, now, id);

    // Auto-complete parent if all siblings are done
    if (item.parent_id) {
      const siblings = this.find({ parent_id: item.parent_id, completed: false });
      if (siblings.length === 0) {
        this.complete(item.parent_id);
      }
    }

    return this.findById(id)!;
  }

  uncomplete(id: number): void {
    const now = formatIso();
    db.prepare('UPDATE todo_items SET completed_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
      .run(now, id);
  }

  delete(id: number): void {
    const now = formatIso();
    db.prepare('UPDATE todo_items SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
      .run(now, now, id);
  }

  private nextPosition(groupId: number): number {
    const row = db.prepare('SELECT MAX(position) as max_pos FROM todo_items WHERE group_id = ? AND deleted_at IS NULL').get(groupId) as { max_pos: number | null };
    return (row.max_pos ?? -1) + 1;
  }

  static parseRecurring(item: TodoItem): RecurringOption | null {
    if (!item.recurring_option) return null;
    try {
      return JSON.parse(item.recurring_option) as RecurringOption;
    } catch {
      return null;
    }
  }
}

export const todoItemRepo = new TodoItemRepo();
