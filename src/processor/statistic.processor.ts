import { statisticService } from '../service/statistic.service'
import { QueryDTO } from '../types'

export class StatisticProcessor {
    /**
     * Processes viewing statistics.
     */
    processStatistics(jsonStr?: string): void {
        try {
            let query: QueryDTO = {}
            if (jsonStr) {
                const parsed = JSON.parse(jsonStr)
                if (parsed.query) {
                    query = parsed.query
                }
            }

            const stats = statisticService.getStatistics(query)

            if (stats.length === 0) {
                console.log('No statistics available.')
                return
            }

            console.log('\n📊 Statistics:\n')
            stats.forEach(s => {
                console.log(`Tag: ${s.tag} [${s.recurring_type || 'One-off'}]`)
                console.log(
                    `  First Target Completion: ${s.first_checkin_at ? new Date(s.first_checkin_at).toLocaleString() : 'N/A'}`
                )
                console.log(`  Total Cycles Completed: ${s.total_checkin_days}`)

                const streaks: string[] = []
                if (s.recurring_type === 'monthly') streaks.push(`${s.monthly_streak} Months`)
                if (s.recurring_type === 'monthly' || s.recurring_type === 'weekly')
                    streaks.push(`${s.weekly_streak} Weeks`)
                streaks.push(`${s.daily_streak} Days`)

                console.log(`  Cascading Current Streak: ${streaks.join(' | ')} 🔥`)
                console.log(`  Longest Daily Streak: ${s.longest_daily_streak} days 🏆\n`)
            })
        } catch (e: any) {
            console.error(`❌ Failed to retrieve statistics: ${e.message}`)
            process.exit(1)
        }
    }
}

export const statisticProcessor = new StatisticProcessor()
