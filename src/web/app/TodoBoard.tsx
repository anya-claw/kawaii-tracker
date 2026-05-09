import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';

interface TodoGroup {
  id: number;
  name: string;
  description: string | null;
  position: number;
}

interface TodoItem {
  id: number;
  name: string;
  completed_at: string | null;
  parent_id: number | null;
  group_id: number;
  started_at: string | null;
  end_at: string | null;
  position: number;
}

interface BoardColumn {
  group: TodoGroup;
  items: TodoItem[];
  completed_items: TodoItem[];
}

export function TodoBoard() {
  const [board, setBoard] = useState<BoardColumn[]>([]);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddItem, setShowAddItem] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState<number | null>(null);
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
        end_at: newItemEndAt || undefined,
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

  const handleToggleComplete = async (item: TodoItem) => {
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
    if (!confirm('Delete this todo?')) return;
    try {
      await api.deleteTodoItem(id);
      loadBoard();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('Delete this group and all its items?')) return;
    try {
      await api.deleteTodoGroup(id);
      loadBoard();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const renderItems = (items: TodoItem[], isSub = false) => {
    return items.map(item => (
      <div key={item.id} className={isSub ? 'sub-todo' : ''}>
        <div
          className={`todo-item ${item.completed_at ? 'completed' : ''}`}
          onClick={() => handleToggleComplete(item)}
        >
          <div className="todo-item-header">
            <div className={`todo-checkbox ${item.completed_at ? 'checked' : ''}`} />
            <span className={`todo-name ${item.completed_at ? 'completed' : ''}`}>
              {item.name}
            </span>
            <button
              className="btn btn-danger btn-sm"
              style={{ padding: '2px 6px', fontSize: '0.7rem' }}
              onClick={e => { e.stopPropagation(); handleDeleteItem(item.id); }}
            >
              ×
            </button>
          </div>
          {item.end_at && (
            <div className="todo-meta">⏰ Due: {new Date(item.end_at).toLocaleDateString()}</div>
          )}
        </div>
      </div>
    ));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddGroup(true)}>
          + New Group
        </button>
      </div>

      {board.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">📋</div>
          <p>No todo groups yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="kanban">
          {board.map(col => {
            const parentItems = col.items.filter(i => !i.parent_id);
            const subItems = col.items.filter(i => i.parent_id);

            return (
              <div className="kanban-column" key={col.group.id}>
                <div className="kanban-header">
                  <h3>{col.group.name}</h3>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span className="kanban-count">{parentItems.length}</span>
                    {col.completed_items.length > 0 && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                        onClick={() => setShowCompleted(showCompleted === col.group.id ? null : col.group.id)}
                      >
                        ✅ {col.completed_items.length}
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                      onClick={() => handleDeleteGroup(col.group.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>

                {renderItems(parentItems)}

                {parentItems.map(parent => {
                  const children = subItems.filter(s => s.parent_id === parent.id);
                  return children.length > 0 ? (
                    <div key={`sub-${parent.id}`} className="sub-todo">
                      {renderItems(children, true)}
                    </div>
                  ) : null;
                })}

                {showCompleted === col.group.id && col.completed_items.length > 0 && (
                  <div style={{ marginTop: 8, opacity: 0.6 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 4 }}>
                      Completed (24h)
                    </div>
                    {renderItems(col.completed_items)}
                  </div>
                )}

                {showAddItem === col.group.id ? (
                  <div style={{ marginTop: 8 }}>
                    <input
                      className="input"
                      placeholder="Todo name..."
                      value={newItemName}
                      onChange={e => setNewItemName(e.target.value)}
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleAddItem(col.group.id)}
                    />
                    <div className="input-group" style={{ marginTop: 8 }}>
                      <label className="input-label">Parent ID (optional, for sub-todo)</label>
                      <input
                        className="input"
                        type="number"
                        placeholder="Parent ID"
                        value={newItemParent ?? ''}
                        onChange={e => setNewItemParent(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Due date (optional)</label>
                      <input
                        className="input"
                        type="date"
                        value={newItemEndAt}
                        onChange={e => setNewItemEndAt(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAddItem(col.group.id)}>Add</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowAddItem(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: 8, width: '100%' }}
                    onClick={() => setShowAddItem(col.group.id)}
                  >
                    + Add Todo
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddGroup && (
        <div className="modal-overlay" onClick={() => setShowAddGroup(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Todo Group</h2>
            <div className="input-group">
              <label className="input-label">Name</label>
              <input
                className="input"
                placeholder="e.g. Long-term Tasks"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="input-group">
              <label className="input-label">Description (optional)</label>
              <input
                className="input"
                placeholder="..."
                value={newGroupDesc}
                onChange={e => setNewGroupDesc(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAddGroup(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddGroup}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
