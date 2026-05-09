import { db } from '../util/db';
import { Task, CreateTaskDTO, UpdateTaskDTO, RecurringOption } from '../types';
import { formatIso } from '../util/time';

export class TaskRepo {
  create(dto: CreateTaskDTO): Task {
    const now = formatIso();
    const recurringJson = dto.recurring_option ? JSON.stringify(dto.recurring_option) : null;

    const stmt = db.prepare(`
      INSERT INTO tasks (task, description, recurring_option, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(dto.task, dto.description || null, recurringJson, now, now);
    return this.findById(info.lastInsertRowid as number)!;
  }

  findById(id: number): Task | undefined {
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
  }

  findByTask(task: string): Task | undefined {
    return db.prepare('SELECT * FROM tasks WHERE task = ? AND deleted_at IS NULL').get(task) as Task | undefined;
  }

  findAllActive(): Task[] {
    return db.prepare('SELECT * FROM tasks WHERE deleted_at IS NULL').all() as Task[];
  }

  findAllRecurring(): Task[] {
    return db.prepare('SELECT * FROM tasks WHERE recurring_option IS NOT NULL AND deleted_at IS NULL').all() as Task[];
  }

  findRecurringByType(type: string): Task[] {
    return db.prepare(
      `SELECT * FROM tasks WHERE recurring_option IS NOT NULL AND deleted_at IS NULL AND json_extract(recurring_option, '$.type') = ?`
    ).all(type) as Task[];
  }

  update(task: string, dto: UpdateTaskDTO): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (dto.description !== undefined) {
      fields.push('description = ?');
      values.push(dto.description);
    }
    if (dto.recurring_option !== undefined) {
      fields.push('recurring_option = ?');
      values.push(dto.recurring_option ? JSON.stringify(dto.recurring_option) : null);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(formatIso());
    values.push(task);

    const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE task = ? AND deleted_at IS NULL`;
    db.prepare(sql).run(...values);
  }

  delete(task: string): void {
    const now = formatIso();
    db.prepare('UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE task = ? AND deleted_at IS NULL')
      .run(now, now, task);
  }

  /**
   * Parses the recurring_option JSON string into a RecurringOption object.
   */
  static parseRecurring(task: Task): RecurringOption | null {
    if (!task.recurring_option) return null;
    try {
      return JSON.parse(task.recurring_option) as RecurringOption;
    } catch {
      return null;
    }
  }
}

export const taskRepo = new TaskRepo();
