import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePluginFonts } from 'vite-plugin-fonts'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: '../server/src/main/resources/static',
    emptyOutDir: true
  },
  plugins: [
    react(),
    VitePluginFonts({
      google: {
        families: ['Press Start 2P']
      }
    })
  ]
})
