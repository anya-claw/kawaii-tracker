import { useState } from 'react'
import styled from '@emotion/styled'
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

const ParentTaskCard = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing(2)};
    padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(2)};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    border: 1px solid ${({ theme }) => theme.colors.border};
    background-color: ${({ theme }) => theme.colors.surface};
`

const ParentLabel = styled.div`
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.textMuted};
    margin-bottom: 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
`

const ParentTitle = styled.div`
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
    font-size: 0.95rem;
`

const ParentDescription = styled.div`
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.textMuted};
    margin-top: ${({ theme }) => theme.spacing(0.5)};
`

export function SubTodoModal({ isOpen, onClose, parentItem, onCreated }: Props) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
    const [dueDate, setDueDate] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !parentItem) return
        try {
            const newTodo = await KanbanAPI.createTodo({
                todo_group_id: parentItem.todo_group_id,
                parent_id: parentItem.id,
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                due_date: dueDate || undefined,
                order_index: new Date().getTime()
            })
            onCreated(newTodo)
            resetForm()
            onClose()
        } catch (err) {
            console.error('Failed to create subtask', err)
        }
    }

    const resetForm = () => {
        setTitle('')
        setDescription('')
        setPriority('medium')
        setDueDate('')
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    if (!parentItem) return null

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add Subtask">
            <ParentTaskCard>
                <ParentLabel>Parent Task</ParentLabel>
                <ParentTitle>{parentItem.title}</ParentTitle>
                {parentItem.description && <ParentDescription>{parentItem.description}</ParentDescription>}
            </ParentTaskCard>

            <form onSubmit={handleSubmit}>
                <FormGroup>
                    <label>Subtask Title *</label>
                    <input
                        autoFocus
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="What needs to be done?"
                    />
                </FormGroup>

                <FormGroup>
                    <label>Description</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="More details about this subtask..."
                        rows={3}
                    />
                </FormGroup>

                <FormGroup>
                    <label>Priority</label>
                    <select value={priority} onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high')}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </FormGroup>

                <FormGroup>
                    <label>Due Date</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
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
