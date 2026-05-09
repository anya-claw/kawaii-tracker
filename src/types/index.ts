// ==================== Recurring Option ====================

export interface RecurringOption {
  type: 'daily' | 'weekly';
  target?: number; // null/undefined = 1 (single check per cycle)
}

// ==================== Tasks (renamed from Tags) ====================

export interface Task {
  id: number;
  task: string; // renamed from 'tag'
  description: string | null;
  recurring_option: string | null; // JSON string of RecurringOption, null = one-off
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateTaskDTO {
  task: string;
  description?: string;
  recurring_option?: RecurringOption;
}

export interface UpdateTaskDTO {
  description?: string;
  recurring_option?: RecurringOption | null;
}

// ==================== Events ====================

export interface Event {
  id: number;
  task_id: number; // renamed from 'tag_id'
  parent_id: number | null;
  details: string | null;
  mood: string | null;
  completed: number; // 0 or 1
  daily_mark: number; // 0 or 1
  progress: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateEventDTO {
  task: string; // renamed from 'tag'
  details?: string;
  mood?: string;
}

export interface UpdateEventDTO {
  details?: string;
  mood?: string;
}

export interface QueryDTO {
  task?: string; // renamed from 'tag'
  range?: string;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
  completed?: boolean;
  parent_id?: number | 'null';
}

export interface TaskStats {
  task_id: number; // renamed from 'tag_id'
  task: string; // renamed from 'tag'
  first_checkin_at: string | null;
  total_checkin_days: number;
  current_streak: number;
  longest_streak: number;
}

// ==================== Todo Groups ====================

export interface TodoGroup {
  id: number;
  name: string;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateTodoGroupDTO {
  name: string;
  description?: string;
  position?: number;
}

export interface UpdateTodoGroupDTO {
  name?: string;
  description?: string;
  position?: number;
}

// ==================== Todo Items ====================

export interface TodoItem {
  id: number;
  name: string;
  completed_at: string | null; // null = incomplete, non-null = completion time
  parent_id: number | null;
  group_id: number;
  recurring_option: string | null; // JSON string of RecurringOption
  started_at: string | null;
  end_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateTodoItemDTO {
  name: string;
  group_id: number;
  parent_id?: number;
  recurring_option?: RecurringOption;
  started_at?: string;
  end_at?: string;
  position?: number;
}

export interface UpdateTodoItemDTO {
  name?: string;
  group_id?: number;
  parent_id?: number | null;
  recurring_option?: RecurringOption | null;
  started_at?: string | null;
  end_at?: string | null;
  position?: number;
  completed_at?: string | null;
}

export interface TodoQueryDTO {
  group_id?: number;
  completed?: boolean;
  parent_id?: number | 'null';
  show_hidden?: boolean; // true = show completed items older than 24h
  limit?: number;
  offset?: number;
}
