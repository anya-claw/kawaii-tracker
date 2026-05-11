import { tagService } from '../service/tag.service'
import { CreateTagDTO, UpdateTagDTO } from '../types'

export class TagProcessor {
    /**
     * Processes the creation of a tag.
     */
    processAddTag(jsonStr: string): void {
        try {
            const dto = JSON.parse(jsonStr) as CreateTagDTO
            if (!dto.tag) {
                console.error('Error: "tag" is required.')
                process.exit(1)
            }
            const tag = tagService.createTag(dto)
            console.log(`✨ Tag '${tag.tag}' created successfully (ID: ${tag.id}).`)
        } catch (e: any) {
            console.error(`❌ Failed to add tag: ${e.message}`)
            process.exit(1)
        }
    }

    /**
     * Processes listing of all active tags.
     */
    processListTags(): void {
        try {
            const tags = tagService.listTags()
            if (tags.length === 0) {
                console.log('No active tags found. Create one with --addTag!')
                return
            }
            console.log('\n🌟 Active Tags:\n')
            tags.forEach(t => {
                const opts = t.options ? JSON.parse(t.options) : {}
                const recurringType = opts.recurring?.type || null
                const target = opts.repeat?.target || 1
                let typeStr = ''
                if (recurringType) {
                    typeStr = target > 1 ? `[${recurringType} ${target}x]` : `[${recurringType}]`
                }
                console.log(`- ${t.tag} ${typeStr} ${t.description ? `(${t.description})` : ''} (ID: ${t.id})`)
            })
            console.log('')
        } catch (e: any) {
            console.error(`❌ Failed to list tags: ${e.message}`)
            process.exit(1)
        }
    }

    /**
     * Processes tag updates.
     */
    processUpdateTag(jsonStr: string): void {
        try {
            const parsed = JSON.parse(jsonStr)
            if (!parsed.tag || !parsed.update) {
                console.error('Error: "tag" and "update" object are required.')
                process.exit(1)
            }
            tagService.updateTag(parsed.tag, parsed.update as UpdateTagDTO)
            console.log(`✨ Tag '${parsed.tag}' updated successfully.`)
        } catch (e: any) {
            console.error(`❌ Failed to update tag: ${e.message}`)
            process.exit(1)
        }
    }

    /**
     * Processes tag deletion.
     */
    processDelTag(tagName: string): void {
        try {
            tagService.deleteTag(tagName)
            console.log(`🗑️ Tag '${tagName}' deleted successfully.`)
        } catch (e: any) {
            console.error(`❌ Failed to delete tag: ${e.message}`)
            process.exit(1)
        }
    }
}

export const tagProcessor = new TagProcessor()
