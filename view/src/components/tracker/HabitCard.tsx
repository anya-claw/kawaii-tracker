import styled from '@emotion/styled'
import { Check, Flame, Trophy, Repeat } from 'lucide-react'
import type { DashboardStat } from '../../shared/api/schema'

const Card = styled.div<{ done: boolean }>`
    background-color: ${({ theme, done }) => (done ? '#f0fdf4' : theme.colors.surface)};
    border-radius: ${({ theme }) => theme.borderRadius.large};
    padding: ${({ theme }) => theme.spacing(3)};
    border: 1px solid ${({ theme, done }) => (done ? '#bbf7d0' : theme.colors.border)};
    box-shadow: ${({ theme }) => theme.shadows.soft};
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

const Header = styled.div`
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
    color: ${({ theme }) => theme.colors.primaryHover};
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

const ProgressBar = styled.div`
    width: 100%;
    height: 6px;
    background-color: ${({ theme }) => theme.colors.border};
    border-radius: 4px;
    overflow: hidden;
    margin-top: 4px;

    div {
        height: 100%;
        background-color: ${({ theme }) => theme.colors.primaryHover};
        transition: width 0.3s ease;
    }
`

const CheckButton = styled.button<{ done: boolean }>`
    position: absolute;
    top: ${({ theme }) => theme.spacing(2.5)};
    right: ${({ theme }) => theme.spacing(2.5)};
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: ${({ theme, done }) => (done ? theme.colors.success : theme.colors.sidebarHover)};
    color: ${({ theme, done }) => (done ? 'white' : theme.colors.textMuted)};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
        background-color: ${({ theme, done }) => (done ? theme.colors.success : theme.colors.primaryHover)};
        color: white;
    }
`

const StatsRow = styled.div`
    display: flex;
    gap: ${({ theme }) => theme.spacing(3)};
    margin-left: 32px;
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

interface Props {
    stat: DashboardStat
    onCheckIn: (tag: string) => void
}

export function HabitCard({ stat, onCheckIn }: Props) {
    const isDone = stat.period_done
    const isProgress = stat.target > 1
    const pct = isProgress ? Math.min(100, Math.round((stat.period_completed / stat.target) * 100)) : isDone ? 100 : 0

    return (
        <Card done={isDone}>
            <CheckButton done={isDone} onClick={() => !isDone && onCheckIn(stat.tag)} disabled={isDone}>
                <Check size={18} />
            </CheckButton>

            <Header>
                <div
                    style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '8px',
                        backgroundColor: '#fff0f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Repeat size={14} color="#ff7aa5" />
                </div>
                <h3>{stat.tag}</h3>
                <TypeBadge>{stat.type}</TypeBadge>
            </Header>

            {stat.description && <Description>{stat.description}</Description>}

            {isProgress && (
                <ProgressArea>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                        }}
                    >
                        <span style={{ color: isDone ? '#10b981' : '#ff7aa5' }}>
                            {stat.period_completed}/{stat.target}
                        </span>
                        <span style={{ color: '#9aa0a6' }}>{pct}%</span>
                    </div>
                    <ProgressBar>
                        <div style={{ width: `${pct}%`, backgroundColor: isDone ? '#10b981' : '#ff7aa5' }} />
                    </ProgressBar>
                </ProgressArea>
            )}

            <StatsRow>
                <StatItem>
                    <Flame size={14} color="#ff9a9e" />
                    <strong>{stat.daily_streak}</strong> Streak
                </StatItem>
                <StatItem>
                    <Trophy size={14} color="#ffd166" />
                    <strong>{stat.total_days}</strong> Days
                </StatItem>
            </StatsRow>
        </Card>
    )
}
