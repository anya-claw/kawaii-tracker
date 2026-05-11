export interface Option {
    recurring?: {
        type?: 'daily' | 'weekly' | 'monthly' | null
    }
    repeat?: {
        target?: number
    }
}

export interface TrackerTag {
    id: number
    tag: string
    description: string | null
    options: string // JSON string from DB (needs to be parsed into Option)
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export interface TrackerEvent {
    id: number
    tag_id: number
    parent_id: number | null
    details: string | null
    mood: string | null
    completed_at: string | null
    recurring_mark: number // 0 or 1
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export interface TodoGroup {
    id: number
    name: string
    order_index: number
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export interface TodoItem {
    id: number
    todo_group_id: number
    parent_id: number | null
    title: string
    description: string | null
    due_date: string | null
    priority: 'low' | 'medium' | 'high'
    status: 'pending' | 'doing' | 'done'
    order_index: number
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export interface CreateTagDTO {
    tag: string
    description?: string
    option?: Option
}

export interface UpdateTagDTO {
    description?: string
    option?: Option
}

export interface CreateEventDTO {
    tag: string
    details?: string
    mood?: string
}

export interface UpdateEventDTO {
    details?: string
    mood?: string
}

export interface CreateTodoGroupDTO {
    name: string
    order_index?: number
}

export interface CreateTodoItemDTO {
    todo_group_id: number
    parent_id?: number
    title: string
    description?: string
    due_date?: string
    priority?: 'low' | 'medium' | 'high'
    status?: 'pending' | 'doing' | 'done'
    order_index?: number
}

export interface UpdateTodoItemDTO {
    todo_group_id?: number
    parent_id?: number
    title?: string
    description?: string
    due_date?: string
    priority?: 'low' | 'medium' | 'high'
    status?: 'pending' | 'doing' | 'done'
    order_index?: number
}

export interface QueryDTO {
    tag?: string
    range?: string
    since?: string
    until?: string
    limit?: number
    completed?: boolean
}

export interface TagStats {
    tag_id: number
    tag: string
    recurring_type: 'daily' | 'weekly' | 'monthly' | null
    first_checkin_at: string | null
    total_checkin_days: number // or total completions
    current_streak?: number
    longest_streak?: number
    monthly_streak?: number
    weekly_streak?: number
    daily_streak?: number
    longest_daily_streak?: number // legacy/extended support
}
