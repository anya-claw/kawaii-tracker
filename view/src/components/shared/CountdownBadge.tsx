import styled from '@emotion/styled'
import { Clock } from 'lucide-react'

interface CountdownInfo {
    text: string
    color: string
    bgColor: string
    borderColor: string
    isOverdue: boolean
}

export function getCountdown(dueDate: string): CountdownInfo | null {
    const now = new Date()
    const due = new Date(dueDate)
    const diffMs = due.getTime() - now.getTime()

    // Already overdue
    if (diffMs <= 0) {
        return {
            text: 'Overdue',
            color: '#ef4444',
            bgColor: '#ef444420',
            borderColor: '#ef444450',
            isOverdue: true
        }
    }

    const totalMin = Math.floor(diffMs / 60000)
    const totalHours = Math.floor(diffMs / 3600000)
    const totalDays = Math.floor(diffMs / 86400000)

    // >= 3 days → green
    if (totalDays >= 3) {
        return {
            text: `${totalDays}D`,
            color: '#22c55e',
            bgColor: '#22c55e15',
            borderColor: '#22c55e40',
            isOverdue: false
        }
    }

    // >= 24h → yellow
    if (totalHours >= 24) {
        return {
            text: `${totalDays}D`,
            color: '#eab308',
            bgColor: '#eab30815',
            borderColor: '#eab30840',
            isOverdue: false
        }
    }

    // >= 60min → yellow hours
    if (totalMin >= 60) {
        return {
            text: `${totalHours}H`,
            color: '#eab308',
            bgColor: '#eab30815',
            borderColor: '#eab30840',
            isOverdue: false
        }
    }

    // < 60min → red
    return {
        text: `${totalMin}Min`,
        color: '#ef4444',
        bgColor: '#ef444420',
        borderColor: '#ef444450',
        isOverdue: false
    }
}

const Badge = styled.span<{ color: string; bg: string; border: string }>`
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 6px;
    color: ${({ color }) => color};
    background: ${({ bg }) => bg};
    border: 1px solid ${({ border }) => border};
    white-space: nowrap;
`

interface Props {
    dueDate: string
    className?: string
}

export function CountdownBadge({ dueDate, className }: Props) {
    const info = getCountdown(dueDate)
    if (!info) return null

    return (
        <Badge color={info.color} bg={info.bgColor} border={info.borderColor} className={className}>
            <Clock size={10} />
            {info.text}
        </Badge>
    )
}
