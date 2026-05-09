import { db } from '../util/db';
import { TodoGroup, CreateTodoGroupDTO, UpdateTodoGroupDTO } from '../types';
import { formatIso } from '../util/time';

export class TodoGroupRepo {
  create(dto: CreateTodoGroupDTO): TodoGroup {
    const now = formatIso();
    const position = dto.position ?? this.nextPosition();

    const stmt = db.prepare(`
      INSERT INTO todo_groups (name, description, position, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(dto.name, dto.description || null, position, now, now);
    return this.findById(info.lastInsertRowid as number)!;
  }

  findById(id: number): TodoGroup | undefined {
    return db.prepare('SELECT * FROM todo_groups WHERE id = ?').get(id) as TodoGroup | undefined;
  }

  findAllActive(): TodoGroup[] {
    return db.prepare('SELECT * FROM todo_groups WHERE deleted_at IS NULL ORDER BY position ASC').all() as TodoGroup[];
  }

  update(id: number, dto: UpdateTodoGroupDTO): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (dto.name !== undefined) { fields.push('name = ?'); values.push(dto.name); }
    if (dto.description !== undefined) { fields.push('description = ?'); values.push(dto.description); }
    if (dto.position !== undefined) { fields.push('position = ?'); values.push(dto.position); }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(formatIso());
    values.push(id);

    db.prepare(`UPDATE todo_groups SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`).run(...values);
  }

  delete(id: number): void {
    const now = formatIso();
    db.prepare('UPDATE todo_groups SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
      .run(now, now, id);
  }

  private nextPosition(): number {
    const row = db.prepare('SELECT MAX(position) as max_pos FROM todo_groups WHERE deleted_at IS NULL').get() as { max_pos: number | null };
    return (row.max_pos ?? -1) + 1;
  }
}

export const todoGroupRepo = new TodoGroupRepo();
