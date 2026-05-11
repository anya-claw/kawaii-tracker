import { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { Trash2, Tag as TagIcon, Plus } from 'lucide-react'
import { TrackerAPI } from '../../shared/api'
import type { TrackerTag } from '../../shared/api/schema'

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(3)};
`

const InlineForm = styled.form`
    display: flex;
    gap: ${({ theme }) => theme.spacing(2)};
    align-items: center;
    background-color: ${({ theme }) => theme.colors.surface};
    padding: ${({ theme }) => theme.spacing(2)};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    border: 1px solid ${({ theme }) => theme.colors.border};
    box-shadow: ${({ theme }) => theme.shadows.soft};
    flex-wrap: wrap;

    input,
    select {
        padding: 8px 12px;
        border-radius: ${({ theme }) => theme.borderRadius.small};
        border: 1px solid ${({ theme }) => theme.colors.border};
        outline: none;
        font-family: inherit;
        font-size: 0.9rem;
        flex: 1;
        min-width: 150px;

        &:focus {
            border-color: ${({ theme }) => theme.colors.primary};
        }
    }

    button {
        padding: 8px 16px;
        border-radius: ${({ theme }) => theme.borderRadius.small};
        background-color: ${({ theme }) => theme.colors.primary};
        color: white;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;

        &:hover {
            background-color: ${({ theme }) => theme.colors.primaryHover};
        }
    }
`

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    overflow: hidden;
    box-shadow: ${({ theme }) => theme.shadows.soft};

    th,
    td {
        text-align: left;
        padding: ${({ theme }) => theme.spacing(2)};
        border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    }

    th {
        background-color: ${({ theme }) => theme.colors.background};
        color: ${({ theme }) => theme.colors.textMuted};
        font-weight: 600;
        font-size: 0.85rem;
        text-transform: uppercase;
    }

    td {
        color: ${({ theme }) => theme.colors.text};
        font-size: 0.95rem;
    }

    tr:last-child td {
        border-bottom: none;
    }
`

const TypeBadge = styled.span<{ type: string }>`
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: bold;
    text-transform: uppercase;
    background-color: ${({ theme, type }) =>
        type === 'daily' ? theme.colors.primary : type === 'weekly' ? '#ffd166' : theme.colors.secondary};
    color: #fff;
`

const DeleteBtn = styled.button`
    background: transparent;
    color: ${({ theme }) => theme.colors.textMuted};
    padding: 4px;
    border-radius: ${({ theme }) => theme.borderRadius.small};

    &:hover {
        background-color: ${({ theme }) => theme.colors.sidebarHover};
        color: ${({ theme }) => theme.colors.danger};
    }
`

export function TagManager() {
    const [tags, setTags] = useState<TrackerTag[]>([])

    const [habitForm, setHabitForm] = useState<{ tag: string; description: string; type: string; target: string }>({
        tag: '',
        description: '',
        type: 'daily',
        target: '1'
    })

    const loadTags = () => {
        TrackerAPI.getTags().then(setTags).catch(console.error)
    }

    useEffect(() => {
        loadTags()
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
            loadTags()
            setHabitForm({ tag: '', description: '', type: 'daily', target: '1' })
        } catch (e) {
            console.error(e)
            alert('Failed to create habit tag.')
        }
    }

    const handleDelete = async (name: string) => {
        if (!confirm(`Are you sure you want to delete tag '${name}'?`)) return
        try {
            await TrackerAPI.deleteTag(name)
            loadTags()
        } catch (e) {
            console.error(e)
            alert('Failed to delete tag')
        }
    }

    return (
        <Container>
            <InlineForm onSubmit={handleAddTag}>
                <input
                    required
                    value={habitForm.tag}
                    onChange={e => setHabitForm(prev => ({ ...prev, tag: e.target.value }))}
                    placeholder="New Tag Name"
                />
                <input
                    value={habitForm.description}
                    onChange={e => setHabitForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description"
                />
                <select
                    value={habitForm.type}
                    onChange={e => setHabitForm(prev => ({ ...prev, type: e.target.value }))}
                >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="one-off">One-off</option>
                </select>
                <input
                    type="number"
                    min="1"
                    style={{ maxWidth: '80px', minWidth: '80px' }}
                    value={habitForm.target}
                    onChange={e => setHabitForm(prev => ({ ...prev, target: e.target.value }))}
                    title="Target Count"
                />
                <button type="submit">
                    <Plus size={16} /> Add
                </button>
            </InlineForm>

            <Table>
                <thead>
                    <tr>
                        <th>Tag</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Target</th>
                        <th style={{ width: '50px' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {tags.length === 0 && (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: '#9aa0a6' }}>
                                No tags found.
                            </td>
                        </tr>
                    )}
                    {tags.map(t => {
                        const opts = JSON.parse(t.options || '{}')
                        const type = opts.recurring?.type || 'one-off'
                        const target = opts.repeat?.target || 1

                        return (
                            <tr key={t.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                                        <TagIcon size={16} color="#ff8fb3" />
                                        {t.tag}
                                    </div>
                                </td>
                                <td style={{ color: '#9aa0a6' }}>{t.description || '-'}</td>
                                <td>
                                    <TypeBadge type={type}>{type}</TypeBadge>
                                </td>
                                <td>{target}</td>
                                <td>
                                    <DeleteBtn onClick={() => handleDelete(t.tag)}>
                                        <Trash2 size={16} />
                                    </DeleteBtn>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </Table>
        </Container>
    )
}
