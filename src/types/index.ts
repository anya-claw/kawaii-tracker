export interface Tag {
  id: number;
  tag: string;
  description: string | null;
  is_daily: number; // 0 or 1
  daily_target: number | null; // null = not daily, N = N times per day
  weekly_target: number | null; // null = not weekly, N = N times per week
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Event {
  id: number;
  tag_id: number;
  details: string | null;
  mood: string | null;
  completed: number; // 0 or 1
  daily_mark: number; // 0 or 1
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateTagDTO {
  tag: string;
  description?: string;
  is_daily?: boolean;
  daily_target?: number; // e.g. 3 = 3 times per day
  weekly_target?: number; // e.g. 4 = 4 times per week
}

export interface UpdateTagDTO {
  description?: string;
  is_daily?: boolean;
  daily_target?: number;
  weekly_target?: number;
}

export interface CreateEventDTO {
  tag: string;
  details?: string;
  mood?: string;
}

export interface UpdateEventDTO {
  details?: string;
  mood?: string;
}

export interface QueryDTO {
  tag?: string;
  range?: string;
  since?: string;
  until?: string;
  limit?: number;
  completed?: boolean;
}

export interface TagStats {
  tag_id: number;
  tag: string;
  first_checkin_at: string | null;
  total_checkin_days: number;
  current_streak: number;
  longest_streak: number;
}
