import { useState, useEffect, useMemo } from 'react'
import styled from '@emotion/styled'
import { Calendar, Tag as TagIcon, Plus, Trash2, ChevronRight, ChevronDown, Check, Circle } from 'lucide-react'
import { TrackerAPI } from '../../shared/api'
import type { TrackerEvent, DashboardStat } from '../../shared/api/schema'

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(3)};
`

const FilterBar = styled.div`
    display: flex;
    gap: ${({ theme }) => theme.spacing(2)};
    align-items: center;
    flex-wrap: wrap;
`

const FilterBtn = styled.button<{ active: boolean }>`
    padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
    border-radius: ${({ theme }) => theme.borderRadius.small};
    font-size: 0.9rem;
    font-weight: 600;
    transition: ${({ theme }) => theme.transitions.default};
    background-color: ${({ theme, active }) => (active ? theme.colors.primary : 'transparent')};
    color: ${({ theme, active }) => (active ? 'white' : theme.colors.textMuted)};
    border: 1px solid ${({ theme, active }) => (active ? theme.colors.primary : theme.colors.border)};

    &:hover {
        background-color: ${({ theme, active }) => (active ? theme.colors.primaryHover : theme.colors.sidebarHover)};
    }
`

const TagSelect = styled.select`
    padding: 6px 12px;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    border: 1px solid ${({ theme }) => theme.colors.border};
    outline: none;
    font-size: 0.9rem;
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
`

const AddBar = styled.div`
    display: flex;
    gap: ${({ theme }) => theme.spacing(2)};
    align-items: center;
    padding: ${({ theme }) => theme.spacing(2)};
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    border: 1px solid ${({ theme }) => theme.colors.border};
`

const AddInput = styled.input`
    flex: 1;
    padding: 8px 12px;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    border: 2px solid ${({ theme }) => theme.colors.border};
    outline: none;
    font-size: 0.9rem;
    transition: ${({ theme }) => theme.transitions.default};

    &:focus {
        border-color: ${({ theme }) => theme.colors.primary};
    }
`

const AddBtn = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
    font-weight: 700;
    font-size: 0.9rem;
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
        background-color: ${({ theme }) => theme.colors.primaryHover};
    }
`

const EventGroup = styled.div`
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    border: 1px solid ${({ theme }) => theme.colors.border};
    overflow: hidden;
`

const MainRow = styled.div`
    display: flex;
    align-items: center;
    padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(2.5)};
    gap: ${({ theme }) => theme.spacing(2)};
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
        background-color: ${({ theme }) => theme.colors.sidebarHover};
    }
`

const MainTag = styled.span`
    font-weight: 700;
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.text};
    display: flex;
    align-items: center;
    gap: 6px;
`

const MainTagBadge = styled.span`
    font-size: 0.6rem;
    padding: 1px 6px;
    border-radius: 10px;
    background-color: ${({ theme }) => theme.colors.sidebarHover};
    color: ${({ theme }) => theme.colors.primaryHover};
    font-weight: 700;
    text-transform: uppercase;
`

const MainDetail = styled.span`
    flex: 1;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textMuted};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

const ProgressBadge = styled.span<{ done: boolean }>`
    font-size: 0.8rem;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 12px;
    color: ${({ done }) => (done ? 'white' : '#ff7aa5')};
    background-color: ${({ done, theme }) => (done ? theme.colors.success : theme.colors.sidebarHover)};
`

const SubRow = styled.div`
    display: flex;
    align-items: center;
    padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(2.5)};
    padding-left: ${({ theme }) => theme.spacing(6)};
    gap: ${({ theme }) => theme.spacing(2)};
    border-top: 1px dashed ${({ theme }) => theme.colors.border};
    background-color: #fafbfc;
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
        background-color: ${({ theme }) => theme.colors.sidebarHover};
    }
`

const SubTag = styled.span`
    font-weight: 500;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.textMuted};
    display: flex;
    align-items: center;
    gap: 4px;
`

const SubDetail = styled.span`
    flex: 1;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.textMuted};
`

const MoodSpan = styled.span`
    font-size: 1.1rem;
`

const TimeStamp = styled.span`
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.textMuted};
`

const StatusIcon = styled.span<{ done: boolean }>`
    display: flex;
    align-items: center;
    color: ${({ done, theme }) => (done ? theme.colors.success : theme.colors.textMuted)};
`

const DeleteBtn = styled.button`
    background: transparent;
    color: ${({ theme }) => theme.colors.textMuted};
    padding: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    opacity: 0;
    transition: opacity 0.15s;

    ${MainRow}:hover &, ${SubRow}:hover & {
        opacity: 1;
    }

    &:hover {
        color: ${({ theme }) => theme.colors.danger};
    }
`

const SingleEventRow = styled.div`
    display: flex;
    align-items: center;
    padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(2.5)};
    gap: ${({ theme }) => theme.spacing(2)};
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
        background-color: ${({ theme }) => theme.colors.sidebarHover};
    }
`

const RANGES = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
]

interface GroupedEvent {
    tag: string
    mainEvents: {
        main: TrackerEvent
        subs: TrackerEvent[]
        dashboard?: DashboardStat
    }[]
}

export function EventHistory() {
    const [events, setEvents] = useState<TrackerEvent[]>([])
    const [dashboard, setDashboard] = useState<DashboardStat[]>([])
    const [range, setRange] = useState('today')
    const [tags, setTags] = useState<{ tag: string }[]>([])
    const [selectedTag, setSelectedTag] = useState<string>('all')
    const [addTag, setAddTag] = useState('')
    const [addDetails, setAddDetails] = useState('')
    const [addMood, setAddMood] = useState('')
    const [expandedMain, setExpandedMain] = useState<Set<number>>(new Set())

    const loadData = () => {
        Promise.all([TrackerAPI.getEvents(range), TrackerAPI.getDashboard(), TrackerAPI.getTags()])
            .then(([evts, dash, tgs]) => {
                setDashboard(dash)
                setTags(tgs)
                let filtered = evts
                if (selectedTag !== 'all') {
                    filtered = evts.filter(e => e.tag_name === selectedTag)
                }
                setEvents(filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
            })
            .catch(console.error)
    }

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range, selectedTag])

    // Group events: main events (parent_id=null, recurring_mark=1) with their sub-events
    const grouped = useMemo(() => {
        const tagMap = new Map<string, GroupedEvent>()

        // Separate main vs sub vs single
        const mains = events.filter(e => e.recurring_mark === 1 && e.parent_id === null)
        const subs = events.filter(e => e.parent_id !== null)
        const singles = events.filter(e => e.recurring_mark === 0 && e.parent_id === null)

        // Build main→sub mapping
        const mainWithSubs = mains.map(m => ({
            main: m,
            subs: subs
                .filter(s => s.parent_id === m.id)
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        }))

        // Group by tag
        for (const ms of mainWithSubs) {
            const tagName = ms.main.tag_name
            if (!tagMap.has(tagName)) tagMap.set(tagName, { tag: tagName, mainEvents: [] })
            const dashItem = dashboard.find(d => d.tag === tagName)
            tagMap.get(tagName)!.mainEvents.push({ ...ms, dashboard: dashItem })
        }

        // Singles go as their own group
        for (const s of singles) {
            const tagName = s.tag_name
            if (!tagMap.has(tagName)) tagMap.set(tagName, { tag: tagName, mainEvents: [] })
            tagMap.get(tagName)!.mainEvents.push({ main: s, subs: [], dashboard: undefined })
        }

        return Array.from(tagMap.values())
    }, [events, dashboard])

    const toggleExpand = (id: number) => {
        setExpandedMain(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleAdd = async () => {
        if (!addTag.trim()) return
        try {
            await TrackerAPI.checkIn({
                tag: addTag.trim(),
                details: addDetails.trim() || undefined,
                mood: addMood.trim() || undefined
            })
            setAddDetails('')
            setAddMood('')
            loadData()
        } catch (e) {
            console.error(e)
            alert('Failed to add event.')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this event?')) return
        try {
            await TrackerAPI.deleteEvent(id)
            loadData()
        } catch (e) {
            console.error(e)
            alert('Failed to delete event.')
        }
    }

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

    return (
        <Container>
            {/* Filter Bar */}
            <FilterBar>
                <Calendar size={18} color="#9aa0a6" />
                {RANGES.map(r => (
                    <FilterBtn key={r.value} active={range === r.value} onClick={() => setRange(r.value)}>
                        {r.label}
                    </FilterBtn>
                ))}
                <div style={{ width: '1px', height: '24px', backgroundColor: '#fae3ec', margin: '0 8px' }} />
                <TagIcon size={18} color="#9aa0a6" />
                <TagSelect value={selectedTag} onChange={e => setSelectedTag(e.target.value)}>
                    <option value="all">All Tags</option>
                    {tags.map(t => (
                        <option key={t.tag} value={t.tag}>
                            {t.tag}
                        </option>
                    ))}
                </TagSelect>
            </FilterBar>

            {/* Add Event Input */}
            <AddBar>
                <TagSelect value={addTag} onChange={e => setAddTag(e.target.value)} style={{ minWidth: '120px' }}>
                    <option value="">-- Tag --</option>
                    {tags.map(t => (
                        <option key={t.tag} value={t.tag}>
                            {t.tag}
                        </option>
                    ))}
                </TagSelect>
                <AddInput
                    placeholder="Details (optional)"
                    value={addDetails}
                    onChange={e => setAddDetails(e.target.value)}
                />
                <AddInput
                    placeholder="Mood (optional)"
                    value={addMood}
                    onChange={e => setAddMood(e.target.value)}
                    style={{ maxWidth: '100px' }}
                />
                <AddBtn onClick={handleAdd}>
                    <Plus size={16} /> Add
                </AddBtn>
            </AddBar>

            {/* Event Groups */}
            {grouped.length === 0 ? (
                <p style={{ color: '#9aa0a6', textAlign: 'center', padding: '32px 0' }}>No events found.</p>
            ) : (
                grouped.map(group => (
                    <div key={group.tag} style={{ marginBottom: '8px' }}>
                        {group.mainEvents.map(entry => {
                            const { main, subs, dashboard: dash } = entry
                            const isRecurring = main.recurring_mark === 1
                            const isExpanded = expandedMain.has(main.id)

                            if (!isRecurring) {
                                // Single (one-off) event
                                return (
                                    <EventGroup key={main.id} style={{ marginBottom: '8px' }}>
                                        <SingleEventRow>
                                            <StatusIcon done={!!main.completed_at}>
                                                {main.completed_at ? <Check size={16} /> : <Circle size={16} />}
                                            </StatusIcon>
                                            <MainTag>{main.tag_name}</MainTag>
                                            <MainDetail>{main.details || ''}</MainDetail>
                                            {main.mood && <MoodSpan>{main.mood}</MoodSpan>}
                                            <TimeStamp>
                                                {main.completed_at
                                                    ? formatTime(main.completed_at)
                                                    : formatTime(main.created_at)}
                                            </TimeStamp>
                                            <DeleteBtn onClick={() => handleDelete(main.id)}>
                                                <Trash2 size={14} />
                                            </DeleteBtn>
                                        </SingleEventRow>
                                    </EventGroup>
                                )
                            }

                            // Recurring main event with sub-events
                            const target = dash?.target || 1
                            const completed = subs.length
                            const isDone = !!main.completed_at

                            return (
                                <EventGroup key={main.id} style={{ marginBottom: '8px' }}>
                                    <MainRow onClick={() => toggleExpand(main.id)}>
                                        {subs.length > 0 ? (
                                            isExpanded ? (
                                                <ChevronDown size={16} color="#9aa0a6" />
                                            ) : (
                                                <ChevronRight size={16} color="#9aa0a6" />
                                            )
                                        ) : (
                                            <span style={{ width: '16px' }} />
                                        )}
                                        <StatusIcon done={isDone}>
                                            {isDone ? <Check size={16} /> : <Circle size={16} />}
                                        </StatusIcon>
                                        <MainTag>{main.tag_name}</MainTag>
                                        <MainTagBadge>{dash?.type || 'recurring'}</MainTagBadge>
                                        <MainDetail>{main.details || ''}</MainDetail>
                                        <ProgressBadge done={isDone}>
                                            {isDone ? `✓ ${formatTime(main.completed_at!)}` : `${completed}/${target}`}
                                        </ProgressBadge>
                                        <DeleteBtn
                                            onClick={e => {
                                                e.stopPropagation()
                                                handleDelete(main.id)
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </DeleteBtn>
                                    </MainRow>

                                    {isExpanded &&
                                        subs.map(sub => (
                                            <SubRow key={sub.id}>
                                                <StatusIcon done={!!sub.completed_at}>
                                                    {sub.completed_at ? <Check size={14} /> : <Circle size={14} />}
                                                </StatusIcon>
                                                <SubTag>
                                                    <TagIcon size={12} />
                                                    {sub.tag_name}
                                                </SubTag>
                                                <SubDetail>{sub.details || ''}</SubDetail>
                                                {sub.mood && <MoodSpan>{sub.mood}</MoodSpan>}
                                                <TimeStamp>
                                                    {sub.completed_at
                                                        ? formatTime(sub.completed_at)
                                                        : formatTime(sub.created_at)}
                                                </TimeStamp>
                                                <DeleteBtn onClick={() => handleDelete(sub.id)}>
                                                    <Trash2 size={14} />
                                                </DeleteBtn>
                                            </SubRow>
                                        ))}
                                </EventGroup>
                            )
                        })}
                    </div>
                ))
            )}
        </Container>
    )
}
