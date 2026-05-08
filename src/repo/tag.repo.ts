import { db } from '../util/db';
import { Tag, CreateTagDTO, UpdateTagDTO } from '../types';
import { formatIso } from '../util/time';

export class TagRepo {
  /**
   * Creates a new tag.
   */
  create(dto: CreateTagDTO): Tag {
    const now = formatIso();
    const isDailyInt = dto.is_daily ? 1 : 0;
    
    const stmt = db.prepare(`
      INSERT INTO tags (tag, description, is_daily, daily_target, weekly_target, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(dto.tag, dto.description || null, isDailyInt, dto.daily_target || null, dto.weekly_target || null, now, now);
    return this.findById(info.lastInsertRowid as number)!;
  }

  /**
   * Finds a tag by ID.
   */
  findById(id: number): Tag | undefined {
    return db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Tag | undefined;
  }

  /**
   * Finds a tag by exact name.
   */
  findByTag(tag: string): Tag | undefined {
    return db.prepare('SELECT * FROM tags WHERE tag = ? AND deleted_at IS NULL').get(tag) as Tag | undefined;
  }

  /**
   * Returns all active tags.
   */
  findAllActive(): Tag[] {
    return db.prepare('SELECT * FROM tags WHERE deleted_at IS NULL').all() as Tag[];
  }

  findAllWeeklyActive(): Tag[] {
    return db.prepare('SELECT * FROM tags WHERE weekly_target IS NOT NULL AND deleted_at IS NULL').all() as Tag[];
  }

  /**
   * Returns all daily active tags.
   */
  findAllDailyActive(): Tag[] {
    return db.prepare('SELECT * FROM tags WHERE is_daily = 1 AND deleted_at IS NULL').all() as Tag[];
  }

  /**
   * Updates a tag.
   */
  update(tag: string, dto: UpdateTagDTO): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (dto.description !== undefined) {
      fields.push('description = ?');
      values.push(dto.description);
    }
    if (dto.is_daily !== undefined) {
      fields.push('is_daily = ?');
      values.push(dto.is_daily ? 1 : 0);
    }
    if (dto.daily_target !== undefined) {
      fields.push('daily_target = ?');
      values.push(dto.daily_target);
    }
    if (dto.weekly_target !== undefined) {
      fields.push('weekly_target = ?');
      values.push(dto.weekly_target);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(formatIso());
    values.push(tag);

    const sql = `UPDATE tags SET ${fields.join(', ')} WHERE tag = ? AND deleted_at IS NULL`;
    db.prepare(sql).run(...values);
  }

  /**
   * Soft deletes a tag.
   */
  delete(tag: string): void {
    const now = formatIso();
    db.prepare('UPDATE tags SET deleted_at = ?, updated_at = ? WHERE tag = ? AND deleted_at IS NULL')
      .run(now, now, tag);
  }
}

export const tagRepo = new TagRepo();
