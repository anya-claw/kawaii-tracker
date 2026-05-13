import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Global, ThemeProvider, css } from '@emotion/react'
import { lightTheme, darkTheme, type AppTheme } from './theme'
import App from './App'

function Root() {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('kawaii-theme')
        if (saved) return saved === 'dark'
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    useEffect(() => {
        localStorage.setItem('kawaii-theme', isDark ? 'dark' : 'light')
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    }, [isDark])

    const theme: AppTheme = isDark ? darkTheme : lightTheme

    const globalStyles = css`
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Misans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: ${theme.colors.background};
            color: ${theme.colors.text};
            overflow-x: hidden;
            transition:
                background-color 0.3s ease,
                color 0.3s ease;
        }
        a {
            text-decoration: none;
            color: inherit;
        }
        button {
            border: none;
            outline: none;
            cursor: pointer;
            font-family: inherit;
        }
        /* Smooth transitions for all interactive elements */
        button,
        a,
        input,
        select,
        textarea {
            transition: ${theme.transitions.default};
        }
        input,
        select,
        textarea {
            background-color: ${theme.colors.surface};
            color: ${theme.colors.text};
            border-color: ${theme.colors.border};
        }
        input::placeholder,
        textarea::placeholder {
            color: ${theme.colors.textMuted};
        }
        /* Scrollbar styling */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: ${theme.colors.background};
        }
        ::-webkit-scrollbar-thumb {
            background: ${theme.colors.border};
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: ${theme.colors.primary};
        }
    `

    return (
        <ThemeProvider theme={theme}>
            <Global styles={globalStyles} />
            <App isDark={isDark} setIsDark={setIsDark} />
        </ThemeProvider>
    )
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Root />
    </StrictMode>
)
