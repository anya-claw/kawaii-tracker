import { taskService } from '../service/task.service';
import { CreateTaskDTO, UpdateTaskDTO } from '../types';
import { TaskRepo } from '../repo/task.repo';

export class TaskProcessor {
  processAddTask(jsonStr: string): void {
    try {
      const dto = JSON.parse(jsonStr) as CreateTaskDTO;
      if (!dto.task) {
        console.error('Error: "task" is required.');
        process.exit(1);
      }
      const task = taskService.createTask(dto);
      console.log(`✨ Task '${task.task}' created successfully (ID: ${task.id}).`);
    } catch (e: any) {
      console.error(`❌ Failed to add task: ${e.message}`);
      process.exit(1);
    }
  }

  processListTasks(): void {
    try {
      const tasks = taskService.listTasks();
      if (tasks.length === 0) {
        console.log('No active tasks found. Create one with --addTask!');
        return;
      }
      console.log('\n🌟 Active Tasks:\n');
      tasks.forEach((t) => {
        const recurring = TaskRepo.parseRecurring(t);
        let typeStr = '[One-off]';
        if (recurring) {
          const target = recurring.target ?? 1;
          if (recurring.type === 'daily') {
            typeStr = target > 1 ? `[Daily ${target}x]` : '[Daily]';
          } else if (recurring.type === 'weekly') {
            typeStr = `[Weekly ${target}x]`;
          }
        }
        console.log(`- ${t.task} ${typeStr} ${t.description ? `(${t.description})` : ''} (ID: ${t.id})`);
      });
      console.log('');
    } catch (e: any) {
      console.error(`❌ Failed to list tasks: ${e.message}`);
      process.exit(1);
    }
  }

  processUpdateTask(jsonStr: string): void {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.task || !parsed.update) {
        console.error('Error: "task" and "update" object are required.');
        process.exit(1);
      }
      taskService.updateTask(parsed.task, parsed.update as UpdateTaskDTO);
      console.log(`✨ Task '${parsed.task}' updated successfully.`);
    } catch (e: any) {
      console.error(`❌ Failed to update task: ${e.message}`);
      process.exit(1);
    }
  }

  processDelTask(taskName: string): void {
    try {
      taskService.deleteTask(taskName);
      console.log(`🗑️ Task '${taskName}' deleted successfully.`);
    } catch (e: any) {
      console.error(`❌ Failed to delete task: ${e.message}`);
      process.exit(1);
    }
  }
}

export const taskProcessor = new TaskProcessor();
