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

        todoRepo.update(id, data)
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
}

export const todoService = new TodoService()
