import { tagRepo } from '../repo/tag.repo';
import { eventRepo } from '../repo/event.repo';
import { CreateEventDTO, UpdateEventDTO, QueryDTO, Event } from '../types';
import { parseRange, parseTimeString, formatIso, getBusinessDayStart } from '../util/time';

export class EventService {
  /**
   * Adds an event or completes a placeholder.
   */
  addEvent(dto: CreateEventDTO): Event {
    const tag = tagRepo.findByTag(dto.tag);
    if (!tag) {
      throw new Error(`Tag '${dto.tag}' not found.`);
    }

    if (tag.is_daily) {
      // Find today's placeholder
      const todayStart = formatIso(getBusinessDayStart());
      const placeholder = eventRepo.findPlaceholderForToday(tag.id, todayStart);
      
      if (placeholder && placeholder.completed === 0) {
        eventRepo.completePlaceholder(placeholder.id, dto);
        return eventRepo.findById(placeholder.id)!;
      }
    }
    
    // Create new event
    return eventRepo.create(tag.id, dto, 1, 0);
  }

  /**
   * Lists events based on query parameters.
   */
  listEvents(query: QueryDTO): Event[] {
    const range = parseRange(query.range);
    
    const dbQuery: any = {
      tag: query.tag,
      limit: query.limit,
      completed: query.completed
    };

    if (query.range && query.range !== 'all') {
      dbQuery.since = range.since;
      dbQuery.until = range.until;
    } else {
      if (query.since) dbQuery.since = parseTimeString(query.since);
      if (query.until) dbQuery.until = parseTimeString(query.until);
    }

    return eventRepo.find(dbQuery);
  }

  /**
   * Updates an existing event.
   */
  updateEvent(eventId: number, dto: UpdateEventDTO): void {
    const event = eventRepo.findById(eventId);
    if (!event) {
      throw new Error(`Event with ID ${eventId} not found.`);
    }
    eventRepo.update(eventId, dto);
  }

  /**
   * Deletes one or multiple events.
   */
  deleteEvents(eventIds: number[]): void {
    if (!eventIds || eventIds.length === 0) {
      throw new Error('No event IDs provided for deletion.');
    }
    eventRepo.deleteByIds(eventIds);
  }

  /**
   * System cron job logic: creates daily placeholders.
   */
  cronDaily(): void {
    const dailyTags = tagRepo.findAllDailyActive();
    const todayStart = formatIso(getBusinessDayStart());
    
    for (const tag of dailyTags) {
      const existing = eventRepo.findPlaceholderForToday(tag.id, todayStart);
      if (!existing) {
        eventRepo.createPlaceholder(tag.id);
      }
    }
  }
}

export const eventService = new EventService();
