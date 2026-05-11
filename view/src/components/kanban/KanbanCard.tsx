import styled from '@emotion/styled'
import type { TodoItem } from '../../shared/api/schema'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

const CardContainer = styled.div<{ isDragging: boolean }>`
    background-color: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.small};
    padding: ${({ theme }) => theme.spacing(2)};
    margin-bottom: ${({ theme }) => theme.spacing(1.5)};
    box-shadow: ${({ theme, isDragging }) => (isDragging ? theme.shadows.hover : theme.shadows.soft)};
    opacity: ${({ isDragging }) => (isDragging ? 0.5 : 1)};
    cursor: grab;

    display: flex;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing(1)};

    &:hover {
        box-shadow: ${({ theme }) => theme.shadows.hover};
    }
`

const DragHandle = styled.div`
    color: ${({ theme }) => theme.colors.textMuted};
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 2px;
    cursor: grab;
    &:active {
        cursor: grabbing;
    }
`

const Content = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
`

const Title = styled.h4`
    margin: 0;
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.text};
`

const Description = styled.p`
    margin: 0;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.textMuted};
`

const PriorityBadge = styled.span<{ priority: string }>`
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: bold;
    align-self: flex-start;
    background-color: ${({ theme, priority }) =>
        priority === 'high' ? theme.colors.danger : priority === 'medium' ? '#ffd166' : theme.colors.secondary};
    color: #fff;
`

interface Props {
    item: TodoItem
}

export function KanbanCard({ item }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id.toString(),
        data: { type: 'TodoItem', item }
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    }

    return (
        <CardContainer ref={setNodeRef} style={style} isDragging={isDragging}>
            <DragHandle {...attributes} {...listeners}>
                <GripVertical size={16} />
            </DragHandle>
            <Content>
                <Title>{item.title}</Title>
                {item.description && <Description>{item.description}</Description>}
                <PriorityBadge priority={item.priority || 'low'}>
                    {(item.priority || 'low').toUpperCase()}
                </PriorityBadge>
            </Content>
        </CardContainer>
    )
}
