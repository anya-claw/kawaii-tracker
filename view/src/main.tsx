import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Global, ThemeProvider, css } from '@emotion/react'
import { theme } from './theme'
import App from './App'

const globalStyles = css`
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }
    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: ${theme.colors.background};
        color: ${theme.colors.text};
        overflow-x: hidden;
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
`

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <Global styles={globalStyles} />
            <App />
        </ThemeProvider>
    </StrictMode>
)
