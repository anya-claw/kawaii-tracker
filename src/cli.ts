#!/usr/bin/env node
import { Command } from 'commander';
import { taskProcessor } from './processor/task.processor';
import { eventProcessor } from './processor/event.processor';
import { statisticProcessor } from './processor/statistic.processor';
import { todoProcessor } from './processor/todo.processor';
import { eventService } from './service/event.service';

const program = new Command();

program
  .name('kawaii-tracker')
  .description('A cute habit & todo tracker CLI')
  .version('2.0.0');

// ==================== Tasks (renamed from Tags) ====================
program
  .option('--addTask <json>', 'Create a new task. Payload: {"task":"name", "description":"...", "recurring_option":{"type":"daily"}}')
  .option('--listTask', 'List all active tasks.')
  .option('--updateTask <json>', 'Update a task. Payload: {"task":"name", "update":{"description":"..."}}')
  .option('--delTask <name>', 'Soft delete a task by name.');

// ==================== Events ====================
program
  .option('--addEvent <json>', 'Add an event/check-in. Payload: {"task":"name", "details":"...", "mood":"🌟"}')
  .option('--listEvent <json>', 'List events. Payload: {"query":{"task":"study", "range":"today"}}')
  .option('--updateEvent <json>', 'Update an event. Payload: {"eventId":1, "update":{"mood":"☁️"}}')
  .option('--delEvent <json>', 'Soft delete event(s). Payload: {"eventId":1} or {"eventIds":[1,2]}');

// ==================== Statistics ====================
program
  .option('--statistic [json]', 'Show statistics. Optional Payload: {"query":{"task":"study", "since":"30d"}}');

// ==================== Todo Groups ====================
program
  .option('--addGroup <json>', 'Create a todo group. Payload: {"name":"My Tasks", "description":"..."}')
  .option('--listGroup', 'List all todo groups.')
  .option('--updateGroup <json>', 'Update a group. Payload: {"groupId":1, "update":{"name":"..."}}')
  .option('--delGroup <json>', 'Delete a group. Payload: {"groupId":1}');

// ==================== Todo Items ====================
program
  .option('--addTodo <json>', 'Create a todo item. Payload: {"name":"Do homework", "group_id":1}')
  .option('--listTodo [json]', 'List todo items. Payload: {"query":{"group_id":1, "completed":false}}')
  .option('--updateTodo <json>', 'Update a todo item. Payload: {"itemId":1, "update":{"name":"..."}}')
  .option('--completeTodo <json>', 'Complete a todo item. Payload: {"itemId":1}')
  .option('--uncompleteTodo <json>', 'Uncomplete a todo item. Payload: {"itemId":1}')
  .option('--delTodo <json>', 'Delete a todo item. Payload: {"itemId":1}');

// ==================== Cron ====================
program
  .option('--cron-job', 'Run daily refresh cron.');

program.parse(process.argv);

const options = program.opts();

// Tasks
if (options.addTask) taskProcessor.processAddTask(options.addTask);
else if (options.listTask) taskProcessor.processListTasks();
else if (options.updateTask) taskProcessor.processUpdateTask(options.updateTask);
else if (options.delTask) taskProcessor.processDelTask(options.delTask);

// Events
else if (options.addEvent) eventProcessor.processAddEvent(options.addEvent);
else if (options.listEvent) eventProcessor.processListEvents(options.listEvent);
else if (options.updateEvent) eventProcessor.processUpdateEvent(options.updateEvent);
else if (options.delEvent) eventProcessor.processDelEvent(options.delEvent);

// Statistics
else if (options.statistic !== undefined) {
  if (typeof options.statistic === 'boolean') {
    statisticProcessor.processStatistics();
  } else {
    statisticProcessor.processStatistics(options.statistic);
  }
}

// Todo Groups
else if (options.addGroup) todoProcessor.processAddGroup(options.addGroup);
else if (options.listGroup) todoProcessor.processListGroups();
else if (options.updateGroup) todoProcessor.processUpdateGroup(options.updateGroup);
else if (options.delGroup) todoProcessor.processDelGroup(options.delGroup);

// Todo Items
else if (options.addTodo) todoProcessor.processAddItem(options.addTodo);
else if (options.listTodo !== undefined) {
  if (typeof options.listTodo === 'boolean') {
    todoProcessor.processListItems('{}');
  } else {
    todoProcessor.processListItems(options.listTodo);
  }
}
else if (options.updateTodo) todoProcessor.processUpdateItem(options.updateTodo);
else if (options.completeTodo) todoProcessor.processCompleteItem(options.completeTodo);
else if (options.uncompleteTodo) todoProcessor.processUncompleteItem(options.uncompleteTodo);
else if (options.delTodo) todoProcessor.processDelItem(options.delTodo);

// Cron
else if (options.cronJob) {
  try {
    eventService.cronRefresh();
    console.log('✅ Cron refresh completed successfully.');
  } catch (e: any) {
    console.error(`❌ Cron job failed: ${e.message}`);
    process.exit(1);
  }
}

else {
  program.help();
}
