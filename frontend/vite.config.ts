import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePluginFonts } from 'vite-plugin-fonts'
import glsl from 'vite-plugin-glsl'
import { resolve } from 'path'

const rootDir = resolve(__dirname)
const envDir = rootDir
const publicDir = resolve(rootDir, 'public')
const srcDir = resolve(rootDir, 'src')

// https://vitejs.dev/config/
export default defineConfig({
  root: srcDir,
  envDir,
  publicDir,
  build: {
    outDir: '../../server/src/main/resources/static',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(srcDir, 'index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@src': resolve(__dirname, './src')
    }
  },
  plugins: [
    react(),
    glsl(),
    VitePluginFonts({
      google: {
        families: ['Press Start 2P']
      }
    })
  ]
})
