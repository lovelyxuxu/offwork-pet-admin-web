import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/admin/',
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/admin/api': 'http://127.0.0.1:8765',
      '/admin/login': 'http://127.0.0.1:8765',
      '/admin/logout': 'http://127.0.0.1:8765',
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('echarts') || id.includes('zrender')) return 'echarts'
          if (id.includes('element-plus') || id.includes('@element-plus')) return 'element-plus'
          if (id.includes('vue') || id.includes('pinia') || id.includes('@vue')) return 'vue-vendor'
        },
      },
    },
  },
})