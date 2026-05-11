import { todoService } from '../service/todo.service'
import { CreateTodoGroupDTO, CreateTodoItemDTO, UpdateTodoItemDTO } from '../types'

export class TodoProcessor {
    addGroup(data: CreateTodoGroupDTO) {
        try {
            const group = todoService.addGroup(data)
            console.log(`[Success] Added Todo Group '${group.name}' (ID: ${group.id})`)
        } catch (e: any) {
            console.error(`[Error] Failed to add group: ${e.message}`)
        }
    }

    listGroups() {
        const groupsWithItems = todoService.listGroups()
        if (groupsWithItems.length === 0) {
            console.log('No Kanban groups found. Create one with --addGroup!')
            return
        }

        console.log('\n=== Kanban Board ===\n')
        groupsWithItems.forEach(({ group, items }) => {
            console.log(`[Group] ${group.name} (ID: ${group.id})`)

            // Build tree: parent items
            const parents = items.filter(it => !it.parent_id)
            parents.forEach(parent => {
                this.printItem(parent, items, 1)
            })
            console.log('')
        })
    }

    private printItem(item: any, allItems: any[], depth: number) {
        const indent = '  '.repeat(depth)
        const statusIcon = item.status === 'done' ? '[x]' : item.status === 'doing' ? '[/]' : '[ ]'
        const priorityStr = item.priority === 'high' ? '(!!!)' : item.priority === 'low' ? '(↓)' : ''
        const dueStr = item.due_date ? ` due:${item.due_date}` : ''

        console.log(`${indent}${statusIcon} (ID: ${item.id}) ${item.title} ${priorityStr}${dueStr}`)

        const children = allItems.filter(it => it.parent_id === item.id)
        children.forEach(child => this.printItem(child, allItems, depth + 1))
    }

    addTodo(data: CreateTodoItemDTO) {
        try {
            const item = todoService.addTodo(data)
            console.log(`[Success] Added Todo '${item.title}' (ID: ${item.id}) to Group ${item.todo_group_id}`)
        } catch (e: any) {
            console.error(`[Error] Failed to add todo: ${e.message}`)
        }
    }

    updateTodo(id: number, data: UpdateTodoItemDTO) {
        try {
            const item = todoService.updateTodo(id, data)
            console.log(`[Success] Updated Todo (ID: ${item.id}) - Status: ${item.status}`)
        } catch (e: any) {
            console.error(`[Error] Failed to update todo: ${e.message}`)
        }
    }

    delTodo(id: number) {
        try {
            todoService.delTodo(id)
            console.log(`[Success] Deleted Todo (ID: ${id})`)
        } catch (e: any) {
            console.error(`[Error] Failed to delete todo: ${e.message}`)
        }
    }
}

export const todoProcessor = new TodoProcessor()
