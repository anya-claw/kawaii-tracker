const API_BASE = '';

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ==================== Auth ====================
export const api = {
  login: (token: string) =>
    request('/api/login', { method: 'POST', body: JSON.stringify({ token }) }),

  logout: () =>
    request('/api/logout', { method: 'POST' }),

  // ==================== Tasks ====================
  getTasks: () => request('/api/tasks').then(r => r.data),

  createTask: (task: { task: string; description?: string; recurring_option?: any }) =>
    request('/api/tasks', { method: 'POST', body: JSON.stringify(task) }).then(r => r.data),

  updateTask: (name: string, update: any) =>
    request(`/api/tasks/${encodeURIComponent(name)}`, { method: 'PUT', body: JSON.stringify(update) }),

  deleteTask: (name: string) =>
    request(`/api/tasks/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  // ==================== Events ====================
  getEvents: (query?: Record<string, string>) => {
    const params = new URLSearchParams(query);
    return request(`/api/events?${params}`).then(r => r.data);
  },

  addEvent: (event: { task: string; details?: string; mood?: string }) =>
    request('/api/events', { method: 'POST', body: JSON.stringify(event) }).then(r => r.data),

  // ==================== Dashboard ====================
  getDashboard: () => request('/api/dashboard').then(r => r.data),

  // ==================== Statistics ====================
  getStatistics: (query?: Record<string, string>) => {
    const params = new URLSearchParams(query);
    return request(`/api/statistics?${params}`).then(r => r.data);
  },

  // ==================== Todo Groups ====================
  getTodoGroups: () => request('/api/todo/groups').then(r => r.data),

  createTodoGroup: (group: { name: string; description?: string }) =>
    request('/api/todo/groups', { method: 'POST', body: JSON.stringify(group) }).then(r => r.data),

  updateTodoGroup: (id: number, update: any) =>
    request(`/api/todo/groups/${id}`, { method: 'PUT', body: JSON.stringify(update) }),

  deleteTodoGroup: (id: number) =>
    request(`/api/todo/groups/${id}`, { method: 'DELETE' }),

  reorderTodoGroups: (positions: { id: number; position: number }[]) =>
    request('/api/todo/groups/reorder', { method: 'PUT', body: JSON.stringify({ positions }) }),

  // ==================== Todo Items ====================
  getTodoItems: (query?: Record<string, string>) => {
    const params = new URLSearchParams(query);
    return request(`/api/todo/items?${params}`).then(r => r.data);
  },

  getTodoBoard: (showHidden?: boolean) => {
    const params = showHidden ? '?show_hidden=true' : '';
    return request(`/api/todo/board${params}`).then(r => r.data);
  },

  createTodoItem: (item: { name: string; group_id: number; parent_id?: number; started_at?: string; end_at?: string }) =>
    request('/api/todo/items', { method: 'POST', body: JSON.stringify(item) }).then(r => r.data),

  updateTodoItem: (id: number, update: any) =>
    request(`/api/todo/items/${id}`, { method: 'PUT', body: JSON.stringify(update) }),

  completeTodoItem: (id: number) =>
    request(`/api/todo/items/${id}/complete`, { method: 'POST' }).then(r => r.data),

  uncompleteTodoItem: (id: number) =>
    request(`/api/todo/items/${id}/uncomplete`, { method: 'POST' }),

  deleteTodoItem: (id: number) =>
    request(`/api/todo/items/${id}`, { method: 'DELETE' }),

  reorderTodoItems: (positions: { id: number; position: number }[]) =>
    request('/api/todo/items/reorder', { method: 'PUT', body: JSON.stringify({ positions }) }),
};
