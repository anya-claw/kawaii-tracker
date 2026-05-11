import { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { Trophy, Flame, Calendar, Activity } from 'lucide-react'
import { TrackerAPI } from '../../shared/api'
import type { DashboardStat } from '../../shared/api/schema'

const Container = styled.div`
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

export function TrackerStatistic() {
    const [stats, setStats] = useState<DashboardStat[]>([])

    useEffect(() => {
        TrackerAPI.getDashboard().then(setStats).catch(console.error)
    }, [])

    if (stats.length === 0) {
        return <p style={{ color: '#9aa0a6' }}>No statistics available.</p>
    }

    return (
        <Container>
            {stats.map(stat => (
                <StatCard key={stat.tag}>
                    <Header>
                        <h3>{stat.tag}</h3>
                    </Header>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                        <StatRow>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Flame size={16} color="#ff9a9e" /> Current Streak
                            </span>
                            <strong>{stat.daily_streak} days</strong>
                        </StatRow>
                        <StatRow>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Trophy size={16} color="#ffd166" /> Longest Streak
                            </span>
                            <strong>{stat.longest_daily_streak} days</strong>
                        </StatRow>
                        <StatRow>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={16} color="#a2d5c6" /> Total Check-ins
                            </span>
                            <strong>{stat.total_days} times</strong>
                        </StatRow>
                        {stat.type !== 'one-off' && stat.type !== 'daily' && (
                            <StatRow>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Activity size={16} color="#b5ead7" /> Period Progress
                                </span>
                                <strong>{stat.period_progress}</strong>
                            </StatRow>
                        )}
                    </div>
                </StatCard>
            ))}
        </Container>
    )
}
