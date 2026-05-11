import { db } from '../util/db'
import { TrackerTag, CreateTagDTO, UpdateTagDTO, Option } from '../types'
import { formatIso } from '../util/time'

export class TagRepo {
    /**
     * Creates a new tag.
     */
    create(dto: CreateTagDTO): TrackerTag {
        const now = formatIso()

        // Set default option if not fully provided
        const defaultOption: Option = {
            recurring: { type: dto.option?.recurring?.type || null },
            repeat: { target: dto.option?.repeat?.target || 1 }
        }

        const stmt = db.prepare(`
      INSERT INTO tracker_tags (tag, description, options, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `)

        const info = stmt.run(dto.tag, dto.description || null, JSON.stringify(defaultOption), now, now)

        return this.findById(info.lastInsertRowid as number)!
    }

    /**
     * Finds a tag by ID.
     */
    findById(id: number): TrackerTag | undefined {
        // Filter out deleted implicitly
        return db.prepare('SELECT * FROM tracker_tags WHERE id = ? AND deleted_at IS NULL').get(id) as
            | TrackerTag
            | undefined
    }

    /**
     * Finds a tag by exact name.
     */
    findByTag(tag: string): TrackerTag | undefined {
        return db.prepare('SELECT * FROM tracker_tags WHERE tag = ? AND deleted_at IS NULL').get(tag) as
            | TrackerTag
            | undefined
    }

    /**
     * Returns all active tags.
     */
    findAllActive(): TrackerTag[] {
        return db.prepare('SELECT * FROM tracker_tags WHERE deleted_at IS NULL').all() as TrackerTag[]
    }

    /**
     * Updates a tag.
     */
    update(tag: string, dto: UpdateTagDTO): void {
        const fields: string[] = []
        const values: any[] = []

        if (dto.description !== undefined) {
            fields.push('description = ?')
            values.push(dto.description)
        }

        if (dto.option !== undefined) {
            const current = this.findByTag(tag)
            if (current) {
                let currentOptions: Option
                try {
                    currentOptions = JSON.parse(current.options)
                } catch {
                    currentOptions = { recurring: { type: null }, repeat: { target: 1 } }
                }

                const mergedOption: Option = {
                    recurring: {
                        type:
                            dto.option?.recurring?.type !== undefined
                                ? dto.option.recurring.type
                                : currentOptions.recurring?.type
                    },
                    repeat: {
                        target:
                            dto.option?.repeat?.target !== undefined
                                ? dto.option.repeat.target
                                : currentOptions.repeat?.target
                    }
                }

                fields.push('options = ?')
                values.push(JSON.stringify(mergedOption))
            }
        }

        if (fields.length === 0) return

        fields.push('updated_at = ?')
        values.push(formatIso())
        values.push(tag)

        const sql = `UPDATE tracker_tags SET ${fields.join(', ')} WHERE tag = ? AND deleted_at IS NULL`
        db.prepare(sql).run(...values)
    }

    /**
     * Soft deletes a tag.
     */
    delete(tag: string): void {
        const now = formatIso()
        db.prepare('UPDATE tracker_tags SET deleted_at = ?, updated_at = ? WHERE tag = ? AND deleted_at IS NULL').run(
            now,
            now,
            tag
        )
    }
}

export const tagRepo = new TagRepo()
