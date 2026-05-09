import { todoService } from '../service/todo.service';
import { CreateTodoGroupDTO, UpdateTodoGroupDTO, CreateTodoItemDTO, UpdateTodoItemDTO } from '../types';

export class TodoProcessor {
  // ==================== Groups ====================

  processAddGroup(jsonStr: string): void {
    try {
      const dto = JSON.parse(jsonStr) as CreateTodoGroupDTO;
      if (!dto.name) {
        console.error('Error: "name" is required.');
        process.exit(1);
      }
      const group = todoService.createGroup(dto);
      console.log(`✨ Todo group '${group.name}' created successfully (ID: ${group.id}).`);
    } catch (e: any) {
      console.error(`❌ Failed to add group: ${e.message}`);
      process.exit(1);
    }
  }

  processListGroups(): void {
    try {
      const groups = todoService.listGroups();
      if (groups.length === 0) {
        console.log('No todo groups found. Create one with --addGroup!');
        return;
      }
      console.log('\n📋 Todo Groups:\n');
      groups.forEach((g) => {
        console.log(`- [${g.position}] ${g.name} ${g.description ? `(${g.description})` : ''} (ID: ${g.id})`);
      });
      console.log('');
    } catch (e: any) {
      console.error(`❌ Failed to list groups: ${e.message}`);
      process.exit(1);
    }
  }

  processUpdateGroup(jsonStr: string): void {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.groupId || !parsed.update) {
        console.error('Error: "groupId" and "update" object are required.');
        process.exit(1);
      }
      todoService.updateGroup(parsed.groupId, parsed.update as UpdateTodoGroupDTO);
      console.log(`✨ Group ID ${parsed.groupId} updated successfully.`);
    } catch (e: any) {
      console.error(`❌ Failed to update group: ${e.message}`);
      process.exit(1);
    }
  }

  processDelGroup(jsonStr: string): void {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.groupId) {
        console.error('Error: "groupId" is required.');
        process.exit(1);
      }
      todoService.deleteGroup(parsed.groupId);
      console.log(`🗑️ Group ID ${parsed.groupId} deleted successfully.`);
    } catch (e: any) {
      console.error(`❌ Failed to delete group: ${e.message}`);
      process.exit(1);
    }
  }

  // ==================== Items ====================

  processAddItem(jsonStr: string): void {
    try {
      const dto = JSON.parse(jsonStr) as CreateTodoItemDTO;
      if (!dto.name || !dto.group_id) {
        console.error('Error: "name" and "group_id" are required.');
        process.exit(1);
      }
      const item = todoService.createItem(dto);
      console.log(`✨ Todo item '${item.name}' created successfully (ID: ${item.id}).`);
    } catch (e: any) {
      console.error(`❌ Failed to add item: ${e.message}`);
      process.exit(1);
    }
  }

  processListItems(jsonStr: string): void {
    try {
      const parsed = JSON.parse(jsonStr);
      const query = parsed.query || {};
      const items = todoService.listItems(query);

      if (items.length === 0) {
        console.log('No todo items found matching criteria.');
        return;
      }
      console.log(`\n📝 Todo Items (Total: ${items.length}):\n`);
      items.forEach((item) => {
        const status = item.completed_at ? '✅' : '⬜';
        const parentStr = item.parent_id ? `  └─ [parent:${item.parent_id}]` : '';
        const dateStr = item.end_at ? ` ⏰ ${item.end_at}` : '';
        console.log(`${status} ${item.name}${parentStr}${dateStr} (ID: ${item.id}, Group: ${item.group_id})`);
      });
      console.log('');
    } catch (e: any) {
      console.error(`❌ Failed to list items: ${e.message}`);
      process.exit(1);
    }
  }

  processUpdateItem(jsonStr: string): void {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.itemId || !parsed.update) {
        console.error('Error: "itemId" and "update" object are required.');
        process.exit(1);
      }
      todoService.updateItem(parsed.itemId, parsed.update as UpdateTodoItemDTO);
      console.log(`✨ Item ID ${parsed.itemId} updated successfully.`);
    } catch (e: any) {
      console.error(`❌ Failed to update item: ${e.message}`);
      process.exit(1);
    }
  }

  processCompleteItem(jsonStr: string): void {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.itemId) {
        console.error('Error: "itemId" is required.');
        process.exit(1);
      }
      const result = todoService.completeItem(parsed.itemId);
      if (result) {
        console.log(`✅ Item ID ${parsed.itemId} completed!`);
      }
    } catch (e: any) {
      console.error(`❌ Failed to complete item: ${e.message}`);
      process.exit(1);
    }
  }

  processUncompleteItem(jsonStr: string): void {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.itemId) {
        console.error('Error: "itemId" is required.');
        process.exit(1);
      }
      todoService.uncompleteItem(parsed.itemId);
      console.log(`⬜ Item ID ${parsed.itemId} marked as incomplete.`);
    } catch (e: any) {
      console.error(`❌ Failed to uncomplete item: ${e.message}`);
      process.exit(1);
    }
  }

  processDelItem(jsonStr: string): void {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.itemId) {
        console.error('Error: "itemId" is required.');
        process.exit(1);
      }
      todoService.deleteItem(parsed.itemId);
      console.log(`🗑️ Item ID ${parsed.itemId} deleted successfully.`);
    } catch (e: any) {
      console.error(`❌ Failed to delete item: ${e.message}`);
      process.exit(1);
    }
  }
}

export const todoProcessor = new TodoProcessor();
