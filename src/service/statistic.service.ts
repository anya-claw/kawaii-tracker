import { Task } from "../types";
import { db } from '../util/db';
import { TaskStats, QueryDTO } from '../types';
import { taskRepo, TaskRepo } from '../repo/task.repo';
import { formatBusinessDateStr, getBusinessDate, getOffsetHours, parseTimeString, getBusinessWeekStart, formatIso } from '../util/time';
import { differenceInDays, startOfDay } from 'date-fns';

export class StatisticService {
  getStatistics(query?: QueryDTO): TaskStats[] {
    const tasks = query?.task ? [taskRepo.findByTask(query.task)] : taskRepo.findAllActive();
    const activeTasks = tasks.filter((t): t is Task => t !== undefined);

    const stats: TaskStats[] = [];

    const since = query?.since ? parseTimeString(query.since) : undefined;
    const until = query?.until ? parseTimeString(query.until) : undefined;

    for (const task of activeTasks) {
      const recurring = TaskRepo.parseRecurring(task);

      if (recurring?.type === 'weekly') {
        stats.push(this.calculateWeeklyStreak(task, recurring.target ?? 1, since, until));
        continue;
      }

      let sql = 'SELECT * FROM events WHERE task_id = ? AND completed = 1 AND deleted_at IS NULL';
      const params: any[] = [task.id];

      if (since) { sql += ' AND created_at >= ?'; params.push(since); }
      if (until) { sql += ' AND created_at <= ?'; params.push(until); }

      sql += ' ORDER BY created_at ASC';
      const events = db.prepare(sql).all(...params) as { created_at: string }[];

      if (events.length === 0) {
        stats.push({
          task_id: task.id, task: task.task,
          first_checkin_at: null, total_checkin_days: 0,
          current_streak: 0, longest_streak: 0,
        });
        continue;
      }

      const businessDates = Array.from(new Set(events.map(e =>
        formatBusinessDateStr(new Date(e.created_at))
      ))).sort();

      const totalCheckinDays = businessDates.length;
      const firstCheckinAt = events[0].created_at;

      let currentStreak = 1;
      let longestStreak = 1;
      let tempStreak = 1;

      for (let i = 1; i < businessDates.length; i++) {
        const diff = differenceInDays(
          startOfDay(new Date(businessDates[i])),
          startOfDay(new Date(businessDates[i - 1]))
        );
        if (diff === 1) {
          tempStreak++;
        } else if (diff > 1) {
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          tempStreak = 1;
        }
      }

      if (tempStreak > longestStreak) longestStreak = tempStreak;

      const todayStr = formatBusinessDateStr(new Date());
      const yesterdayStr = formatBusinessDateStr(new Date(Date.now() - 86400000));
      const lastDate = businessDates[businessDates.length - 1];
      currentStreak = (lastDate === todayStr || lastDate === yesterdayStr) ? tempStreak : 0;

      stats.push({
        task_id: task.id, task: task.task,
        first_checkin_at: firstCheckinAt, total_checkin_days: totalCheckinDays,
        current_streak: currentStreak, longest_streak: longestStreak,
      });
    }

    return stats;
  }

  private calculateWeeklyStreak(task: Task, target: number, since?: string, until?: string): TaskStats {
    let sql = `SELECT * FROM events WHERE task_id = ? AND parent_id IS NULL AND daily_mark = 1 AND deleted_at IS NULL`;
    const params: any[] = [task.id];

    if (since) { sql += ' AND created_at >= ?'; params.push(since); }
    if (until) { sql += ' AND created_at <= ?'; params.push(until); }

    sql += ' ORDER BY created_at ASC';
    const mainEvents = db.prepare(sql).all(...params) as { id: number; progress: number | null; created_at: string }[];

    if (mainEvents.length === 0) {
      return { task_id: task.id, task: task.task, first_checkin_at: null, total_checkin_days: 0, current_streak: 0, longest_streak: 0 };
    }

    const currentWeekStart = getBusinessWeekStart();

    let longestStreak = 0;
    let tempStreak = 0;
    let completedWeeks = 0;
    let lastCompletedStreak = 0;

    for (const me of mainEvents) {
      const progress = me.progress || 0;
      const weekStartDate = new Date(me.created_at);
      const isCurrentWeek = weekStartDate >= currentWeekStart;

      if (isCurrentWeek) {
        lastCompletedStreak = tempStreak;
        break;
      }

      if (progress >= target) {
        completedWeeks++;
        tempStreak++;
      } else {
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 0;
      }
    }

    const allPastWeeks = mainEvents.every(me => new Date(me.created_at) < currentWeekStart);
    if (allPastWeeks) {
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      lastCompletedStreak = tempStreak;
    }

    if (tempStreak > longestStreak) longestStreak = tempStreak;

    const currentStreak = lastCompletedStreak;

    return {
      task_id: task.id,
      task: task.task,
      first_checkin_at: mainEvents[0].created_at,
      total_checkin_days: completedWeeks,
      current_streak: currentStreak,
      longest_streak: Math.max(longestStreak, lastCompletedStreak),
    };
  }
}

export const statisticService = new StatisticService();
