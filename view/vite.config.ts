import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react({
            jsxImportSource: '@emotion/react',
            // @ts-expect-error vite plugin react options might be slightly out of sync
            babel: {
                plugins: ['@emotion/babel-plugin']
            }
        })
    ],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:18791',
                changeOrigin: true
            }
        }
    }
})
