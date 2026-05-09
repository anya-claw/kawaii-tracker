import { todoGroupRepo } from '../repo/todo_group.repo';
import { todoItemRepo } from '../repo/todo_item.repo';
import { CreateTodoGroupDTO, UpdateTodoGroupDTO, CreateTodoItemDTO, UpdateTodoItemDTO, TodoQueryDTO, TodoGroup, TodoItem } from '../types';

export class TodoService {
  // ==================== Groups ====================

  createGroup(dto: CreateTodoGroupDTO): TodoGroup {
    return todoGroupRepo.create(dto);
  }

  listGroups(): TodoGroup[] {
    return todoGroupRepo.findAllActive();
  }

  updateGroup(id: number, dto: UpdateTodoGroupDTO): void {
    const group = todoGroupRepo.findById(id);
    if (!group) throw new Error(`Todo group with ID ${id} not found.`);
    todoGroupRepo.update(id, dto);
  }

  deleteGroup(id: number): void {
    const group = todoGroupRepo.findById(id);
    if (!group) throw new Error(`Todo group with ID ${id} not found.`);
    todoGroupRepo.delete(id);
  }

  reorderGroups(positions: { id: number; position: number }[]): void {
    for (const { id, position } of positions) {
      todoGroupRepo.update(id, { position });
    }
  }

  // ==================== Items ====================

  createItem(dto: CreateTodoItemDTO): TodoItem {
    const group = todoGroupRepo.findById(dto.group_id);
    if (!group) throw new Error(`Todo group with ID ${dto.group_id} not found.`);
    if (dto.parent_id) {
      const parent = todoItemRepo.findById(dto.parent_id);
      if (!parent) throw new Error(`Parent todo item with ID ${dto.parent_id} not found.`);
    }
    return todoItemRepo.create(dto);
  }

  listItems(query: TodoQueryDTO): TodoItem[] {
    return todoItemRepo.find(query);
  }

  updateItem(id: number, dto: UpdateTodoItemDTO): void {
    const item = todoItemRepo.findById(id);
    if (!item) throw new Error(`Todo item with ID ${id} not found.`);
    todoItemRepo.update(id, dto);
  }

  completeItem(id: number): TodoItem | null {
    const result = todoItemRepo.complete(id);
    if (!result) {
      throw new Error(`Cannot complete todo item ${id}: sub-todos may not all be completed.`);
    }
    return result;
  }

  uncompleteItem(id: number): void {
    const item = todoItemRepo.findById(id);
    if (!item) throw new Error(`Todo item with ID ${id} not found.`);
    todoItemRepo.uncomplete(id);
  }

  deleteItem(id: number): void {
    const item = todoItemRepo.findById(id);
    if (!item) throw new Error(`Todo item with ID ${id} not found.`);
    todoItemRepo.delete(id);
  }

  reorderItems(positions: { id: number; position: number }[]): void {
    for (const { id, position } of positions) {
      todoItemRepo.update(id, { position });
    }
  }

  /**
   * Get a full kanban board: groups with their items.
   * Completed items are hidden after 24h unless show_hidden is true.
   */
  getBoard(showHidden = false): { group: TodoGroup; items: TodoItem[] }[] {
    const groups = todoGroupRepo.findAllActive();
    return groups.map(group => ({
      group,
      items: todoItemRepo.find({ group_id: group.id, completed: false }),
      completed_items: todoItemRepo.find({ group_id: group.id, completed: true, show_hidden: showHidden }),
    }));
  }
}

export const todoService = new TodoService();
