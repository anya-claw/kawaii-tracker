import { todoGroupRepo } from '../repo/todo_group.repo'
import { todoRepo } from '../repo/todo.repo'
import { CreateTodoGroupDTO, CreateTodoItemDTO, UpdateTodoItemDTO, TodoGroup, TodoItem } from '../types'

export class TodoService {
    // --- Group ---
    addGroup(data: CreateTodoGroupDTO): TodoGroup {
        return todoGroupRepo.create(data.name, data.order_index)
    }

    updateGroup(id: number, data: { name?: string; order_index?: number }): TodoGroup {
        const existing = todoGroupRepo.findById(id)
        if (!existing) throw new Error(`Group ${id} not found`)
        todoGroupRepo.update(id, data)
        return todoGroupRepo.findById(id)!
    }

    deleteGroup(id: number): void {
        const existing = todoGroupRepo.findById(id)
        if (!existing) throw new Error(`Group ${id} not found`)

        // Delete all todos in this group first
        const allItems = todoRepo.findAllActive()
        const groupItems = allItems.filter(item => item.todo_group_id === id)
        for (const item of groupItems) {
            todoRepo.delete(item.id)
        }

        // Then delete the group
        todoGroupRepo.delete(id)
    }

    archiveGroup(id: number): void {
        const existing = todoGroupRepo.findById(id)
        if (!existing) throw new Error(`Group ${id} not found`)

        // Archive all todos in this group
        const allItems = todoRepo.findAllActive()
        const groupItems = allItems.filter(item => item.todo_group_id === id)
        for (const item of groupItems) {
            todoRepo.archive(item.id)
        }

        // Then archive the group
        todoGroupRepo.archive(id)
    }

    unarchiveGroup(id: number): void {
        const existing = todoGroupRepo.findById(id)
        if (!existing) throw new Error(`Group ${id} not found`)

        todoGroupRepo.unarchive(id)

        // Unarchive all todos in this group
        const allItems = todoRepo.findAllIncludingDeleted()
        const groupItems = allItems.filter(item => item.todo_group_id === id && item.archived_at)
        for (const item of groupItems) {
            todoRepo.unarchive(item.id)
        }
    }

    listGroups(): { group: TodoGroup; items: TodoItem[] }[] {
        const groups = todoGroupRepo.findAllActive()
        const allItems = todoRepo.findAllActive()

        return groups.map(group => {
            const items = allItems.filter(item => item.todo_group_id === group.id)
            return { group, items }
        })
    }

    // --- Todo Items ---
    addTodo(data: CreateTodoItemDTO): TodoItem {
        const group = todoGroupRepo.findById(data.todo_group_id)
        if (!group) throw new Error(`Group ${data.todo_group_id} not found`)

        if (data.parent_id) {
            const parent = todoRepo.findById(data.parent_id)
            if (!parent) throw new Error(`Parent item ${data.parent_id} not found`)
        }

        return todoRepo.create(data)
    }

    updateTodo(id: number, data: UpdateTodoItemDTO): TodoItem {
        const existing = todoRepo.findById(id)
        if (!existing) throw new Error(`Todo ${id} not found`)

        if (data.todo_group_id && data.todo_group_id !== existing.todo_group_id) {
            const group = todoGroupRepo.findById(data.todo_group_id)
            if (!group) throw new Error(`Target group ${data.todo_group_id} not found`)
        }

        // Block completing a parent todo if any sub-todo is not done
        if (data.status === 'done') {
            const subTodos = todoRepo.findByParent(id)
            if (subTodos.length > 0) {
                const pending = subTodos.filter(s => s.status !== 'done')
                if (pending.length > 0) {
                    throw new Error(
                        `Cannot complete todo ${id}: ${pending.length} sub-todo(s) still pending. ` +
                            `Incomplete: ${pending.map(p => `#${p.id} "${p.title}"`).join(', ')}`
                    )
                }
            }
        }

        todoRepo.update(id, data)

        // Auto-complete parent if all subtasks are done
        if (data.status === 'done' && existing.parent_id) {
            const parent = todoRepo.findById(existing.parent_id)
            if (parent && parent.status !== 'done') {
                const siblings = todoRepo.findByParent(existing.parent_id)
                const allDone = siblings.every(s => s.status === 'done')
                if (allDone) {
                    todoRepo.update(existing.parent_id, { status: 'done' })
                }
            }
        }

        return todoRepo.findById(id)!
    }

    delTodo(id: number): void {
        const existing = todoRepo.findById(id)
        if (!existing) throw new Error(`Todo ${id} not found`)

        todoRepo.delete(id)

        // cascade delete children?
        const children = todoRepo.findByParent(id)
        for (const child of children) {
            todoRepo.delete(child.id)
        }
    }

    archiveTodo(id: number): void {
        const existing = todoRepo.findById(id)
        if (!existing) throw new Error(`Todo ${id} not found`)

        todoRepo.archive(id)

        // cascade archive children
        const children = todoRepo.findByParent(id)
        for (const child of children) {
            todoRepo.archive(child.id)
        }
    }

    unarchiveTodo(id: number): void {
        const existing = todoRepo.findById(id)
        if (!existing) throw new Error(`Todo ${id} not found`)

        todoRepo.unarchive(id)
    }

    listHistory(): { todo: TodoItem; groupName: string }[] {
        const allItems = todoRepo.findAllIncludingDeleted()
        // Include archived + deleted items in history
        const historyItems = allItems.filter(item => item.deleted_at || item.archived_at)
        const groups = todoGroupRepo.findAllNonDeleted()
        const groupMap = new Map(groups.map(g => [g.id, g.name]))

        return historyItems.map(item => ({
            todo: item,
            groupName: groupMap.get(item.todo_group_id) || 'Deleted Group'
        }))
    }
}

export const todoService = new TodoService()
