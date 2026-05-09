import { statisticService } from '../service/statistic.service';
import { taskRepo, TaskRepo } from '../repo/task.repo';
import { QueryDTO } from '../types';

export class StatisticProcessor {
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
        const task = taskRepo.findByTask(s.task);
        const recurring = task ? TaskRepo.parseRecurring(task) : null;
        const isWeekly = recurring?.type === 'weekly';
        const unit = isWeekly ? 'weeks' : 'days';
        console.log(`Task: ${s.task}${isWeekly ? ' (weekly)' : ''}`);
        console.log(`  First Check-in: ${s.first_checkin_at ? new Date(s.first_checkin_at).toLocaleString() : 'N/A'}`);
        console.log(`  Total: ${s.total_checkin_days} ${unit}`);
        console.log(`  Current Streak: ${s.current_streak} ${unit} 🔥`);
        console.log(`  Longest Streak: ${s.longest_streak} ${unit} 🏆\n`);
      });
    } catch (e: any) {
      console.error(`❌ Failed to retrieve statistics: ${e.message}`);
      process.exit(1);
    }
  }
}

export const statisticProcessor = new StatisticProcessor();
