import { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { Plus } from 'lucide-react'
import { TrackerAPI } from '../../shared/api'
import type { DashboardStat } from '../../shared/api/schema'
import { HabitCard } from './HabitCard'
import { Modal } from '../shared/Modal'
import { FormGroup, ButtonGroup, Button } from '../shared/Form'

const TrackerContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: ${({ theme }) => theme.spacing(3)};
`

const HeaderSection = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${({ theme }) => theme.spacing(3)};
`

const AddButton = styled.button`
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.primary};
    border: 2px dashed ${({ theme }) => theme.colors.border};
    padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
        border-color: ${({ theme }) => theme.colors.primary};
        background-color: ${({ theme }) => theme.colors.sidebarHover};
    }
`

export function OverviewBoard() {
    const [stats, setStats] = useState<DashboardStat[]>([])

    const [isHabitModalOpen, setIsHabitModalOpen] = useState(false)
    const [habitForm, setHabitForm] = useState<{ tag: string; description: string; type: string; target: string }>({
        tag: '',
        description: '',
        type: 'daily',
        target: '1'
    })

    const loadStats = async () => {
        try {
            const data = await TrackerAPI.getDashboard()
            setStats(data)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadStats()
    }, [])

    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!habitForm.tag.trim()) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let type: 'daily' | 'weekly' | 'monthly' | null = habitForm.type as any
        if (habitForm.type === 'one-off') {
            type = null
        }

        try {
            await TrackerAPI.createTag({
                tag: habitForm.tag,
                description: habitForm.description,
                option: {
                    recurring: { type },
                    repeat: { target: parseInt(habitForm.target, 10) || 1 }
                }
            })
            await loadStats()
            setIsHabitModalOpen(false)
            setHabitForm({ tag: '', description: '', type: 'daily', target: '1' })
        } catch (e) {
            console.error(e)
            alert('Failed to create habit tag.')
        }
    }

    const handleCheckIn = async (tag: string) => {
        try {
            await TrackerAPI.checkIn({ tag })
            await loadStats()
        } catch (e) {
            console.error(e)
            alert('Failed to check in.')
        }
    }

    return (
        <>
            <HeaderSection>
                <AddButton onClick={() => setIsHabitModalOpen(true)}>
                    <Plus size={18} />
                    New Habit
                </AddButton>
            </HeaderSection>
            <TrackerContainer>
                {stats.map(stat => (
                    <HabitCard key={stat.tag} stat={stat} onCheckIn={handleCheckIn} />
                ))}
            </TrackerContainer>

            <Modal isOpen={isHabitModalOpen} onClose={() => setIsHabitModalOpen(false)} title="Create New Habit">
                <form onSubmit={handleAddTag}>
                    <FormGroup>
                        <label>Habit Name (Tag)</label>
                        <input
                            autoFocus
                            required
                            value={habitForm.tag}
                            onChange={e => setHabitForm(prev => ({ ...prev, tag: e.target.value }))}
                            placeholder="e.g. Study"
                        />
                    </FormGroup>
                    <FormGroup>
                        <label>Description (Optional)</label>
                        <input
                            value={habitForm.description}
                            onChange={e => setHabitForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="e.g. Read 20 pages..."
                        />
                    </FormGroup>
                    <FormGroup>
                        <label>Frequency Type</label>
                        <select
                            value={habitForm.type}
                            onChange={e => setHabitForm(prev => ({ ...prev, type: e.target.value }))}
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="one-off">One-off / Challenge</option>
                        </select>
                    </FormGroup>
                    <FormGroup>
                        <label>Target Count (per cycle)</label>
                        <input
                            type="number"
                            min="1"
                            value={habitForm.target}
                            onChange={e => setHabitForm(prev => ({ ...prev, target: e.target.value }))}
                        />
                    </FormGroup>
                    <ButtonGroup>
                        <Button type="button" onClick={() => setIsHabitModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Create
                        </Button>
                    </ButtonGroup>
                </form>
            </Modal>
        </>
    )
}
