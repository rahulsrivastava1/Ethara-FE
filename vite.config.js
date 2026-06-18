import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.BACKEND_URL

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    ...(command === 'serve' && {
      server: {
        port: 3000,
        proxy: {
          '/api': {
            target:
              backendUrl ||
              (() => {
                throw new Error('BACKEND_URL is not set. Add it to .env')
              })(),
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
          },
        },
      },
    }),
    build: {
      outDir: 'build',
    },
  }
})
