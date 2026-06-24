import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { openaiClassifyPlugin } from './server/openaiClassifyPlugin.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      openaiClassifyPlugin(env.OPENAI_API_KEY),
    ],
  }
})
