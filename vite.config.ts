import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@views': '/src/views',
      '@assets': '/src/assets',
      '@utils': '/src/utils',
      '@api': '/src/api',
      '@router': '/src/router',
      '@config': '/src/config',
      '@interfaces': '/src/interfaces',
    }
  }
})
