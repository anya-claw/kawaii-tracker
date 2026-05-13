import { useState, useEffect, useMemo } from 'react'
import styled from '@emotion/styled'
import { Trophy, Flame, Calendar, Activity, BarChart2 } from 'lucide-react'
import { TrackerAPI } from '../../shared/api'
import type { DashboardStat } from '../../shared/api/schema'
import { HabitCard } from './HabitCard'
import { Modal } from '../shared/Modal'
import { FormGroup, ButtonGroup, Button } from '../shared/Form'
import { showError } from '../../shared/utils/errorManager'

const ConsoleLayout = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(4)};
`

const SectionTitle = styled.h2`
    margin-bottom: ${({ theme }) => theme.spacing(2)};
    font-size: 1.25rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary};
    display: flex;
    align-items: center;
    gap: 8px;
`

const InteractiveGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: ${({ theme }) => theme.spacing(3)};
`

const StatGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: ${({ theme }) => theme.spacing(3)};
`

const StatCard = styled.div`
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius.large};
    padding: ${({ theme }) => theme.spacing(3)};
    border: 1px solid ${({ theme }) => theme.colors.border};
    box-shadow: ${({ theme }) => theme.shadows.soft};
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
        box-shadow: ${({ theme }) => theme.shadows.hover};
        transform: translateY(-2px);
    }
`

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
        margin: 0;
        font-size: 1.1rem;
        color: ${({ theme }) => theme.colors.text};
    }
`

const StatRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textMuted};

    strong {
        color: ${({ theme }) => theme.colors.text};
        font-size: 1rem;
    }
`

export function TrackerConsole() {
    const [stats, setStats] = useState<DashboardStat[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedTag, setSelectedTag] = useState<string>('')
    const [details, setDetails] = useState('')
    const [mood, setMood] = useState('')

    const loadData = async () => {
        try {
            const data = await TrackerAPI.getDashboard()
            setStats(data)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on mount is a valid effect use case
        void loadData()
    }, [])

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
            showError('Failed to check in.')
        }
    }

    const dailyTags = useMemo(() => stats.filter(t => t.type === 'daily'), [stats])
    const otherTags = useMemo(() => stats.filter(t => t.type !== 'daily'), [stats])

    return (
        <ConsoleLayout>
            <div>
                <SectionTitle>☀️ Interactive Habits</SectionTitle>
                <InteractiveGrid>
                    {dailyTags.length === 0 && otherTags.length === 0 ? (
                        <p style={{ color: '#9aa0a6' }}>No habits found.</p>
                    ) : null}
                    {dailyTags.map(stat => (
                        <HabitCard key={stat.tag} stat={stat} onCheckIn={openCheckInModal} />
                    ))}
                    {otherTags.map(stat => (
                        <HabitCard key={stat.tag} stat={stat} onCheckIn={openCheckInModal} />
                    ))}
                </InteractiveGrid>
            </div>

            <div>
                <SectionTitle>
                    <BarChart2 size={24} /> Detailed Statistics
                </SectionTitle>
                <StatGrid>
                    {stats.length === 0 ? <p style={{ color: '#9aa0a6' }}>No statistics available.</p> : null}
                    {stats.map(stat => (
                        <StatCard key={stat.tag}>
                            <Header>
                                <h3>{stat.tag}</h3>
                            </Header>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                                <StatRow>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Flame size={16} color="#ef4444" /> Current Streak
                                    </span>
                                    <strong>{stat.daily_streak} days</strong>
                                </StatRow>
                                <StatRow>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Trophy size={16} color="#f59e0b" /> Longest Streak
                                    </span>
                                    <strong>{stat.longest_daily_streak} days</strong>
                                </StatRow>
                                <StatRow>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Calendar size={16} color="#38bdf8" /> Total Check-ins
                                    </span>
                                    <strong>{stat.total_days} times</strong>
                                </StatRow>
                                {stat.type !== 'one-off' && stat.type !== 'daily' && (
                                    <StatRow>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Activity size={16} color="#10b981" /> Period Progress
                                        </span>
                                        <strong>{stat.period_progress}</strong>
                                    </StatRow>
                                )}
                            </div>
                        </StatCard>
                    ))}
                </StatGrid>
            </div>

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
                        ✓ Check In
                    </Button>
                </ButtonGroup>
            </Modal>
        </ConsoleLayout>
    )
}
