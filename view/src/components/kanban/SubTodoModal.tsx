import { useState } from 'react'
import { Modal } from '../shared/Modal'
import { FormGroup, ButtonGroup, Button } from '../shared/Form'
import { KanbanAPI } from '../../shared/api'
import type { TodoItem } from '../../shared/api/schema'

interface Props {
    isOpen: boolean
    onClose: () => void
    parentItem: TodoItem | null
    onCreated: (todo: TodoItem) => void
}

export function SubTodoModal({ isOpen, onClose, parentItem, onCreated }: Props) {
    const [title, setTitle] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !parentItem) return
        try {
            const newTodo = await KanbanAPI.createTodo({
                todo_group_id: parentItem.todo_group_id,
                parent_id: parentItem.id,
                title: title.trim(),
                priority: parentItem.priority,
                order_index: Date.now()
            })
            onCreated(newTodo)
            setTitle('')
            onClose()
        } catch (err) {
            console.error('Failed to create subtask', err)
        }
    }

    const handleClose = () => {
        setTitle('')
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Add Subtask to "${parentItem?.title || ''}"`}>
            <form onSubmit={handleSubmit}>
                <FormGroup>
                    <label>Subtask Title</label>
                    <input
                        autoFocus
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="What needs to be done?"
                    />
                </FormGroup>
                <ButtonGroup>
                    <Button type="button" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={!title.trim()}>
                        Add Subtask
                    </Button>
                </ButtonGroup>
            </form>
        </Modal>
    )
}
