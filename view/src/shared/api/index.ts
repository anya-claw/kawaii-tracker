import type {
    GroupWithItems,
    CreateTodoItemDTO,
    UpdateTodoItemDTO,
    CreateTodoGroupDTO,
    UpdateTodoGroupDTO,
    TodoItem,
    TodoGroup,
    DashboardStat,
    CreateTagDTO,
    CreateEventDTO,
    TrackerEvent,
    TrackerTag
} from './schema'

const API_BASE = '/api'

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options)
    const json = await res.json()
    if (!json.ok) {
        throw new Error(json.error || 'API Request Failed')
    }
    return json.data as T
}

export const KanbanAPI = {
    getGroups: () => fetchJSON<GroupWithItems[]>(`${API_BASE}/groups`),

    createGroup: (data: CreateTodoGroupDTO) =>
        fetchJSON<TodoGroup>(`${API_BASE}/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),

    updateGroup: (id: number, data: UpdateTodoGroupDTO) =>
        fetchJSON<TodoGroup>(`${API_BASE}/groups/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),

    createTodo: (data: CreateTodoItemDTO) =>
        fetchJSON<TodoItem>(`${API_BASE}/todos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),

    updateTodo: (id: number, data: UpdateTodoItemDTO) =>
        fetchJSON<TodoItem>(`${API_BASE}/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),

    deleteTodo: (id: number) =>
        fetchJSON<void>(`${API_BASE}/todos/${id}`, {
            method: 'DELETE'
        })
}

export const TrackerAPI = {
    getDashboard: () => fetchJSON<DashboardStat[]>(`${API_BASE}/dashboard`),

    getEvents: (range?: string) =>
        fetchJSON<TrackerEvent[]>(`${API_BASE}/events${range && range !== 'all' ? `?range=${range}` : ''}`),

    getTags: () => fetchJSON<TrackerTag[]>(`${API_BASE}/tags`),

    deleteTag: (name: string) => fetchJSON<void>(`${API_BASE}/tags/${name}`, { method: 'DELETE' }),

    createTag: (data: CreateTagDTO) =>
        fetchJSON<void>(`${API_BASE}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),

    checkIn: (data: CreateEventDTO) =>
        fetchJSON<void>(`${API_BASE}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),

    deleteEvent: (id: number) => fetchJSON<void>(`${API_BASE}/events/${id}`, { method: 'DELETE' }),

    getStatistics: (tag?: string) =>
        fetchJSON<StatisticItem[]>(`${API_BASE}/statistics${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`)
}

export interface StatisticItem {
    tag: string
    current_streak: number
    longest_streak: number
    total_checkin_days: number
    first_checkin_at: string | null
}
