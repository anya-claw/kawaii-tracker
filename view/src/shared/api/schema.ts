export interface TrackerTag {
    id: number
    tag: string
    description: string | null
    options: string
    created_at: string
}

export interface TrackerEvent {
    id: number
    tag_id: number
    tag_name: string
    parent_id: number | null
    details: string | null
    mood: string | null
    completed_at: string | null
    recurring_mark: number
    created_at: string
}

export interface TodoGroup {
    id: number
    name: string
    order_index: number
    created_at: string
    updated_at: string
    archived_at?: string | null
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
    deleted_at?: string | null
    archived_at?: string | null
}

export interface GroupWithItems {
    group: TodoGroup
    items: TodoItem[]
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

export interface CreateTodoGroupDTO {
    name: string
    order_index?: number
}

export interface UpdateTodoGroupDTO {
    name?: string
    order_index?: number
}
export interface Option {
    recurring?: {
        type?: 'daily' | 'weekly' | 'monthly' | null
    }
    repeat?: {
        target?: number
    }
}

export interface DashboardStat {
    tag: string
    description: string | null
    type: 'daily' | 'weekly' | 'monthly' | 'one-off'
    target: number
    period_completed: number
    period_progress: string
    period_done: boolean
    daily_streak: number
    weekly_streak: number
    monthly_streak: number
    longest_daily_streak: number
    total_days: number
}

export interface CreateTagDTO {
    tag: string
    description?: string
    option?: Option
}

export interface CreateEventDTO {
    tag: string
    details?: string
    mood?: string
}
