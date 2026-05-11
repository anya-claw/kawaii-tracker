import '@emotion/react'

export const theme = {
    colors: {
        primary: '#ff8fb3',
        primaryHover: '#ff7aa5',
        secondary: '#a2d5c6',
        background: '#fffcfd',
        surface: '#ffffff',
        text: '#4a4a4a',
        textMuted: '#9aa0a6',
        danger: '#ff9a9e',
        success: '#b5ead7',
        border: '#fae3ec',
        sidebarHover: '#fff0f5'
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
        hover: '0 8px 30px rgba(255, 143, 179, 0.15)'
    },
    transitions: {
        default: 'all 0.2s ease-in-out'
    }
}

declare module '@emotion/react' {
    export interface Theme {
        colors: {
            primary: string
            primaryHover: string
            secondary: string
            background: string
            surface: string
            text: string
            textMuted: string
            danger: string
            success: string
            border: string
            sidebarHover: string
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
        }
        transitions: {
            default: string
        }
    }
}
