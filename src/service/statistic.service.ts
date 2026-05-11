import { TrackerTag } from '../types'
import { db } from '../util/db'
import { TagStats, QueryDTO } from '../types'
import { tagRepo } from '../repo/tag.repo'
import { parseTimeString } from '../util/time'
import { differenceInDays, differenceInCalendarWeeks, differenceInCalendarMonths, startOfDay } from 'date-fns'

export class StatisticService {
    /**
     * Retrieves statistics for one or all tags, with optional time filtering.
     */
    getStatistics(query?: QueryDTO): TagStats[] {
        const tags = query?.tag ? [tagRepo.findByTag(query.tag)] : tagRepo.findAllActive()
        const activeTags = tags.filter((t): t is TrackerTag => t !== undefined)

        const stats: TagStats[] = []

        const since = query?.since ? parseTimeString(query.since) : undefined
        const until = query?.until ? parseTimeString(query.until) : undefined

        for (const tag of activeTags) {
            const tagOpts = JSON.parse(tag.options || '{}')
            const recurringType = tagOpts.recurring?.type || null

            let sql =
                'SELECT * FROM tracker_events WHERE tag_id = ? AND completed_at IS NOT NULL AND deleted_at IS NULL AND parent_id IS NULL'
            const params: any[] = [tag.id]

            if (since) {
                sql += ' AND completed_at >= ?'
                params.push(since)
            }
            if (until) {
                sql += ' AND completed_at <= ?'
                params.push(until)
            }

            sql += ' ORDER BY completed_at ASC'

            const events = db.prepare(sql).all(...params) as { completed_at: string }[]

            if (events.length === 0) {
                stats.push({
                    tag_id: tag.id,
                    recurring_type: recurringType,
                    tag: tag.tag,
                    first_checkin_at: null,
                    total_checkin_days: 0,
                    daily_streak: 0,
                    weekly_streak: 0,
                    monthly_streak: 0,
                    longest_daily_streak: 0
                })
                continue
            }

            // Find unique dates of completion
            const completedDates = [...new Set(events.map(e => new Date(e.completed_at).toISOString().split('T')[0]))]
                .sort()
                .map(d => new Date(d))
            const firstCheckinAt = events[0].completed_at

            const calcStreakObj = (dates: Date[], diffFn: (a: Date, b: Date) => number) => {
                if (dates.length === 0) return { current: 0, longest: 0 }
                let currentStreak = 1
                let tempStreak = 1
                let longest = 1
                for (let i = 1; i < dates.length; i++) {
                    const diff = diffFn(dates[i], dates[i - 1])
                    if (diff === 1) {
                        tempStreak++
                    } else if (diff > 1) {
                        if (tempStreak > longest) longest = tempStreak
                        tempStreak = 1
                    }
                }
                if (tempStreak > longest) longest = tempStreak

                // Calculate sequence ending
                const today = new Date()
                const diffToday = diffFn(today, dates[dates.length - 1])
                if (diffToday <= 1) {
                    currentStreak = tempStreak
                } else {
                    currentStreak = 0
                }
                return { current: currentStreak, longest }
            }

            const dailyStreakObj = calcStreakObj(completedDates, (a, b) =>
                differenceInDays(startOfDay(a), startOfDay(b))
            )
            const weeklyStreakObj = calcStreakObj(completedDates, (a, b) =>
                differenceInCalendarWeeks(a, b, { weekStartsOn: 1 })
            )
            const monthlyStreakObj = calcStreakObj(completedDates, (a, b) => differenceInCalendarMonths(a, b))

            const outStat: TagStats = {
                tag_id: tag.id,
                recurring_type: recurringType,
                tag: tag.tag,
                first_checkin_at: firstCheckinAt,
                total_checkin_days: completedDates.length, // target completions
                daily_streak: dailyStreakObj.current,
                longest_daily_streak: dailyStreakObj.longest
            }

            if (recurringType === 'weekly' || recurringType === 'monthly') {
                outStat.weekly_streak = weeklyStreakObj.current
            }
            if (recurringType === 'monthly') {
                outStat.monthly_streak = monthlyStreakObj.current
            }

            stats.push(outStat)
        }

        return stats
    }
}

export const statisticService = new StatisticService()
