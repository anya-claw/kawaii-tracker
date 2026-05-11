import { eventService } from '../service/event.service'
import { CreateEventDTO, UpdateEventDTO, QueryDTO } from '../types'

export class EventProcessor {
    /**
     * Processes adding an event.
     */
    processAddEvent(jsonStr: string): void {
        try {
            const dto = JSON.parse(jsonStr.replace(/'/g, '"')) as CreateEventDTO
            if (!dto.tag) {
                console.error('Error: "tag" is required.')
                process.exit(1)
            }
            const event = eventService.addEvent(dto)
            console.log(`✅ Event for '${dto.tag}' added successfully (ID: ${event.id}).`)
        } catch (e: any) {
            console.error(`❌ Failed to add event: ${e.message}`)
            process.exit(1)
        }
    }

    /**
     * Processes listing events based on a query.
     */
    processListEvents(jsonStr: string): void {
        try {
            const parsed = JSON.parse(jsonStr)
            const query = (parsed.query as QueryDTO) || {}
            const events = eventService.listEvents(query)

            if (events.length === 0) {
                console.log('No events found matching criteria.')
                return
            }
            console.log(`\n📅 Events (Total: ${events.length}):\n`)
            events.forEach((e: any) => {
                const checkStr = e.completed_at ? '✅' : '⏳'
                const recurringStr = e.recurring_mark ? '[Recurring Line]' : e.parent_id ? '[SubEvent]' : ''
                const tagStr = e.tag_name ? `[${e.tag_name}]` : ''
                const createdAt = new Date(e.created_at).toLocaleString()
                const completedAt = e.completed_at ? ` | Completed: ${new Date(e.completed_at).toLocaleString()}` : ''
                console.log(
                    `- ID: ${e.id} | ${checkStr} ${tagStr} ${recurringStr} | Mood: ${e.mood || 'N/A'} | Details: ${e.details || 'N/A'} | Created: ${createdAt}${completedAt}`
                )
            })
            console.log('')
        } catch (e: any) {
            console.error(`❌ Failed to list events: ${e.message}`)
            process.exit(1)
        }
    }

    /**
     * Processes updating an event.
     */
    processUpdateEvent(jsonStr: string): void {
        try {
            const parsed = JSON.parse(jsonStr)
            if (!parsed.eventId || !parsed.update) {
                console.error('Error: "eventId" and "update" object are required.')
                process.exit(1)
            }
            eventService.updateEvent(parsed.eventId, parsed.update as UpdateEventDTO)
            console.log(`✨ Event ID ${parsed.eventId} updated successfully.`)
        } catch (e: any) {
            console.error(`❌ Failed to update event: ${e.message}`)
            process.exit(1)
        }
    }

    /**
     * Processes deleting events.
     */
    processDelEvent(jsonStr: string): void {
        try {
            const parsed = JSON.parse(jsonStr)
            const ids: number[] = []
            if (parsed.eventId) ids.push(parsed.eventId)
            if (parsed.eventIds && Array.isArray(parsed.eventIds)) ids.push(...parsed.eventIds)

            if (ids.length === 0) {
                console.error('Error: "eventId" or "eventIds" array required.')
                process.exit(1)
            }
            eventService.deleteEvents(ids)
            console.log(`🗑️ Deleted events: ${ids.join(', ')}`)
        } catch (e: any) {
            console.error(`❌ Failed to delete events: ${e.message}`)
            process.exit(1)
        }
    }
}

export const eventProcessor = new EventProcessor()
