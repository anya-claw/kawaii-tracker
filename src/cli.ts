#!/usr/bin/env node
import { Command } from 'commander'
import { tagProcessor } from './processor/tag.processor'
import { eventProcessor } from './processor/event.processor'
import { statisticProcessor } from './processor/statistic.processor'
import { todoProcessor } from './processor/todo.processor'
import { eventService } from './service/event.service'

const program = new Command()

program.name('kawaii-tracker').description('A cute daily habit tracker CLI').version('1.0.0')

// Tags
program
    .option(
        '--addTag <json>',
        'Create a new tag. Payload: {"tag":"name", "description":"...", "option":{"recurring":{"type":"daily"}, "repeat":{"target":1}}}'
    )
    .option('--listTag', 'List all active tags with their type and config.')
    .option(
        '--updateTag <json>',
        'Update an existing tag. Payload: {"tag":"name", "update":{"description":"...", "option":{"recurring":{"type":"weekly"}}}}'
    )
    .option('--delTag <name>', 'Soft delete a tag by name.')

// Events
program
    .option('--addEvent <json>', 'Add an event or check-in. Payload: {"tag":"name", "details":"...", "mood":"🌟"}')
    .option('--listEvent <json>', 'List events. Payload: {"query":{"tag":"study", "range":"today"}}')
    .option('--updateEvent <json>', 'Update an event. Payload: {"eventId":1, "update":{"mood":"☁️"}}')
    .option('--delEvent <json>', 'Soft delete event(s). Payload: {"eventId":1} or {"eventIds":[1,2]}')

// Statistics
program.option('--statistic [json]', 'Show statistics. Optional Payload: {"query":{"tag":"study", "since":"30d"}}')

// Todo
program
    .option('--addGroup <json>', 'Create a new Kanban group. Payload: {"name":"Backlog", "order_index":0}')
    .option('--listGroups', 'List all Kanban groups and their tasks.')
    .option(
        '--addTodo <json>',
        'Add a Todo task. Payload: {"todo_group_id":1, "title":"Task", "priority":"high", "parent_id":null, "due_date":"2026-05-20"}'
    )
    .option(
        '--updateTodo <json>',
        'Update an existing Todo. Payload: {"id":1, "status":"done", "order_index":0, "todo_group_id":2}'
    )
    .option('--delTodo <id>', 'Delete a Todo task by ID.')

// Cron Job
program.option(
    '--cron-job',
    'Run system cron job. Scans all tags with recurring config (daily/weekly/monthly) and creates placeholders.'
)

program.parse(process.argv)

const options = program.opts()

const parseJSON = (str: string) => {
    try {
        return JSON.parse(str.replace(/'/g, '"'))
    } catch {
        return JSON.parse(str)
    }
}

if (options.addTag) tagProcessor.processAddTag(options.addTag)
else if (options.listTag) tagProcessor.processListTags()
else if (options.updateTag) tagProcessor.processUpdateTag(options.updateTag)
else if (options.delTag) tagProcessor.processDelTag(options.delTag)
else if (options.addEvent) eventProcessor.processAddEvent(options.addEvent)
else if (options.listEvent) eventProcessor.processListEvents(options.listEvent)
else if (options.updateEvent) eventProcessor.processUpdateEvent(options.updateEvent)
else if (options.delEvent) eventProcessor.processDelEvent(options.delEvent)
else if (options.addGroup) todoProcessor.addGroup(parseJSON(options.addGroup))
else if (options.listGroups) todoProcessor.listGroups()
else if (options.addTodo) todoProcessor.addTodo(parseJSON(options.addTodo))
else if (options.updateTodo) {
    const parsed = parseJSON(options.updateTodo)
    todoProcessor.updateTodo(parsed.id, parsed)
} else if (options.delTodo) todoProcessor.delTodo(parseInt(options.delTodo, 10))
else if (options.statistic !== undefined) {
    if (typeof options.statistic === 'boolean') {
        statisticProcessor.processStatistics()
    } else {
        statisticProcessor.processStatistics(options.statistic)
    }
} else if (options.cronJob) {
    try {
        eventService.cronDaily()
        console.log('✅ Daily cron job completed successfully. Placeholders created.')
    } catch (e: any) {
        console.error(`❌ Cron job failed: ${e.message}`)
        process.exit(1)
    }
} else {
    program.help()
}
