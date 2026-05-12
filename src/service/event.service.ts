import { tagRepo } from '../repo/tag.repo'
import { eventRepo } from '../repo/event.repo'
import { CreateEventDTO, UpdateEventDTO, QueryDTO, TrackerEvent } from '../types'
import { parseRange, parseTimeString, formatIso, getBusinessDayStart } from '../util/time'

export class EventService {
    /**
     * Adds an event, managing recurring cycle based on parent/child target completion logic.
     */
    addEvent(dto: CreateEventDTO): TrackerEvent {
        const tag = tagRepo.findByTag(dto.tag)
        if (!tag) {
            throw new Error(`Tag '${dto.tag}' not found.`)
        }

        const now = formatIso()
        const optionsArg = tag.options ? JSON.parse(tag.options) : {}
        const targetCount = optionsArg.repeat?.target || 1
        const recurringType = optionsArg.recurring?.type

        if (recurringType) {
            // Recurring tag: always try to find or manage the main cycle event (placeholder)
            let mainEvent = eventRepo.findActiveRecurringEvent(tag.id)

            if (targetCount > 1) {
                // Multi-target: maintain main -> sub-event chain
                if (!mainEvent) {
                    mainEvent = eventRepo.create({
                        tag_id: tag.id,
                        parent_id: null,
                        completed_at: null,
                        recurring_mark: 1
                    })
                }

                const subEvent = eventRepo.create({
                    tag_id: tag.id,
                    parent_id: mainEvent.id,
                    completed_at: now,
                    recurring_mark: 0,
                    details: dto.details,
                    mood: dto.mood
                })

                const count = eventRepo.countSubEventsByParent(mainEvent.id)
                if (count >= targetCount) {
                    eventRepo.update(mainEvent.id, { completed_at: now })
                }

                return subEvent
            } else {
                // targetCount === 1: directly complete the placeholder if it exists, otherwise create new
                if (mainEvent) {
                    eventRepo.update(mainEvent.id, {
                        completed_at: now,
                        details: dto.details,
                        mood: dto.mood
                    })
                    return eventRepo.findById(mainEvent.id)!
                } else {
                    return eventRepo.create({
                        tag_id: tag.id,
                        parent_id: null,
                        completed_at: now,
                        recurring_mark: 1, // Keep as recurring mark since it represents a cycle completion
                        details: dto.details,
                        mood: dto.mood
                    })
                }
            }
        }

        // One-off or recurring with target=1: single completed event
        return eventRepo.create({
            tag_id: tag.id,
            parent_id: null,
            completed_at: now,
            recurring_mark: 0,
            details: dto.details,
            mood: dto.mood
        })
    }

    /**
     * Lists events based on query parameters.
     */
    listEvents(query: QueryDTO): (TrackerEvent & { tag_name: string })[] {
        const range = parseRange(query.range)

        const dbQuery: QueryDTO = { ...query }

        if (query.range && query.range !== 'all') {
            dbQuery.since = range.since
            dbQuery.until = range.until
        } else {
            if (query.since) dbQuery.since = parseTimeString(query.since)
            if (query.until) dbQuery.until = parseTimeString(query.until)
        }

        return eventRepo.find(dbQuery)
    }

    /**
     * Updates an existing event.
     */
    updateEvent(eventId: number, dto: UpdateEventDTO): void {
        const event = eventRepo.findById(eventId)
        if (!event) {
            throw new Error(`Event with ID ${eventId} not found.`)
        }
        eventRepo.update(eventId, dto)
    }

    /**
     * Deletes one or multiple events.
     */
    deleteEvents(eventIds: number[]): void {
        if (!eventIds || eventIds.length === 0) {
            throw new Error('No event IDs provided for deletion.')
        }
        eventRepo.deleteByIds(eventIds)
    }

    /**
     * System cron job logic: scans recurring tags and creates placeholder marks for the new cycle.
     */
    cronDaily(): void {
        const allTags = tagRepo.findAllActive()

        for (const tag of allTags) {
            const opts = JSON.parse(tag.options)
            if (
                opts.recurring?.type === 'daily' ||
                opts.recurring?.type === 'weekly' ||
                opts.recurring?.type === 'monthly'
            ) {
                const active = eventRepo.findActiveRecurringEvent(tag.id)
                // In a real system, you'd check whether we are actually at the boundary
                // to spawn a new one (e.g. is it a new week? a new month?).
                // For simplicity per spec, we generate placeholder if missing.
                if (!active) {
                    eventRepo.create({
                        tag_id: tag.id,
                        parent_id: null,
                        completed_at: null,
                        recurring_mark: 1
                    })
                }
            }
        }
    }
}

export const eventService = new EventService()
