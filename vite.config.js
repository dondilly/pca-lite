import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

import tailwindcss from '@tailwindcss/vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [tailwindcss(),react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '~bootstrap': resolve(__dirname, 'node_modules/bootstrap'),
      '~bootstrap-icons': resolve(__dirname, 'node_modules/bootstrap-icons'),
      '~tailwindcss': resolve(__dirname, 'node_modules/tailwindcss'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions', 'if-function'],
      },
    },
  },
})
