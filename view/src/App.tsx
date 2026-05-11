import { useState } from 'react'
import styled from '@emotion/styled'
import {
    Heart,
    LayoutDashboard,
    Tags,
    CalendarCheck,
    BarChart2,
    KanbanSquare,
    History as HistoryIcon,
    Menu,
    X
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
    position: relative;
`

const Overlay = styled.div<{ open: boolean }>`
    display: none;
    @media (max-width: 768px) {
        display: ${({ open }) => (open ? 'block' : 'none')};
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 19;
    }
`

const Sidebar = styled.nav<{ open: boolean }>`
    width: 260px;
    background-color: ${({ theme }) => theme.colors.surface};
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    padding: ${({ theme }) => theme.spacing(4)} ${({ theme }) => theme.spacing(3)};
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(4)};
    box-shadow: ${({ theme }) => theme.shadows.soft};
    z-index: 20;
    flex-shrink: 0;

    @media (max-width: 768px) {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        transform: ${({ open }) => (open ? 'translateX(0)' : 'translateX(-100%)')};
        transition: transform 0.25s ease;
    }
`

const MobileHeader = styled.div`
    display: none;
    @media (max-width: 768px) {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background-color: ${({ theme }) => theme.colors.surface};
        border-bottom: 1px solid ${({ theme }) => theme.colors.border};
        position: sticky;
        top: 0;
        z-index: 10;
    }
`

const Hamburger = styled.button`
    background: none;
    border: none;
    color: ${({ theme }) => theme.colors.text};
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
`

const MobileTitle = styled.span`
    font-size: 1.1rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
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

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(2)};
    }
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

    @media (max-width: 768px) {
        h1 {
            font-size: 1.3rem;
        }
    }
`

const tabTitles: Record<string, string> = {
    overview: 'Overview',
    'tracker-statistic': 'Tracker Statistic',
    'tracker-events': 'Events',
    'tracker-tags': 'Tags',
    'todo-board': 'To-Do Board',
    'todo-history': 'To-Do History'
}

function App() {
    const [activeTab, setActiveTab] = useState<
        'overview' | 'tracker-statistic' | 'tracker-events' | 'tracker-tags' | 'todo-board' | 'todo-history'
    >('overview')
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const navigate = (tab: typeof activeTab) => {
        setActiveTab(tab)
        setSidebarOpen(false)
    }

    return (
        <Container>
            <MobileHeader>
                <Hamburger onClick={() => setSidebarOpen(true)}>
                    <Menu size={24} />
                </Hamburger>
                <MobileTitle>{tabTitles[activeTab]}</MobileTitle>
            </MobileHeader>

            <Overlay open={sidebarOpen} onClick={() => setSidebarOpen(false)} />

            <Sidebar open={sidebarOpen}>
                <Brand>
                    <Heart fill="#ff8fb3" size={28} />
                    <h2>Kawaii Tracker</h2>
                    <Hamburger style={{ marginLeft: 'auto', display: 'none' }} onClick={() => setSidebarOpen(false)}>
                        <X size={20} />
                    </Hamburger>
                </Brand>

                <NavMenu>
                    <NavItem active={activeTab === 'overview'} onClick={() => navigate('overview')}>
                        <LayoutDashboard size={20} />
                        <span>Overview</span>
                    </NavItem>
                </NavMenu>

                <SidebarSection>
                    <h4>Habit Tracker</h4>
                    <NavMenu>
                        <NavItem
                            active={activeTab === 'tracker-statistic'}
                            onClick={() => navigate('tracker-statistic')}
                        >
                            <BarChart2 size={20} />
                            <span>Tracker Statistic</span>
                        </NavItem>
                        <NavItem active={activeTab === 'tracker-events'} onClick={() => navigate('tracker-events')}>
                            <CalendarCheck size={20} />
                            <span>Events</span>
                        </NavItem>
                        <NavItem active={activeTab === 'tracker-tags'} onClick={() => navigate('tracker-tags')}>
                            <Tags size={20} />
                            <span>Tags</span>
                        </NavItem>
                    </NavMenu>
                </SidebarSection>

                <SidebarSection>
                    <h4>To-Do</h4>
                    <NavMenu>
                        <NavItem active={activeTab === 'todo-board'} onClick={() => navigate('todo-board')}>
                            <KanbanSquare size={20} />
                            <span>Board</span>
                        </NavItem>
                        <NavItem active={activeTab === 'todo-history'} onClick={() => navigate('todo-history')}>
                            <HistoryIcon size={20} />
                            <span>History</span>
                        </NavItem>
                    </NavMenu>
                </SidebarSection>
            </Sidebar>

            <MainContent>
                <Header>
                    <h1>{tabTitles[activeTab]}</h1>
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
