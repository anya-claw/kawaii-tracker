#!/usr/bin/env node
import { Command } from 'commander';
import { tagProcessor } from './processor/tag.processor';
import { eventProcessor } from './processor/event.processor';
import { statisticProcessor } from './processor/statistic.processor';
import { eventService } from './service/event.service';

const program = new Command();

program
  .name('kawaii-tracker')
  .description('A cute daily habit tracker CLI')
  .version('1.0.0');

// Tags
program
  .option('--addTag <json>', 'Create a new tag. Payload: {"tag":"name", "description":"...", "is_daily":true}')
  .option('--listTag', 'List all active tags.')
  .option('--updateTag <json>', 'Update an existing tag. Payload: {"tag":"name", "update":{"description":"..."}}')
  .option('--delTag <name>', 'Soft delete a tag by name.');

// Events
program
  .option('--addEvent <json>', 'Add an event or check-in. Payload: {"tag":"name", "details":"...", "mood":"🌟"}')
  .option('--listEvent <json>', 'List events. Payload: {"query":{"tag":"study", "range":"today"}}')
  .option('--updateEvent <json>', 'Update an event. Payload: {"eventId":1, "update":{"mood":"☁️"}}')
  .option('--delEvent <json>', 'Soft delete event(s). Payload: {"eventId":1} or {"eventIds":[1,2]}');

// Statistics
program
  .option('--statistic [json]', 'Show statistics. Optional Payload: {"query":{"tag":"study", "since":"30d"}}');

// Cron Job
program
  .option('--cron-job', 'Run daily system cron job. Scans all daily tags and creates placeholders.');

program.parse(process.argv);

const options = program.opts();

if (options.addTag) tagProcessor.processAddTag(options.addTag);
else if (options.listTag) tagProcessor.processListTags();
else if (options.updateTag) tagProcessor.processUpdateTag(options.updateTag);
else if (options.delTag) tagProcessor.processDelTag(options.delTag);

else if (options.addEvent) eventProcessor.processAddEvent(options.addEvent);
else if (options.listEvent) eventProcessor.processListEvents(options.listEvent);
else if (options.updateEvent) eventProcessor.processUpdateEvent(options.updateEvent);
else if (options.delEvent) eventProcessor.processDelEvent(options.delEvent);

else if (options.statistic !== undefined) {
  if (typeof options.statistic === 'boolean') {
    statisticProcessor.processStatistics();
  } else {
    statisticProcessor.processStatistics(options.statistic);
  }
}

else if (options.cronJob) {
  try {
    eventService.cronDaily();
    console.log('✅ Daily cron job completed successfully. Placeholders created.');
  } catch (e: any) {
    console.error(`❌ Cron job failed: ${e.message}`);
    process.exit(1);
  }
}

else {
  program.help();
}
