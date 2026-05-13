import '@emotion/react'

// Light theme (kawaii pink)
export const lightTheme = {
    colors: {
        primary: '#ff6b9d',
        primaryHover: '#ff5a8d',
        secondary: '#a2d5c6',
        background: '#fef7fa',
        surface: '#ffffff',
        surfaceAlt: '#fff0f5',
        text: '#3d3d3d',
        textMuted: '#6b7280',
        danger: '#ff6b6b',
        success: '#4ade80',
        border: '#fce4ec',
        sidebarHover: '#fff5f8',
        overlay: 'rgba(255, 247, 250, 0.85)',
        overlayDark: 'rgba(0, 0, 0, 0.4)'
    },
    spacing: (n: number) => `${n * 8}px`,
    borderRadius: {
        small: '8px',
        medium: '16px',
        large: '24px',
        round: '50%'
    },
    shadows: {
        soft: '0 4px 20px rgba(255, 143, 179, 0.08)',
        hover: '0 8px 30px rgba(255, 143, 179, 0.15)',
        card: '0 2px 12px rgba(255, 143, 179, 0.06)'
    },
    transitions: {
        default: 'all 0.2s ease-in-out',
        fast: 'all 0.15s ease',
        slow: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    isDark: false
}

// Dark theme (kawaii night)
export const darkTheme = {
    colors: {
        primary: '#ff9ac4',
        primaryHover: '#ffb0d0',
        secondary: '#7ec8b8',
        background: '#0f0f1e',
        surface: '#1e1e38',
        surfaceAlt: '#252548',
        text: '#f0f0f8',
        textMuted: '#b0b0c0',
        danger: '#ff6b6b',
        success: '#4ade80',
        border: '#4a4a6c',
        sidebarHover: '#252550',
        overlay: 'rgba(15, 15, 30, 0.85)',
        overlayDark: 'rgba(0, 0, 0, 0.6)'
    },
    spacing: (n: number) => `${n * 8}px`,
    borderRadius: {
        small: '8px',
        medium: '16px',
        large: '24px',
        round: '50%'
    },
    shadows: {
        soft: '0 4px 20px rgba(0, 0, 0, 0.3)',
        hover: '0 8px 30px rgba(255, 143, 179, 0.2)',
        card: '0 2px 12px rgba(0, 0, 0, 0.25)'
    },
    transitions: {
        default: 'all 0.2s ease-in-out',
        fast: 'all 0.15s ease',
        slow: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    isDark: true
}

// Default theme (light)
export const theme = lightTheme

// Export type
export type AppTheme = typeof lightTheme

declare module '@emotion/react' {
    export interface Theme {
        colors: {
            primary: string
            primaryHover: string
            secondary: string
            background: string
            surface: string
            surfaceAlt: string
            text: string
            textMuted: string
            danger: string
            success: string
            border: string
            sidebarHover: string
            overlay: string
            overlayDark: string
        }
        spacing: (n: number) => string
        borderRadius: {
            small: string
            medium: string
            large: string
            round: string
        }
        shadows: {
            soft: string
            hover: string
            card: string
        }
        transitions: {
            default: string
            fast: string
            slow: string
        }
        isDark: boolean
    }
}
