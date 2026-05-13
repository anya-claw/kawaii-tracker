import { useState, useEffect, useCallback } from 'react'
import styled from '@emotion/styled'
import { Trophy, Flame, Calendar, Activity, Check, Repeat, Plus } from 'lucide-react'
import { TrackerAPI } from '../../shared/api'
import type { DashboardStat } from '../../shared/api/schema'
import { Modal } from '../shared/Modal'
import { FormGroup, ButtonGroup, Button } from '../shared/Form'

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(4)};
`

const SectionHeader = styled.h2`
    font-size: 1.25rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.text};
    margin: 0 0 ${({ theme }) => theme.spacing(5)} 0;
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(1.5)};
`

const CardGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: ${({ theme }) => theme.spacing(3)};
`

const HabitCard = styled.div<{ done: boolean }>`
    background: ${({ theme, done }) => (done ? theme.colors.success + '20' : theme.colors.surface)};
    border-radius: ${({ theme }) => theme.borderRadius.large};
    padding: ${({ theme }) => theme.spacing(3)};
    border: 1px solid ${({ theme, done }) => (done ? theme.colors.success + '60' : theme.colors.border)};
    box-shadow: ${({ theme }) => theme.shadows.card};
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
    transition: ${({ theme }) => theme.transitions.default};
    position: relative;
    overflow: hidden;

    &:hover {
        box-shadow: ${({ theme }) => theme.shadows.hover};
        transform: translateY(-2px);
    }
`

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(1.5)};
    margin-bottom: ${({ theme }) => theme.spacing(1)};

    h3 {
        margin: 0;
        color: ${({ theme }) => theme.colors.text};
        font-size: 1.1rem;
    }
`

const TypeBadge = styled.span`
    font-size: 0.65rem;
    padding: 2px 6px;
    border-radius: 12px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.sidebarHover};
    text-transform: uppercase;
`

const Description = styled.p`
    margin: 0 0 ${({ theme }) => theme.spacing(1)} 32px;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.textMuted};
`

const ProgressArea = styled.div`
    margin-left: 32px;
    margin-bottom: ${({ theme }) => theme.spacing(2)};
`

const ProgressLabel = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.textMuted};
    margin-bottom: 4px;
`

const ProgressBar = styled.div`
    width: 100%;
    height: 8px;
    background-color: ${({ theme }) => theme.colors.border};
    border-radius: 4px;
    overflow: hidden;

    div {
        height: 100%;
        background-color: ${({ theme }) => theme.colors.primary};
        transition: width 0.3s ease;
        border-radius: 4px;
    }
`

const CheckButton = styled.button<{ done: boolean }>`
    position: absolute;
    top: ${({ theme }) => theme.spacing(2.5)};
    right: ${({ theme }) => theme.spacing(2.5)};
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: ${({ theme, done }) => (done ? theme.colors.success : theme.colors.sidebarHover)};
    color: ${({ theme, done }) => (done ? 'white' : theme.colors.textMuted)};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
        background-color: ${({ theme, done }) => (done ? theme.colors.success : theme.colors.primary)};
        color: white;
        transform: scale(1.1);
    }
    &:active {
        transform: scale(0.95);
    }
`

const StatsRow = styled.div`
    display: flex;
    gap: ${({ theme }) => theme.spacing(3)};
    margin-left: 32px;
    flex-wrap: wrap;
`

const OverallSummary = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: ${({ theme }) => theme.spacing(3)};
    margin-bottom: ${({ theme }) => theme.spacing(1)};
    padding: ${({ theme }) => theme.spacing(3)};
    background: linear-gradient(
        135deg,
        ${({ theme }) => `${theme.colors.primary}15`},
        ${({ theme }) => `${theme.colors.secondary}15`}
    );
    border-radius: ${({ theme }) => theme.borderRadius.large};
    border: 1px dashed ${({ theme }) => theme.colors.primary}40;
`

const SummaryStat = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;

    span {
        font-size: 0.8rem;
        font-weight: 700;
        color: ${({ theme }) => theme.colors.textMuted};
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    strong {
        font-size: 1.8rem;
        font-family: 'Misans', sans-serif;
        color: ${({ theme }) => theme.colors.primary};
    }
`

const StatItem = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 600;

    strong {
        color: ${({ theme }) => theme.colors.text};
    }
`

const IconBox = styled.div`
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: ${({ theme }) => theme.colors.sidebarHover};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.primary};
`

const EmptyMessage = styled.p`
    color: ${({ theme }) => theme.colors.textMuted};
`

export function TrackerStatistic() {
    const [stats, setStats] = useState<DashboardStat[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedTag, setSelectedTag] = useState<string>('')
    const [details, setDetails] = useState('')
    const [mood, setMood] = useState('')

    const loadData = useCallback(async () => {
        try {
            const data = await TrackerAPI.getDashboard()
            setStats(data)
        } catch (e) {
            console.error(e)
        }
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadData()
    }, [loadData])

    const openCheckInModal = (tag: string) => {
        setSelectedTag(tag)
        setDetails('')
        setMood('')
        setModalOpen(true)
    }

    const handleConfirmCheckIn = async () => {
        if (!selectedTag) return
        try {
            await TrackerAPI.checkIn({
                tag: selectedTag,
                details: details.trim() || undefined,
                mood: mood.trim() || undefined
            })
            setModalOpen(false)
            setSelectedTag('')
            await loadData()
        } catch (e) {
            console.error(e)
            alert('Failed to check in.')
        }
    }

    const dailyTags = stats.filter(t => t.type === 'daily')
    const weeklyTags = stats.filter(t => t.type === 'weekly')
    const otherTags = stats.filter(t => t.type !== 'daily' && t.type !== 'weekly')

    const totalStreak = stats.reduce((sum, s) => sum + s.daily_streak, 0)
    const totalCheckins = stats.reduce((sum, s) => sum + s.total_days, 0)
    const completedToday = stats.filter(s => s.period_done).length

    return (
        <Container>
            <OverallSummary>
                <SummaryStat>
                    <span>Total Active Streaks</span>
                    <strong>
                        {totalStreak} <Flame size={18} style={{ display: 'inline', color: '#ff8fb3' }} />
                    </strong>
                </SummaryStat>
                <SummaryStat>
                    <span>Total Check-ins</span>
                    <strong>
                        {totalCheckins} <Check size={18} style={{ display: 'inline', color: '#a2d5c6' }} />
                    </strong>
                </SummaryStat>
                <SummaryStat>
                    <span>Completed Target</span>
                    <strong>
                        {completedToday} / {stats.length}
                    </strong>
                </SummaryStat>
            </OverallSummary>

            {/* Daily Habits */}
            <section>
                <SectionHeader>
                    <Flame size={18} />
                    Today's Habits
                </SectionHeader>
                <CardGrid>
                    {dailyTags.length === 0 && <EmptyMessage>No daily habits found.</EmptyMessage>}
                    {dailyTags.map(stat => (
                        <HabitCard key={stat.tag} done={stat.period_done}>
                            <CheckButton
                                done={stat.period_done}
                                onClick={() => !stat.period_done && openCheckInModal(stat.tag)}
                                disabled={stat.period_done}
                            >
                                <Check size={18} />
                            </CheckButton>
                            <CardHeader>
                                <IconBox>
                                    <Activity size={18} />
                                </IconBox>
                                <h3>{stat.tag}</h3>
                                <TypeBadge>{stat.type}</TypeBadge>
                            </CardHeader>
                            {stat.description && <Description>{stat.description}</Description>}
                            <StatsRow>
                                <StatItem>
                                    <Flame size={14} /> <strong>{stat.daily_streak}</strong> days
                                </StatItem>
                                <StatItem>
                                    <Trophy size={14} /> <strong>{stat.longest_daily_streak}</strong> best
                                </StatItem>
                                <StatItem>
                                    <Calendar size={14} /> <strong>{stat.total_days}</strong> total
                                </StatItem>
                            </StatsRow>
                        </HabitCard>
                    ))}
                </CardGrid>
            </section>

            {/* Weekly Habits */}
            <section>
                <SectionHeader>
                    <Calendar size={18} />
                    This Week
                </SectionHeader>
                <CardGrid>
                    {weeklyTags.length === 0 && <EmptyMessage>No weekly habits found.</EmptyMessage>}
                    {weeklyTags.map(stat => {
                        const target = stat.target || 1
                        const completed = stat.period_completed || 0
                        const pct = Math.round((completed / target) * 100)
                        return (
                            <HabitCard key={stat.tag} done={stat.period_done}>
                                <CheckButton
                                    done={stat.period_done}
                                    onClick={() => !stat.period_done && openCheckInModal(stat.tag)}
                                    disabled={stat.period_done}
                                >
                                    <Check size={18} />
                                </CheckButton>
                                <CardHeader>
                                    <IconBox>
                                        <Repeat size={14} />
                                    </IconBox>
                                    <h3>{stat.tag}</h3>
                                    <TypeBadge>{stat.type}</TypeBadge>
                                </CardHeader>
                                {stat.description && <Description>{stat.description}</Description>}
                                <ProgressArea>
                                    <ProgressLabel>
                                        <span>Progress</span>
                                        <span>
                                            {completed}/{target}
                                        </span>
                                    </ProgressLabel>
                                    <ProgressBar>
                                        <div style={{ width: `${pct}%` }} />
                                    </ProgressBar>
                                </ProgressArea>
                                <StatsRow>
                                    <StatItem>
                                        <Flame size={14} color="#ff9a9e" /> <strong>{stat.daily_streak}</strong> streak
                                    </StatItem>
                                    <StatItem>
                                        <Trophy size={14} color="#ffd166" />{' '}
                                        <strong>{stat.longest_daily_streak}</strong> best
                                    </StatItem>
                                </StatsRow>
                            </HabitCard>
                        )
                    })}
                </CardGrid>
            </section>

            {/* Other Challenges */}
            {otherTags.length > 0 && (
                <section>
                    <SectionHeader>
                        <Flame size={18} />
                        Challenges
                    </SectionHeader>
                    <CardGrid>
                        {otherTags.map(stat => {
                            const target = stat.target || 1
                            const completed = stat.period_completed || 0
                            const pct = Math.round((completed / target) * 100)
                            return (
                                <HabitCard key={stat.tag} done={stat.period_done}>
                                    <CheckButton
                                        done={stat.period_done}
                                        onClick={() => !stat.period_done && openCheckInModal(stat.tag)}
                                        disabled={stat.period_done}
                                    >
                                        <Check size={18} />
                                    </CheckButton>
                                    <CardHeader>
                                        <IconBox>
                                            <Repeat size={14} />
                                        </IconBox>
                                        <h3>{stat.tag}</h3>
                                        <TypeBadge>{stat.type}</TypeBadge>
                                    </CardHeader>
                                    {stat.description && <Description>{stat.description}</Description>}
                                    <ProgressArea>
                                        <ProgressLabel>
                                            <span>{stat.period_progress}</span>
                                            <span>{pct}%</span>
                                        </ProgressLabel>
                                        <ProgressBar>
                                            <div style={{ width: `${pct}%` }} />
                                        </ProgressBar>
                                    </ProgressArea>
                                    <StatsRow>
                                        <StatItem>
                                            <Calendar size={14} /> <strong>{stat.total_days}</strong> check-ins
                                        </StatItem>
                                    </StatsRow>
                                </HabitCard>
                            )
                        })}
                    </CardGrid>
                </section>
            )}

            {/* Check-in Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Check In: ${selectedTag}`}>
                <FormGroup>
                    <label>Details</label>
                    <textarea
                        placeholder="How did it go? (optional)"
                        value={details}
                        onChange={e => setDetails(e.target.value)}
                        rows={3}
                    />
                </FormGroup>
                <FormGroup>
                    <label>Mood</label>
                    <input
                        placeholder="😊 🎉 😤 ... (optional emoji)"
                        value={mood}
                        onChange={e => setMood(e.target.value)}
                    />
                </FormGroup>
                <ButtonGroup>
                    <Button onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleConfirmCheckIn}>
                        <Plus size={16} style={{ marginRight: '6px' }} /> Check In
                    </Button>
                </ButtonGroup>
            </Modal>
        </Container>
    )
}
