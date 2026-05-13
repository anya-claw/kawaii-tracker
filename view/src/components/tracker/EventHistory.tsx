import { useState, useEffect, useMemo } from 'react'
import styled from '@emotion/styled'
import {
    Calendar,
    Tag as TagIcon,
    Plus,
    Trash2,
    ChevronRight,
    ChevronDown,
    Check,
    Circle,
    ChevronLeft
} from 'lucide-react'
import { TrackerAPI } from '../../shared/api'
import type { TrackerEvent, DashboardStat } from '../../shared/api/schema'
import { Modal } from '../shared/Modal'
import { FormGroup, ButtonGroup, Button } from '../shared/Form'

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

const TagSelect = styled.select`
    padding: 6px 12px;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    border: 1px solid ${({ theme }) => theme.colors.border};
    outline: none;
    font-size: 0.9rem;
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    transition: ${props => props.theme.transitions.default};

    &:focus {
        border-color: ${({ theme }) => theme.colors.primary};
    }
`

const AddBar = styled.div`
    display: flex;
    gap: ${({ theme }) => theme.spacing(2)};
    align-items: center;
    padding: ${({ theme }) => theme.spacing(2)};
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    border: 1px solid ${({ theme }) => theme.colors.border};

    @media (max-width: 768px) {
        display: none; /* Use modal on mobile */
    }
`

const MobileAddBtn = styled.button`
    display: none;
    @media (max-width: 768px) {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 16px;
        background-color: ${({ theme }) => theme.colors.primary};
        color: white;
        border-radius: ${({ theme }) => theme.borderRadius.medium};
        font-weight: 700;
        font-size: 0.95rem;
        transition: ${props => props.theme.transitions.default};

        &:hover {
            background-color: ${({ theme }) => theme.colors.primaryHover};
            transform: scale(1.02);
        }
        &:active {
            transform: scale(0.98);
        }
    }
`

const AddInput = styled.input`
    flex: 1;
    padding: 8px 12px;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    border: 2px solid ${({ theme }) => theme.colors.border};
    outline: none;
    font-size: 0.9rem;
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    transition: ${({ theme }) => theme.transitions.default};

    &:focus {
        border-color: ${({ theme }) => theme.colors.primary};
        box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.sidebarHover};
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
        transform: translateY(-1px);
    }
    &:active {
        transform: translateY(0);
    }
`

const EventList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
`

const TagSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(1)};
`

const TagHeader = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(1)};
    padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
    font-size: 0.85rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.small};
    animation: fadeIn 0.2s ease;

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`

const TagCount = styled.span`
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 10px;
    background-color: ${({ theme }) => theme.colors.sidebarHover};
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 700;
`

const TagEvents = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(0.5)};
`

const EventGroup = styled.div`
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    border: 1px solid ${({ theme }) => theme.colors.border};
    overflow: hidden;
    transition: ${props => props.theme.transitions.default};
    animation: fadeInUp 0.3s ease;

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    &:hover {
        border-color: ${({ theme }) => theme.colors.primary}40;
        box-shadow: ${({ theme }) => theme.shadows.card};
    }
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

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(2)};
        gap: ${({ theme }) => theme.spacing(1.5)};
    }
`

const MainTagBadge = styled.span`
    font-size: 0.6rem;
    padding: 1px 6px;
    border-radius: 10px;
    background-color: ${({ theme }) => theme.colors.sidebarHover};
    color: ${({ theme }) => theme.colors.primary};
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
    color: ${({ done, theme }) => (done ? 'white' : theme.colors.primary)};
    background-color: ${({ done, theme }) => (done ? theme.colors.success : theme.colors.sidebarHover)};
    transition: ${props => props.theme.transitions.fast};
`

const SubRow = styled.div`
    display: flex;
    align-items: center;
    padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(2.5)};
    padding-left: ${({ theme }) => theme.spacing(6)};
    gap: ${({ theme }) => theme.spacing(2)};
    border-top: 1px dashed ${({ theme }) => theme.colors.border};
    background-color: ${({ theme }) => theme.colors.surfaceAlt};
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
        background-color: ${({ theme }) => theme.colors.sidebarHover};
    }

    @media (max-width: 768px) {
        padding-left: ${({ theme }) => theme.spacing(4)};
        padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
    }
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

    @media (max-width: 768px) {
        font-size: 0.7rem;
    }
`

const StatusIcon = styled.span<{ done: boolean }>`
    display: flex;
    align-items: center;
    color: ${({ done, theme }) => (done ? theme.colors.success : theme.colors.textMuted)};
    transition: ${props => props.theme.transitions.fast};
`

const DeleteBtn = styled.button`
    background: transparent;
    color: ${({ theme }) => theme.colors.textMuted};
    padding: 4px;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    display: flex;
    align-items: center;
    opacity: 0;
    transition: ${props => props.theme.transitions.fast};

    ${MainRow}:hover &, ${SubRow}:hover & {
        opacity: 1;
    }

    &:hover {
        color: ${({ theme }) => theme.colors.danger};
        background-color: ${({ theme }) => theme.colors.danger}20;
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

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(2)};
        gap: ${({ theme }) => theme.spacing(1.5)};
    }
`

const RANGES = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
]

const ITEMS_PER_PAGE = 100

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

const Divider = styled.div`
    width: 1px;
    height: 24px;
    background-color: ${({ theme }) => theme.colors.border};
    margin: 0 8px;
`

const EmptyText = styled.p`
    color: ${({ theme }) => theme.colors.textMuted};
    text-align: center;
    padding: 32px 0;
`

const AddTagSelect = styled(TagSelect)`
    min-width: 120px;
`

const MoodInput = styled(AddInput)`
    max-width: 100px;
`

const Spacer = styled.span`
    width: 16px;
`

const InlineIcon = styled(Plus)`
    margin-right: 6px;
`

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
    const [mobileModalOpen, setMobileModalOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)

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

    // Reset page when range or selectedTag changes
    const handleRangeChange = (newRange: string) => {
        setRange(newRange)
        setCurrentPage(1)
    }

    const handleTagChange = (newTag: string) => {
        setSelectedTag(newTag)
        setCurrentPage(1)
    }

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

    // Paginate grouped data (only when range is 'all')
    const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE)
    const paginatedGrouped = useMemo(() => {
        if (range === 'all') {
            // Flatten all events for pagination, then re-group
            const start = (currentPage - 1) * ITEMS_PER_PAGE
            const end = start + ITEMS_PER_PAGE
            const paginatedEvents = events.slice(start, end)

            const tagMap = new Map<string, GroupedEvent>()
            const mains = paginatedEvents.filter(e => e.recurring_mark === 1 && e.parent_id === null)
            const subs = paginatedEvents.filter(e => e.parent_id !== null)
            const singles = paginatedEvents.filter(e => e.recurring_mark === 0 && e.parent_id === null)

            const mainWithSubs = mains.map(m => ({
                main: m,
                subs: subs
                    .filter(s => s.parent_id === m.id)
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            }))

            for (const ms of mainWithSubs) {
                const tagName = ms.main.tag_name
                if (!tagMap.has(tagName)) tagMap.set(tagName, { tag: tagName, mainEvents: [] })
                const dashItem = dashboard.find(d => d.tag === tagName)
                tagMap.get(tagName)!.mainEvents.push({ ...ms, dashboard: dashItem })
            }

            for (const s of singles) {
                const tagName = s.tag_name
                if (!tagMap.has(tagName)) tagMap.set(tagName, { tag: tagName, mainEvents: [] })
                tagMap.get(tagName)!.mainEvents.push({ main: s, subs: [], dashboard: undefined })
            }

            return Array.from(tagMap.values())
        }
        return grouped
    }, [range, events, currentPage, dashboard, grouped])

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1)
    }

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1)
    }

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
            setAddTag('')
            setAddDetails('')
            setAddMood('')
            setMobileModalOpen(false)
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
                <Calendar size={18} />
                {RANGES.map(r => (
                    <FilterBtn key={r.value} active={range === r.value} onClick={() => handleRangeChange(r.value)}>
                        {r.label}
                    </FilterBtn>
                ))}
                <Divider />
                <TagIcon size={18} />
                <TagSelect value={selectedTag} onChange={e => handleTagChange(e.target.value)}>
                    <option value="all">All Tags</option>
                    {tags.map(t => (
                        <option key={t.tag} value={t.tag}>
                            {t.tag}
                        </option>
                    ))}
                </TagSelect>
            </FilterBar>

            {/* Desktop Add Bar */}
            <AddBar>
                <AddTagSelect value={addTag} onChange={e => setAddTag(e.target.value)}>
                    <option value="">-- Tag --</option>
                    {tags.map(t => (
                        <option key={t.tag} value={t.tag}>
                            {t.tag}
                        </option>
                    ))}
                </AddTagSelect>
                <AddInput
                    placeholder="Details (optional)"
                    value={addDetails}
                    onChange={e => setAddDetails(e.target.value)}
                />
                <MoodInput placeholder="Mood (optional)" value={addMood} onChange={e => setAddMood(e.target.value)} />
                <AddBtn onClick={handleAdd}>
                    <Plus size={16} /> Add
                </AddBtn>
            </AddBar>

            {/* Mobile Add Button */}
            <MobileAddBtn onClick={() => setMobileModalOpen(true)}>
                <Plus size={20} /> Add Event
            </MobileAddBtn>

            {/* Mobile Add Modal */}
            <Modal isOpen={mobileModalOpen} onClose={() => setMobileModalOpen(false)} title="Add New Event">
                <FormGroup>
                    <label>Tag</label>
                    <select value={addTag} onChange={e => setAddTag(e.target.value)}>
                        <option value="">-- Select Tag --</option>
                        {tags.map(t => (
                            <option key={t.tag} value={t.tag}>
                                {t.tag}
                            </option>
                        ))}
                    </select>
                </FormGroup>
                <FormGroup>
                    <label>Details</label>
                    <input
                        placeholder="What happened? (optional)"
                        value={addDetails}
                        onChange={e => setAddDetails(e.target.value)}
                    />
                </FormGroup>
                <FormGroup>
                    <label>Mood</label>
                    <input
                        placeholder="😊 🎉 😤 (optional emoji)"
                        value={addMood}
                        onChange={e => setAddMood(e.target.value)}
                    />
                </FormGroup>
                <ButtonGroup>
                    <Button onClick={() => setMobileModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleAdd} disabled={!addTag.trim()}>
                        <InlineIcon size={16} /> Add Event
                    </Button>
                </ButtonGroup>
            </Modal>

            {/* Event List - Grouped by Tag */}
            <EventList>
                {paginatedGrouped.length === 0 ? (
                    <EmptyText>No events found.</EmptyText>
                ) : (
                    paginatedGrouped.map(group => (
                        <TagSection key={group.tag}>
                            <TagHeader>
                                <TagIcon size={14} />
                                <span>{group.tag}</span>
                                <TagCount>{group.mainEvents.length}</TagCount>
                            </TagHeader>
                            <TagEvents>
                                {group.mainEvents.map(entry => {
                                    const { main, subs, dashboard: dash } = entry
                                    const isRecurring = main.recurring_mark === 1
                                    const isExpanded = expandedMain.has(main.id)

                                    if (!isRecurring) {
                                        return (
                                            <EventGroup key={main.id}>
                                                <SingleEventRow>
                                                    <StatusIcon done={!!main.completed_at}>
                                                        {main.completed_at ? <Check size={16} /> : <Circle size={16} />}
                                                    </StatusIcon>
                                                    <MainDetail>{main.details || '-'}</MainDetail>
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

                                    const target = dash?.target || 1
                                    const completed = subs.length
                                    const isDone = !!main.completed_at

                                    // For recurring (target > 1): show last SubEvent's details/mood
                                    // For single (target = 1): show completed Event's details/mood
                                    const lastSub = subs.length > 0 ? subs[subs.length - 1] : null
                                    const displayDetails =
                                        target > 1 && lastSub
                                            ? lastSub.details || main.details || '-'
                                            : isDone
                                              ? main.details || '-'
                                              : main.details || '-'
                                    const displayMood = target > 1 && lastSub ? lastSub.mood || main.mood : main.mood

                                    return (
                                        <EventGroup key={main.id}>
                                            <MainRow onClick={() => toggleExpand(main.id)}>
                                                {subs.length > 0 ? (
                                                    isExpanded ? (
                                                        <ChevronDown size={16} />
                                                    ) : (
                                                        <ChevronRight size={16} />
                                                    )
                                                ) : (
                                                    <Spacer />
                                                )}
                                                <StatusIcon done={isDone}>
                                                    {isDone ? <Check size={16} /> : <Circle size={16} />}
                                                </StatusIcon>
                                                <MainDetail>{displayDetails}</MainDetail>
                                                {displayMood && <MoodSpan>{displayMood}</MoodSpan>}
                                                <MainTagBadge>{dash?.type || 'recurring'}</MainTagBadge>
                                                <ProgressBadge done={isDone}>
                                                    {isDone
                                                        ? `✓ ${formatTime(main.completed_at!)}`
                                                        : `${completed}/${target}`}
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
                                                            {sub.completed_at ? (
                                                                <Check size={14} />
                                                            ) : (
                                                                <Circle size={14} />
                                                            )}
                                                        </StatusIcon>
                                                        <SubDetail>{sub.details || '-'}</SubDetail>
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
                            </TagEvents>
                        </TagSection>
                    ))
                )}
            </EventList>

            {/* Pagination for 'All Time' range */}
            {range === 'all' && totalPages > 1 && (
                <PaginationBar>
                    <PaginationBtn disabled={currentPage === 1} onClick={handlePrevPage}>
                        <ChevronLeft size={20} />
                    </PaginationBtn>
                    <PageInfo>
                        Page {currentPage} / {totalPages} ({events.length} events)
                    </PageInfo>
                    <PaginationBtn disabled={currentPage === totalPages} onClick={handleNextPage}>
                        <ChevronRight size={20} />
                    </PaginationBtn>
                </PaginationBar>
            )}
        </Container>
    )
}
