import { useState, useEffect, useMemo } from 'react'
import styled from '@emotion/styled'
import { KanbanAPI } from '../../shared/api'
import type { TodoItem } from '../../shared/api/schema'
import {
    CheckCircle2,
    Clock,
    Tag,
    Calendar,
    AlertCircle,
    FileText,
    ArrowUp,
    ArrowDown,
    Minus,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { CountdownBadge } from '../shared/CountdownBadge'

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
`

const FilterBar = styled.div`
    display: flex;
    gap: ${({ theme }) => theme.spacing(2)};
    align-items: center;
    flex-wrap: wrap;

    @media (max-width: 768px) {
        gap: ${({ theme }) => theme.spacing(1)};
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: ${({ theme }) => theme.spacing(1)};
    }
`

const FilterBtn = styled.button<{ active: boolean }>`
    padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
    border-radius: ${({ theme }) => theme.borderRadius.small};
    font-size: 0.9rem;
    font-weight: 600;
    transition: ${({ theme }) => theme.transitions.default};
    background-color: ${({ theme, active }) => (active ? theme.colors.primary : theme.colors.surface)};
    color: ${({ theme, active }) => (active ? 'white' : theme.colors.textMuted)};
    border: 1px solid ${({ theme, active }) => (active ? theme.colors.primary : theme.colors.border)};
    white-space: nowrap;

    &:hover {
        background-color: ${({ theme, active }) => (active ? theme.colors.primaryHover : theme.colors.sidebarHover)};
        transform: translateY(-1px);
    }

    @media (max-width: 768px) {
        font-size: 0.85rem;
        padding: 6px 12px;
    }
`

const DeletedBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 10px;
    background-color: ${({ theme }) => theme.colors.danger}20;
    color: ${({ theme }) => theme.colors.danger};
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`

const HistoryCard = styled.div`
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    padding: ${({ theme }) => theme.spacing(2.5)};
    border: 1px solid ${({ theme }) => theme.colors.success}40;
    box-shadow: ${({ theme }) => theme.shadows.card};
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
    opacity: 0.95;
    transition: ${props => props.theme.transitions.default};

    &:hover {
        opacity: 1;
        border-color: ${({ theme }) => theme.colors.success};
        box-shadow: ${({ theme }) => theme.shadows.hover};
        transform: translateY(-2px);
    }

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(2)};
    }
`

const TopRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing(2)};
`

const TitleArea = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(1.5)};
    color: ${({ theme }) => theme.colors.text};
    flex: 1;
`

const TitleText = styled.span`
    font-weight: 600;
    font-size: 1rem;
    text-decoration: line-through;
    text-decoration-color: ${({ theme }) => theme.colors.textMuted};
`

const PriorityBadge = styled.span<{ priority: string }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    padding: 3px 8px;
    border-radius: 12px;
    font-weight: 700;
    background-color: ${({ theme, priority }) =>
        priority === 'high'
            ? theme.colors.danger + '30'
            : priority === 'medium'
              ? '#ffd16630'
              : theme.colors.secondary + '30'};
    color: ${({ theme, priority }) =>
        priority === 'high' ? theme.colors.danger : priority === 'medium' ? '#d4a000' : theme.colors.secondary};
`

const StatusBadge = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 12px;
    background-color: ${({ theme }) => theme.colors.success}30;
    color: ${({ theme }) => theme.colors.success};
    font-size: 0.85rem;
    font-weight: 600;
`

const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: ${({ theme }) => theme.spacing(2)};
    padding-left: ${({ theme }) => theme.spacing(3)};
`

const InfoItem = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.textMuted};

    svg {
        color: ${({ theme }) => theme.colors.primary}60;
    }

    span {
        color: ${({ theme }) => theme.colors.text};
        font-weight: 500;
    }
`

const DescriptionText = styled.div`
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textMuted};
    padding: ${({ theme }) => theme.spacing(1.5)};
    padding-left: ${({ theme }) => theme.spacing(3)};
    background-color: ${({ theme }) => theme.colors.surfaceAlt};
    border-radius: ${({ theme }) => theme.borderRadius.small};
    margin-top: ${({ theme }) => theme.spacing(1)};
`

const TimeInfo = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: ${({ theme }) => theme.spacing(1.5)};
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.textMuted};
`

const TimeItem = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`

const PaginationBar = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.spacing(2)};
    padding: ${({ theme }) => theme.spacing(3)};
    margin-top: ${({ theme }) => theme.spacing(2)};
`

const PageInfo = styled.span`
    font-size: 0.9rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
`

const PaginationBtn = styled.button<{ disabled?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    background-color: ${({ theme, disabled }) => (disabled ? theme.colors.surfaceAlt : theme.colors.primary)};
    color: ${({ theme, disabled }) => (disabled ? theme.colors.textMuted : 'white')};
    border: 1px solid ${({ theme, disabled }) => (disabled ? theme.colors.border : theme.colors.primary)};
    font-weight: 700;
    transition: ${({ theme }) => theme.transitions.default};
    cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

    &:hover:not(:disabled) {
        background-color: ${({ theme }) => theme.colors.primaryHover};
        transform: scale(1.05);
    }
`

const EmptyText = styled.p`
    color: ${({ theme }) => theme.colors.textMuted};
    text-align: center;
    padding: 32px 0;
`

const RangeInfo = styled.p`
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.9rem;
    margin-bottom: 8px;
`

const FileIcon = styled(FileText)`
    margin-right: 8px;
    vertical-align: middle;
`

const ArchivedBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 10px;
    background-color: #f59e0b20;
    color: #d97706;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`

const RANGES = [
    { value: 'this_month', label: 'This Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'all', label: 'All Time' }
]

const ITEMS_PER_PAGE = 100

export function TodoHistory() {
    const [allHistoryItems, setAllHistoryItems] = useState<{ todo: TodoItem; groupName: string }[]>([])
    const [range, setRange] = useState('this_month')
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        KanbanAPI.getTodoHistory()
            .then(items => {
                // Sort by updated_at descending
                items.sort((a, b) => new Date(b.todo.updated_at).getTime() - new Date(a.todo.updated_at).getTime())
                setAllHistoryItems(items)
            })
            .catch(console.error)
    }, [])

    // Filter items by range
    const filteredItems = useMemo(() => {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfYear = new Date(now.getFullYear(), 0, 1)

        return allHistoryItems.filter(item => {
            const itemDate = new Date(item.todo.updated_at)
            if (range === 'this_month') {
                return itemDate >= startOfMonth
            } else if (range === 'this_year') {
                return itemDate >= startOfYear
            } else {
                return true // all
            }
        })
    }, [allHistoryItems, range])

    // Paginate items (only when range is 'all')
    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
    const paginatedItems = useMemo(() => {
        if (range === 'all') {
            const start = (currentPage - 1) * ITEMS_PER_PAGE
            const end = start + ITEMS_PER_PAGE
            return filteredItems.slice(start, end)
        }
        return filteredItems
    }, [filteredItems, currentPage, range])

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    }

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    }

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high':
                return <ArrowUp size={14} />
            case 'low':
                return <ArrowDown size={14} />
            default:
                return <Minus size={14} />
        }
    }

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1)
    }

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1)
    }

    return (
        <Container>
            <FilterBar>
                <Calendar size={18} />
                {RANGES.map(r => (
                    <FilterBtn
                        key={r.value}
                        active={range === r.value}
                        onClick={() => {
                            setRange(r.value)
                            setCurrentPage(1)
                        }}
                    >
                        {r.label}
                    </FilterBtn>
                ))}
            </FilterBar>

            {paginatedItems.length === 0 ? (
                <EmptyText>No completed tasks found.</EmptyText>
            ) : (
                <>
                    {range === 'all' ? (
                        <RangeInfo>
                            ✓ Completed Todo tasks history ({filteredItems.length} items, Page {currentPage} of
                            {totalPages})
                        </RangeInfo>
                    ) : (
                        <RangeInfo>✓ Completed Todo tasks history ({filteredItems.length} items)</RangeInfo>
                    )}

                    {paginatedItems.map(({ todo, groupName }) => {
                        const isDeleted = !!todo.deleted_at
                        const isArchived = !!todo.archived_at && !isDeleted
                        return (
                            <HistoryCard
                                key={todo.id}
                                style={
                                    isDeleted
                                        ? { opacity: 0.7, borderColor: 'rgba(255,100,100,0.3)' }
                                        : isArchived
                                          ? { opacity: 0.85, borderColor: 'rgba(245,158,11,0.3)' }
                                          : {}
                                }
                            >
                                <TopRow>
                                    <TitleArea>
                                        <CheckCircle2 size={20} />
                                        <TitleText>{todo.title}</TitleText>
                                        <PriorityBadge priority={todo.priority}>
                                            {getPriorityIcon(todo.priority)}
                                            {todo.priority.toUpperCase()}
                                        </PriorityBadge>
                                        {isDeleted && <DeletedBadge>Deleted</DeletedBadge>}
                                        {isArchived && <ArchivedBadge>Archived</ArchivedBadge>}
                                    </TitleArea>
                                    <StatusBadge
                                        style={
                                            isDeleted || isArchived
                                                ? {
                                                      backgroundColor: 'rgba(128,128,128,0.15)',
                                                      color: 'rgba(128,128,128,0.8)'
                                                  }
                                                : {}
                                        }
                                    >
                                        <CheckCircle2 size={14} /> {todo.status === 'done' ? 'Done' : todo.status}
                                    </StatusBadge>
                                </TopRow>

                                <InfoGrid>
                                    <InfoItem>
                                        <Tag size={14} />
                                        <span>{groupName}</span>
                                    </InfoItem>
                                    {todo.due_date && (
                                        <InfoItem>
                                            <CountdownBadge dueDate={todo.due_date} />
                                        </InfoItem>
                                    )}
                                    {todo.parent_id && (
                                        <InfoItem>
                                            <AlertCircle size={14} />
                                            <span>Subtask</span>
                                        </InfoItem>
                                    )}
                                </InfoGrid>

                                {todo.description && (
                                    <DescriptionText>
                                        <FileIcon size={14} />
                                        {todo.description}
                                    </DescriptionText>
                                )}

                                <TimeInfo>
                                    <TimeItem>
                                        <Clock size={14} />
                                        Created: {formatDateTime(todo.created_at)}
                                    </TimeItem>
                                    <TimeItem>
                                        <CheckCircle2 size={14} />
                                        Completed: {formatDateTime(todo.updated_at)}
                                    </TimeItem>
                                </TimeInfo>
                            </HistoryCard>
                        )
                    })}

                    {range === 'all' && totalPages > 1 && (
                        <PaginationBar>
                            <PaginationBtn disabled={currentPage === 1} onClick={handlePrevPage}>
                                <ChevronLeft size={20} />
                            </PaginationBtn>
                            <PageInfo>
                                Page {currentPage} / {totalPages}
                            </PageInfo>
                            <PaginationBtn disabled={currentPage === totalPages} onClick={handleNextPage}>
                                <ChevronRight size={20} />
                            </PaginationBtn>
                        </PaginationBar>
                    )}
                </>
            )}
        </Container>
    )
}
