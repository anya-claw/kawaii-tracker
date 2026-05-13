import { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import {
    LayoutDashboard,
    Tags,
    CalendarCheck,
    KanbanSquare,
    History as HistoryIcon,
    Menu,
    Sun,
    Moon
} from 'lucide-react'
import { KanbanBoard } from './components/kanban/KanbanBoard'
import { EventHistory } from './components/tracker/EventHistory'
import { TagManager } from './components/tracker/TagManager'
import { TodoHistory } from './components/kanban/TodoHistory'
import { OverviewBoard } from './components/tracker/OverviewBoard'
import { TrackerStatistic } from './components/tracker/TrackerStatistic'

interface AppProps {
    isDark: boolean
    setIsDark: (v: boolean) => void
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    background-color: ${({ theme }) => theme.colors.background};
    font-family: 'Misans', 'Nunito', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    position: relative;
    transition: background-color ${props => props.theme.transitions.slow};
`

const Overlay = styled.div<{ open: boolean }>`
    display: ${({ open }) => (open ? 'block' : 'none')};
    position: fixed;
    inset: 0;
    background: ${({ theme }) => theme.colors.overlayDark};
    z-index: 19;
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
    transition: all ${props => props.theme.transitions.slow};

    @media (max-width: 768px) {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 280px;
        transform: ${({ open }) => (open ? 'translateX(0)' : 'translateX(-100%)')};
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
`

const MobileHeader = styled.div`
    display: none;
    @media (max-width: 768px) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        background-color: ${({ theme }) => theme.colors.surface};
        border-bottom: 1px solid ${({ theme }) => theme.colors.border};
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 15;
        box-shadow: ${({ theme }) => theme.shadows.card};
    }
`

const Hamburger = styled.button`
    background: none;
    border: none;
    color: ${({ theme }) => theme.colors.text};
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    transition: ${props => props.theme.transitions.fast};

    &:hover {
        background-color: ${({ theme }) => theme.colors.sidebarHover};
    }
    &:active {
        transform: scale(0.95);
    }
`

const MobileTitle = styled.span`
    font-size: 1.1rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
`

const ThemeToggle = styled.button`
    background: none;
    border: none;
    color: ${({ theme }) => theme.colors.text};
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    transition: ${props => props.theme.transitions.fast};

    &:hover {
        background-color: ${({ theme }) => theme.colors.sidebarHover};
        color: ${({ theme }) => theme.colors.primary};
    }
    &:active {
        transform: scale(0.95);
    }
`

const MainLayout = styled.div`
    display: flex;
    flex: 1;
    overflow: hidden;
`

const BrandName = styled.h2`
    font-family: 'Times New Roman', 'Georgia', serif;
    font-weight: 900;
    font-size: 1.5rem;
    letter-spacing: 0.5px;
    margin: 0;
`

const SidebarFooter = styled.div`
    margin-top: auto;
    display: flex;
    justify-content: center;
`

const ThemeToggleBtn = styled(ThemeToggle)`
    padding: 12px 24px;
`

const ThemeLabel = styled.span`
    margin-left: 8px;
    font-weight: 600;
`

const Brand = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(1.5)};
    padding: 0 ${({ theme }) => theme.spacing(2)};
    color: ${({ theme }) => theme.colors.primary};
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
    transition: ${props => props.theme.transitions.default};
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;

    &:hover {
        background-color: ${({ theme }) => theme.colors.sidebarHover};
        color: ${({ theme }) => theme.colors.primary};
        transform: translateX(4px);
    }
    &:active {
        transform: translateX(2px);
    }
`

const NavItemIndicator = styled.span<{ active?: boolean }>`
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: ${({ active }) => (active ? '60%' : '0')};
    background-color: ${({ theme }) => theme.colors.primary};
    border-radius: 0 2px 2px 0;
    transition: height 0.2s ease;
`

const MainContent = styled.main`
    flex: 1;
    padding: ${({ theme }) => theme.spacing(5)};
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(3)};
    transition: padding ${props => props.theme.transitions.default};

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(2)};
        padding-top: 84px; /* Space for fixed mobile header */
    }
`

const Header = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: ${({ theme }) => theme.spacing(2)};
    animation: slideDown 0.3s ease;

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    h1 {
        font-size: 1.8rem;
        font-weight: 800;
        color: ${({ theme }) => theme.colors.text};
        margin: 0;
        position: relative;

        &::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 40px;
            height: 3px;
            background: ${({ theme }) => theme.colors.primary};
            border-radius: 2px;
        }
    }

    @media (max-width: 768px) {
        h1 {
            font-size: 1.3rem;
        }
    }
`

const ContentWrapper = styled.div<{ direction: 'up' | 'down' | 'none' }>`
    animation: ${({ direction }) =>
        direction === 'none'
            ? 'none'
            : direction === 'down'
              ? 'slideInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              : 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'};

    @keyframes slideInDown {
        from {
            opacity: 0;
            transform: translateY(-30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`

const LoadingBar = styled.div<{ loading: boolean }>`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${({ theme }) => theme.colors.primary};
    transform: scaleX(${({ loading }) => (loading ? 1 : 0)});
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: left;
    z-index: 9999;
    box-shadow: 0 0 10px ${({ theme }) => theme.colors.primary};
`

const tabTitles: Record<string, string> = {
    overview: 'Overview',
    'tracker-statistic': 'Tracker Kanban',
    'tracker-events': 'Events',
    'tracker-tags': 'Tags',
    'todo-board': 'To-Do Board',
    'todo-history': 'To-Do History'
}

const tabOrder = ['overview', 'tracker-statistic', 'tracker-events', 'tracker-tags', 'todo-board', 'todo-history']

function App({ isDark, setIsDark }: AppProps) {
    const [activeTab, setActiveTab] = useState<
        'overview' | 'tracker-statistic' | 'tracker-events' | 'tracker-tags' | 'todo-board' | 'todo-history'
    >('overview')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [prevTab, setPrevTab] = useState<typeof activeTab>('overview')
    const [loading, setLoading] = useState(false)

    const [isSwitching, setIsSwitching] = useState(false)

    // Close sidebar on resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setSidebarOpen(false)
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const navigate = (tab: typeof activeTab) => {
        if (isSwitching || activeTab === tab) return
        setIsSwitching(true)
        setLoading(true)
        setSidebarOpen(false)

        // Show loading bar first, then switch tab after a brief delay
        setTimeout(() => {
            setPrevTab(activeTab)
            setActiveTab(tab)
            // After animation plays, unlock
            setTimeout(() => {
                setLoading(false)
                setIsSwitching(false)
            }, 400)
        }, 150)
    }

    const getAnimationDirection = (): 'up' | 'down' | 'none' => {
        const prevIndex = tabOrder.indexOf(prevTab)
        const currentIndex = tabOrder.indexOf(activeTab)
        if (currentIndex > prevIndex) return 'down'
        if (currentIndex < prevIndex) return 'up'
        return 'none'
    }

    const toggleTheme = () => {
        setIsDark(!isDark)
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewBoard navigate={navigate} />
            case 'tracker-statistic':
                return <TrackerStatistic />
            case 'tracker-events':
                return <EventHistory />
            case 'tracker-tags':
                return <TagManager />
            case 'todo-board':
                return <KanbanBoard />
            case 'todo-history':
                return <TodoHistory />
            default:
                return null
        }
    }

    return (
        <Container>
            <LoadingBar loading={loading} />
            <MobileHeader>
                <Hamburger onClick={() => setSidebarOpen(true)}>
                    <Menu size={24} />
                </Hamburger>
                <MobileTitle>{tabTitles[activeTab]}</MobileTitle>
                <ThemeToggle onClick={toggleTheme}>{isDark ? <Sun size={20} /> : <Moon size={20} />}</ThemeToggle>
            </MobileHeader>

            <Overlay open={sidebarOpen} onClick={() => setSidebarOpen(false)} />

            <MainLayout>
                <Sidebar open={sidebarOpen}>
                    <Brand>
                        <BrandName>Kawaii Tracker</BrandName>
                    </Brand>

                    <NavMenu>
                        <NavItem active={activeTab === 'overview'} onClick={() => navigate('overview')}>
                            <NavItemIndicator active={activeTab === 'overview'} />
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
                                <NavItemIndicator active={activeTab === 'tracker-statistic'} />
                                <KanbanSquare size={20} />
                                <span>Tracker Kanban</span>
                            </NavItem>
                            <NavItem active={activeTab === 'tracker-events'} onClick={() => navigate('tracker-events')}>
                                <NavItemIndicator active={activeTab === 'tracker-events'} />
                                <CalendarCheck size={20} />
                                <span>Events</span>
                            </NavItem>
                            <NavItem active={activeTab === 'tracker-tags'} onClick={() => navigate('tracker-tags')}>
                                <NavItemIndicator active={activeTab === 'tracker-tags'} />
                                <Tags size={20} />
                                <span>Tags</span>
                            </NavItem>
                        </NavMenu>
                    </SidebarSection>

                    <SidebarSection>
                        <h4>To-Do</h4>
                        <NavMenu>
                            <NavItem active={activeTab === 'todo-board'} onClick={() => navigate('todo-board')}>
                                <NavItemIndicator active={activeTab === 'todo-board'} />
                                <KanbanSquare size={20} />
                                <span>Board</span>
                            </NavItem>
                            <NavItem active={activeTab === 'todo-history'} onClick={() => navigate('todo-history')}>
                                <NavItemIndicator active={activeTab === 'todo-history'} />
                                <HistoryIcon size={20} />
                                <span>History</span>
                            </NavItem>
                        </NavMenu>
                    </SidebarSection>

                    {/* Desktop Theme Toggle */}
                    <SidebarFooter>
                        <ThemeToggleBtn onClick={toggleTheme}>
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                            <ThemeLabel>{isDark ? 'Light' : 'Dark'}</ThemeLabel>
                        </ThemeToggleBtn>
                    </SidebarFooter>
                </Sidebar>

                <MainContent>
                    <Header>
                        <h1>{tabTitles[activeTab]}</h1>
                    </Header>
                    <ContentWrapper key={activeTab} direction={getAnimationDirection()}>
                        {renderContent()}
                    </ContentWrapper>
                </MainContent>
            </MainLayout>
        </Container>
    )
}

export default App
