import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { Plus, X, CheckSquare, Square, Clock, ListTodo, ChevronRight, CornerDownRight, GripVertical } from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem(props: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: props.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* We pass listeners to a specific drag handle inside the child */}
      {React.cloneElement(props.children, { dragListeners: listeners })}
    </div>
  );
}

export function TodoBoard() {
  const [board, setBoard] = useState<any[]>([]);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddItem, setShowAddItem] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState<number | null>(null);
  
  // Forms
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemParent, setNewItemParent] = useState<number | undefined>();
  const [newItemEndAt, setNewItemEndAt] = useState('');

  const loadBoard = useCallback(async () => {
    try {
      const data = await api.getTodoBoard();
      setBoard(data);
    } catch (e) {
      console.error('Failed to load board:', e);
    }
  }, []);

  useEffect(() => { loadBoard(); }, [loadBoard]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent, groupId: number) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setBoard((prev) => {
        const newBoard = [...prev];
        const colIndex = newBoard.findIndex(c => c.group.id === groupId);
        if (colIndex === -1) return prev;
        
        const col = newBoard[colIndex];
        const oldIndex = col.items.findIndex((i: any) => i.id === active.id);
        const newIndex = col.items.findIndex((i: any) => i.id === over?.id);
        
        const newItems = arrayMove(col.items, oldIndex, newIndex);
        col.items = newItems;
        
        // Update positions on backend
        const positions = newItems.map((item: any, index: number) => ({ id: item.id, position: index }));
        api.reorderTodoItems(positions).catch(e => console.error('Failed to reorder:', e));
        
        return newBoard;
      });
    }
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await api.createTodoGroup({ name: newGroupName, description: newGroupDesc || undefined });
      setNewGroupName('');
      setNewGroupDesc('');
      setShowAddGroup(false);
      loadBoard();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAddItem = async (groupId: number) => {
    if (!newItemName.trim()) return;
    try {
      await api.createTodoItem({
        name: newItemName,
        group_id: groupId,
        parent_id: newItemParent,
        end_at: newItemEndAt ? new Date(newItemEndAt).toISOString() : undefined,
      });
      setNewItemName('');
      setNewItemParent(undefined);
      setNewItemEndAt('');
      setShowAddItem(null);
      loadBoard();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleComplete = async (item: any) => {
    try {
      if (item.completed_at) {
        await api.uncompleteTodoItem(item.id);
      } else {
        await api.completeTodoItem(item.id);
      }
      loadBoard();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTodoItem(id);
      loadBoard();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('Delete this group and all its tasks?')) return;
    try {
      await api.deleteTodoGroup(id);
      loadBoard();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const renderItemContent = (item: any, isSub = false, dragListeners: any = {}) => (
    <div 
      className={`group relative bg-white dark:bg-[#1a1a2e] border rounded-xl mb-3 transition-all duration-200
        ${item.completed_at 
          ? 'border-gray-100 dark:border-gray-800/60 opacity-60 hover:opacity-100' 
          : 'border-gray-200 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700/50 hover:shadow-sm'
        }
        ${isSub ? 'ml-6 relative before:content-[""] before:absolute before:-left-4 before:top-6 before:w-3 before:h-px before:bg-gray-300 dark:before:bg-gray-700' : ''}
      `}
    >
      <div className="p-4 flex items-start gap-3">
        <div {...dragListeners} className="mt-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 dark:text-gray-700 dark:hover:text-gray-500 hidden group-hover:block absolute -left-1">
          <GripVertical size={16} />
        </div>
        
        <button 
          onClick={() => handleToggleComplete(item)}
          className={`mt-0.5 ml-1 flex-shrink-0 transition-colors ${
            item.completed_at 
              ? 'text-green-500 hover:text-green-600' 
              : 'text-gray-300 dark:text-gray-600 hover:text-brand-500'
          }`}
        >
          {item.completed_at ? <CheckSquare size={20} /> : <Square size={20} />}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-relaxed truncate ${
            item.completed_at ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'
          }`}>
            {item.name}
          </p>
          
          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            <span className="text-gray-400 dark:text-gray-500 font-mono">#{item.id}</span>
            {item.end_at && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${
                new Date(item.end_at) < new Date() && !item.completed_at
                  ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 font-medium'
                  : 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                <Clock size={12} />
                {new Date(item.end_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => handleDeleteItem(item.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Task Board</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your projects and to-dos</p>
        </div>
        <button 
          onClick={() => setShowAddGroup(true)}
          className="px-4 py-2 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/40 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> New Column
        </button>
      </header>

      {board.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-100 dark:border-gray-800 border-dashed">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <ListTodo size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Your board is empty</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Create a column to start organizing your tasks</p>
          <button 
            onClick={() => setShowAddGroup(true)}
            className="px-6 py-2.5 bg-brand-600 text-white hover:bg-brand-700 rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> Add First Column
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-6 min-h-[500px] h-full">
            {board.map(col => {
              const parentItems = col.items.filter((i: any) => !i.parent_id);
              const subItems = col.items.filter((i: any) => i.parent_id);
              const parentIds = parentItems.map((i: any) => i.id);

              return (
                <div key={col.group.id} className="w-[340px] shrink-0 flex flex-col bg-gray-50/50 dark:bg-[#0f0f0f] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-[#1a1a2e]/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900 dark:text-white">{col.group.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {parentItems.length}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteGroup(col.group.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, col.group.id)}>
                      <SortableContext items={parentIds} strategy={verticalListSortingStrategy}>
                        {parentItems.map((parent: any) => {
                          const children = subItems.filter((s: any) => s.parent_id === parent.id);
                          return (
                            <SortableItem key={parent.id} id={parent.id}>
                              <div>
                                {renderItemContent(parent)}
                                {children.length > 0 && (
                                  <div className="relative">
                                    <div className="absolute left-[22px] top-[-12px] bottom-6 w-px bg-gray-200 dark:bg-gray-800" />
                                    {children.map((child: any) => (
                                      <div key={child.id}>{renderItemContent(child, true)}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </SortableItem>
                          );
                        })}
                      </SortableContext>
                    </DndContext>

                    {col.completed_items.length > 0 && (
                      <div className="mt-6">
                        <button
                          onClick={() => setShowCompleted(showCompleted === col.group.id ? null : col.group.id)}
                          className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-3 w-full"
                        >
                          {showCompleted === col.group.id ? <ChevronRight className="rotate-90 transition-transform" size={14} /> : <ChevronRight size={14} className="transition-transform" />}
                          Completed ({col.completed_items.length})
                        </button>
                        
                        <div className={`transition-all duration-300 overflow-hidden ${showCompleted === col.group.id ? 'opacity-100' : 'max-h-0 opacity-0'}`}>
                          {col.completed_items.map((item: any) => (
                            <div key={item.id}>{renderItemContent(item, !!item.parent_id)}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-[#1a1a2e]/50 backdrop-blur-sm shrink-0">
                    {showAddItem === col.group.id ? (
                      <div className="bg-white dark:bg-[#1a1a2e] border border-brand-200 dark:border-brand-900/50 shadow-[0_0_15px_rgba(124,92,252,0.1)] rounded-xl p-3 animate-in zoom-in-95 duration-200">
                        <input
                          autoFocus
                          placeholder="What needs to be done?"
                          className="w-full bg-transparent outline-none text-sm mb-3 placeholder-gray-400 dark:text-white"
                          value={newItemName}
                          onChange={e => setNewItemName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddItem(col.group.id);
                            if (e.key === 'Escape') setShowAddItem(null);
                          }}
                        />
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CornerDownRight size={14} />
                            <input
                              type="number"
                              placeholder="Parent ID (Optional)"
                              className="bg-gray-50 dark:bg-[#0f0f0f] border border-gray-100 dark:border-gray-800 rounded-md px-2 py-1 outline-none w-full dark:text-white"
                              value={newItemParent ?? ''}
                              onChange={e => setNewItemParent(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock size={14} />
                            <input
                              type="date"
                              className="bg-gray-50 dark:bg-[#0f0f0f] border border-gray-100 dark:border-gray-800 rounded-md px-2 py-1 outline-none w-full dark:text-white"
                              value={newItemEndAt}
                              onChange={e => setNewItemEndAt(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setShowAddItem(null)} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
                          <button onClick={() => handleAddItem(col.group.id)} className="px-3 py-1.5 text-xs font-medium bg-brand-600 text-white hover:bg-brand-700 rounded-lg">Add Task</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddItem(col.group.id)}
                        className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-[#222244] hover:text-brand-600 dark:hover:text-brand-400 rounded-xl transition-all"
                      >
                        <Plus size={16} /> Add Task
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAddGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">New Column</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create a new group for tasks</p>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  placeholder="e.g. In Progress"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-gray-900 dark:text-white transition-all"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0f0f0f]/50 flex justify-end gap-3">
              <button 
                onClick={() => setShowAddGroup(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddGroup}
                className="px-5 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors flex items-center gap-2"
              >
                Create Column
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
