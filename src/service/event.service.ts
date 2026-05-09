import { taskRepo, TaskRepo } from '../repo/task.repo';
import { eventRepo } from '../repo/event.repo';
import { CreateEventDTO, UpdateEventDTO, QueryDTO, Event, Task, RecurringOption } from '../types';
import { parseRange, parseTimeString, formatIso, getBusinessDayStart, getBusinessWeekStart } from '../util/time';
import { getDay } from 'date-fns';

export class EventService {
  /**
   * Determines if a task uses main+sub event pattern.
   * True if: weekly recurring, or daily with target > 1.
   */
  private usesSubEvents(task: Task, recurring: RecurringOption | null): boolean {
    if (!recurring) return false;
    return recurring.type === 'weekly' || (recurring.type === 'daily' && (recurring.target ?? 1) > 1);
  }

  /**
   * Adds an event or completes a placeholder.
   */
  addEvent(dto: CreateEventDTO): Event {
    const task = taskRepo.findByTask(dto.task);
    if (!task) {
      throw new Error(`Task '${dto.task}' not found.`);
    }

    const recurring = TaskRepo.parseRecurring(task);

    // Multi-check tasks (weekly or daily_target>1): use sub-event pattern
    if (this.usesSubEvents(task, recurring)) {
      return this.addSubEvent(task, recurring!, dto);
    }

    // Single-check daily task: use placeholder pattern
    if (recurring?.type === 'daily') {
      const todayStart = formatIso(getBusinessDayStart());
      const placeholder = eventRepo.findPlaceholderForToday(task.id, todayStart);

      if (placeholder && placeholder.completed === 0) {
        eventRepo.completePlaceholder(placeholder.id, dto);
        return eventRepo.findById(placeholder.id)!;
      }
    }

    // Standalone event (one-off, no recurring)
    return eventRepo.create(task.id, dto, 1, 0);
  }

  /**
   * Adds a sub-event under the appropriate main event.
   * - Weekly task → this week's main event
   * - Daily task with target>1 → today's main event
   */
  private addSubEvent(task: Task, recurring: RecurringOption, dto: CreateEventDTO): Event {
    let mainEvent: Event | undefined;
    const target = recurring.target ?? 1;

    if (recurring.type === 'weekly') {
      const weekStart = formatIso(getBusinessWeekStart());
      mainEvent = eventRepo.findMainEventForWeek(task.id, weekStart);
      if (!mainEvent) {
        mainEvent = eventRepo.createMainEvent(task.id, target);
      }
    } else if (recurring.type === 'daily' && target > 1) {
      const todayStart = formatIso(getBusinessDayStart());
      mainEvent = eventRepo.findMainEventForToday(task.id, todayStart);
      if (!mainEvent) {
        mainEvent = eventRepo.createMainEvent(task.id, target);
      }
    }

    if (!mainEvent) {
      throw new Error(`Cannot find or create main event for task '${task.task}'.`);
    }

    return eventRepo.createSubEvent(task.id, mainEvent.id, dto);
  }

  /**
   * Lists events based on query parameters.
   */
  listEvents(query: QueryDTO): Event[] {
    // If querying a specific weekly task, always use this_week range
    const task = query.task ? taskRepo.findByTask(query.task) : undefined;
    const recurring = task ? TaskRepo.parseRecurring(task) : null;
    const isWeeklyTask = recurring?.type === 'weekly';

    if (isWeeklyTask && query.range && query.range !== 'all' && query.range !== 'this_week') {
      return eventRepo.find({
        ...query,
        ...parseRange('this_week'),
        range: undefined,
      });
    }

    // If no specific task and range is not 'all', merge: specified range + weekly tasks at this_week
    const isRangeQuery = query.range && query.range !== 'all' && query.range !== 'this_week';
    if (!query.task && isRangeQuery) {
      const weeklyTasks = taskRepo.findRecurringByType('weekly');
      if (weeklyTasks.length > 0) {
        const normalRange = parseRange(query.range);
        const weekRange = parseRange('this_week');
        const normalResults = eventRepo.find({ ...query, ...normalRange, range: undefined });
        const weeklyTaskNames = weeklyTasks.map(t => t.task);
        const weeklyResults = eventRepo.find({ ...query, ...weekRange, range: undefined });
        const seen = new Set(normalResults.map(e => e.id));
        for (const e of weeklyResults) {
          if (!seen.has(e.id)) { normalResults.push(e); seen.add(e.id); }
        }
        normalResults.sort((a, b) => b.created_at.localeCompare(a.created_at));
        const offset = query.offset || 0;
        const limit = query.limit || normalResults.length;
        return normalResults.slice(offset, offset + limit);
      }
    }

    const dbQuery: any = {
      task: query.task,
      limit: query.limit,
      offset: query.offset,
      completed: query.completed,
      parent_id: query.parent_id
    };

    if (query.range && query.range !== 'all') {
      const range = parseRange(query.range);
      dbQuery.since = range.since;
      dbQuery.until = range.until;
    } else {
      if (query.since) dbQuery.since = parseTimeString(query.since);
      if (query.until) dbQuery.until = parseTimeString(query.until);
    }

    return eventRepo.find(dbQuery);
  }

  updateEvent(eventId: number, dto: UpdateEventDTO): void {
    const event = eventRepo.findById(eventId);
    if (!event) {
      throw new Error(`Event with ID ${eventId} not found.`);
    }
    eventRepo.update(eventId, dto);
  }

  countEvents(query: QueryDTO): number {
    const dbQuery: any = {
      task: query.task,
      completed: query.completed,
      parent_id: query.parent_id
    };

    if (query.range && query.range !== 'all') {
      const range = parseRange(query.range);
      dbQuery.since = range.since;
      dbQuery.until = range.until;
    } else {
      if (query.since) dbQuery.since = parseTimeString(query.since);
      if (query.until) dbQuery.until = parseTimeString(query.until);
    }

    return eventRepo.count(dbQuery);
  }

  deleteEvents(eventIds: number[]): void {
    if (!eventIds || eventIds.length === 0) {
      throw new Error('No event IDs provided.');
    }
    eventRepo.deleteByIds(eventIds);
  }

  /**
   * Unified daily refresh cron.
   * - Daily tasks: create placeholders for today (target=1) or main events (target>1)
   * - Weekly tasks: create main events (only on Monday)
   */
  cronRefresh(): void {
    const now = new Date();
    const todayStart = formatIso(getBusinessDayStart());
    const isMonday = getDay(now) === 1;

    const allRecurring = taskRepo.findAllRecurring();

    for (const task of allRecurring) {
      const recurring = TaskRepo.parseRecurring(task);
      if (!recurring) continue;

      if (recurring.type === 'daily') {
        const target = recurring.target ?? 1;
        if (target > 1) {
          // Daily multi-check: create main event for today
          const existing = eventRepo.findMainEventForToday(task.id, todayStart);
          if (!existing) {
            eventRepo.createMainEvent(task.id, target);
          }
        } else {
          // Daily single-check: create placeholder
          const existing = eventRepo.findPlaceholderForToday(task.id, todayStart);
          if (!existing) {
            eventRepo.createPlaceholder(task.id);
          }
        }
      } else if (recurring.type === 'weekly' && isMonday) {
        const weekStart = formatIso(getBusinessWeekStart());
        const existing = eventRepo.findMainEventForWeek(task.id, weekStart);
        if (!existing) {
          eventRepo.createMainEvent(task.id, recurring.target ?? 1);
        }
      }
    }
  }

  /**
   * Checks if a task's daily quota is met.
   */
  isDailyQuotaMet(task: Task): boolean {
    const recurring = TaskRepo.parseRecurring(task);
    if (!recurring) return false;

    if (recurring.type === 'weekly') {
      const weekStart = formatIso(getBusinessWeekStart());
      const todayStart = formatIso(getBusinessDayStart());
      const mainEvent = eventRepo.findMainEventForWeek(task.id, weekStart);
      if (!mainEvent) return false;
      const dailyTarget = Math.ceil((recurring.target ?? 1) / 7);
      const todayCount = eventRepo.countSubEventsToday(mainEvent.id, todayStart);
      return todayCount >= dailyTarget;
    }

    if (recurring.type === 'daily') {
      const target = recurring.target ?? 1;
      if (target > 1) {
        const todayStart = formatIso(getBusinessDayStart());
        const mainEvent = eventRepo.findMainEventForToday(task.id, todayStart);
        if (!mainEvent) return false;
        const todayCount = eventRepo.countSubEventsToday(mainEvent.id, todayStart);
        return todayCount >= target;
      }
    }

    return false;
  }
}

export const eventService = new EventService();
