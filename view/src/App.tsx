import { useState } from 'react'
import styled from '@emotion/styled'
import {
    Heart,
    LayoutDashboard,
    Tags,
    CalendarCheck,
    BarChart2,
    KanbanSquare,
    History as HistoryIcon
} from 'lucide-react'
import { KanbanBoard } from './components/kanban/KanbanBoard'
import { EventHistory } from './components/tracker/EventHistory'
import { TagManager } from './components/tracker/TagManager'
import { TodoHistory } from './components/kanban/TodoHistory'
import { OverviewBoard } from './components/tracker/OverviewBoard'
import { TrackerStatistic } from './components/tracker/TrackerStatistic'

const Container = styled.div`
    display: flex;
    height: 100vh;
    width: 100vw;
    background-color: ${({ theme }) => theme.colors.background};
    font-family: 'Misans', 'Nunito', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`

const Sidebar = styled.nav`
    width: 260px;
    background-color: ${({ theme }) => theme.colors.surface};
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    padding: ${({ theme }) => theme.spacing(4)} ${({ theme }) => theme.spacing(3)};
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(4)};
    box-shadow: ${({ theme }) => theme.shadows.soft};
    z-index: 10;
`

const Brand = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(1.5)};
    padding: 0 ${({ theme }) => theme.spacing(2)};
    color: ${({ theme }) => theme.colors.primary};

    h2 {
        font-size: 1.25rem;
        font-weight: 800;
        letter-spacing: -0.5px;
        margin: 0;
    }
`

const NavMenu = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(1)};
`

const SidebarSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(1)};

    h4 {
        font-size: 0.75rem;
        text-transform: uppercase;
        color: ${({ theme }) => theme.colors.textMuted};
        margin: ${({ theme }) => theme.spacing(2)} 0 0 ${({ theme }) => theme.spacing(2)};
        letter-spacing: 0.5px;
    }
`

const NavItem = styled.a<{ active?: boolean }>`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(2)};
    padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(2)};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    color: ${({ theme, active }) => (active ? theme.colors.primary : theme.colors.textMuted)};
    background-color: ${({ theme, active }) => (active ? theme.colors.sidebarHover : 'transparent')};
    font-weight: ${({ active }) => (active ? '700' : '600')};
    font-size: 0.95rem;
    transition: ${({ theme }) => theme.transitions.default};
    cursor: pointer;

    &:hover {
        background-color: ${({ theme }) => theme.colors.sidebarHover};
        color: ${({ theme }) => theme.colors.primary};
        transform: translateX(4px);
    }
`

const MainContent = styled.main`
    flex: 1;
    padding: ${({ theme }) => theme.spacing(5)};
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(3)};
`

const Header = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: ${({ theme }) => theme.spacing(2)};

    h1 {
        font-size: 1.8rem;
        font-weight: 800;
        color: ${({ theme }) => theme.colors.text};
        margin: 0;
    }
`

function App() {
    const [activeTab, setActiveTab] = useState<
        'overview' | 'tracker-statistic' | 'tracker-events' | 'tracker-tags' | 'todo-board' | 'todo-history'
    >('overview')

    return (
        <Container>
            <Sidebar>
                <Brand>
                    <Heart fill="#ff8fb3" size={28} />
                    <h2>Kawaii Tracker</h2>
                </Brand>

                <NavMenu>
                    <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
                        <LayoutDashboard size={20} />
                        <span>Overview</span>
                    </NavItem>
                </NavMenu>

                <SidebarSection>
                    <h4>Habit Tracker</h4>
                    <NavMenu>
                        <NavItem
                            active={activeTab === 'tracker-statistic'}
                            onClick={() => setActiveTab('tracker-statistic')}
                        >
                            <BarChart2 size={20} />
                            <span>Tracker Statistic</span>
                        </NavItem>
                        <NavItem active={activeTab === 'tracker-events'} onClick={() => setActiveTab('tracker-events')}>
                            <CalendarCheck size={20} />
                            <span>Events</span>
                        </NavItem>
                        <NavItem active={activeTab === 'tracker-tags'} onClick={() => setActiveTab('tracker-tags')}>
                            <Tags size={20} />
                            <span>Tags</span>
                        </NavItem>
                    </NavMenu>
                </SidebarSection>

                <SidebarSection>
                    <h4>To-Do</h4>
                    <NavMenu>
                        <NavItem active={activeTab === 'todo-board'} onClick={() => setActiveTab('todo-board')}>
                            <KanbanSquare size={20} />
                            <span>Board</span>
                        </NavItem>
                        <NavItem active={activeTab === 'todo-history'} onClick={() => setActiveTab('todo-history')}>
                            <HistoryIcon size={20} />
                            <span>History</span>
                        </NavItem>
                    </NavMenu>
                </SidebarSection>
            </Sidebar>

            <MainContent>
                <Header>
                    <h1>
                        {activeTab === 'overview' && 'Overview'}
                        {activeTab === 'tracker-statistic' && 'Tracker Statistic'}
                        {activeTab === 'tracker-events' && 'Events'}
                        {activeTab === 'tracker-tags' && 'Tags'}
                        {activeTab === 'todo-board' && 'To-Do Board'}
                        {activeTab === 'todo-history' && 'To-Do History'}
                    </h1>
                </Header>

                {activeTab === 'overview' && <OverviewBoard />}
                {activeTab === 'tracker-statistic' && <TrackerStatistic />}
                {activeTab === 'tracker-events' && <EventHistory />}
                {activeTab === 'tracker-tags' && <TagManager />}
                {activeTab === 'todo-board' && <KanbanBoard />}
                {activeTab === 'todo-history' && <TodoHistory />}
            </MainContent>
        </Container>
    )
}

export default App
