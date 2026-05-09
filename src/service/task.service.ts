import { taskRepo, TaskRepo } from '../repo/task.repo';
import { CreateTaskDTO, UpdateTaskDTO, Task } from '../types';

export class TaskService {
  createTask(dto: CreateTaskDTO): Task {
    const existing = taskRepo.findByTask(dto.task);
    if (existing) {
      throw new Error(`Task '${dto.task}' already exists.`);
    }
    return taskRepo.create(dto);
  }

  listTasks(): Task[] {
    return taskRepo.findAllActive();
  }

  updateTask(taskName: string, dto: UpdateTaskDTO): void {
    const task = taskRepo.findByTask(taskName);
    if (!task) {
      throw new Error(`Task '${taskName}' not found.`);
    }
    taskRepo.update(taskName, dto);
  }

  deleteTask(taskName: string): void {
    const task = taskRepo.findByTask(taskName);
    if (!task) {
      throw new Error(`Task '${taskName}' not found.`);
    }
    taskRepo.delete(taskName);
  }
}

export const taskService = new TaskService();
