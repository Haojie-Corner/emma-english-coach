import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    allowedHosts: ['.loca.lt', '.trycloudflare.com'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'AI 英语陪练大师',
        short_name: '英语陪练',
        description: '面向中文母语者的 AI 英语学习应用，自然拼读、语音语调、场景实战一站式训练',
        theme_color: '#d97757',
        background_color: '#f5f3ee',
        display: 'standalone',
        start_url: '/',
        lang: 'zh-CN',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.elevenlabs\.io\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'elevenlabs-cache',
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
})
