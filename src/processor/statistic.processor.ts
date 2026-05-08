import { statisticService } from '../service/statistic.service';
import { QueryDTO } from '../types';

export class StatisticProcessor {
  /**
   * Processes viewing statistics.
   */
  processStatistics(jsonStr?: string): void {
    try {
      let query: QueryDTO = {};
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (parsed.query) {
          query = parsed.query;
        }
      }

      const stats = statisticService.getStatistics(query);
      
      if (stats.length === 0) {
        console.log('No statistics available.');
        return;
      }

      console.log('\n📊 Statistics:\n');
      stats.forEach((s) => {
        console.log(`Tag: ${s.tag}`);
        console.log(`  First Check-in: ${s.first_checkin_at ? new Date(s.first_checkin_at).toLocaleString() : 'N/A'}`);
        console.log(`  Total Days: ${s.total_checkin_days}`);
        console.log(`  Current Streak: ${s.current_streak} days 🔥`);
        console.log(`  Longest Streak: ${s.longest_streak} days 🏆\n`);
      });
    } catch (e: any) {
      console.error(`❌ Failed to retrieve statistics: ${e.message}`);
      process.exit(1);
    }
  }
}

export const statisticProcessor = new StatisticProcessor();
