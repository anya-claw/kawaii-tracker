import { Tag } from "../types";
import { db } from '../util/db';
import { TagStats, QueryDTO } from '../types';
import { tagRepo } from '../repo/tag.repo';
import { formatBusinessDateStr, getBusinessDate, getOffsetHours, parseTimeString } from '../util/time';
import { differenceInDays, startOfDay, addHours } from 'date-fns';

export class StatisticService {
  /**
   * Retrieves statistics for one or all tags, with optional time filtering.
   */
  getStatistics(query?: QueryDTO): TagStats[] {
    const tags = query?.tag ? [tagRepo.findByTag(query.tag)] : tagRepo.findAllActive();
    const activeTags = tags.filter((t): t is Tag => t !== undefined);

    const stats: TagStats[] = [];

    const since = query?.since ? parseTimeString(query.since) : undefined;
    const until = query?.until ? parseTimeString(query.until) : undefined;

    for (const tag of activeTags) {
      let sql = 'SELECT * FROM events WHERE tag_id = ? AND completed = 1 AND deleted_at IS NULL';
      const params: any[] = [tag.id];

      if (since) {
        sql += ' AND created_at >= ?';
        params.push(since);
      }
      if (until) {
        sql += ' AND created_at <= ?';
        params.push(until);
      }

      sql += ' ORDER BY created_at ASC';

      const events = db.prepare(sql).all(...params) as { created_at: string }[];

      if (events.length === 0) {
        stats.push({
          tag_id: tag.id,
          tag: tag.tag,
          first_checkin_at: null,
          total_checkin_days: 0,
          current_streak: 0,
          longest_streak: 0,
        });
        continue;
      }

      const businessDates = Array.from(new Set(events.map(e => {
        const date = new Date(e.created_at);
        return formatBusinessDateStr(date);
      }))).sort();

      const totalCheckinDays = businessDates.length;
      const firstCheckinAt = events[0].created_at;

      let currentStreak = 1;
      let longestStreak = 1;
      let tempStreak = 1;

      for (let i = 1; i < businessDates.length; i++) {
        const prevDate = new Date(businessDates[i - 1]);
        const currDate = new Date(businessDates[i]);
        
        // Difference in calendar days between formatted business date strings (e.g., '2024-05-01' and '2024-05-02')
        const diff = differenceInDays(startOfDay(currDate), startOfDay(prevDate));

        if (diff === 1) {
          tempStreak++;
        } else if (diff > 1) {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 1;
        }
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }

      // Calculate current streak
      const lastDate = new Date(businessDates[businessDates.length - 1]);
      const todayStr = formatBusinessDateStr(new Date());
      const yesterdayStr = formatBusinessDateStr(new Date(new Date().getTime() - 24 * 60 * 60 * 1000));

      if (businessDates[businessDates.length - 1] === todayStr || businessDates[businessDates.length - 1] === yesterdayStr) {
        currentStreak = tempStreak;
      } else {
        currentStreak = 0;
      }

      stats.push({
        tag_id: tag.id,
        tag: tag.tag,
        first_checkin_at: firstCheckinAt,
        total_checkin_days: totalCheckinDays,
        current_streak: currentStreak,
        longest_streak: longestStreak,
      });
    }

    return stats;
  }
}

export const statisticService = new StatisticService();
