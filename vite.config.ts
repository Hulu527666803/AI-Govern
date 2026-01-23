
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'static', // 将 static 目录设置为静态资源目录
  define: {
    // 允许在前端代码中使用 process.env.API_KEY
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  server: {
    port: 8080,
    host: true,
    allowedHosts: true, // 允许 Cloud Shell 的预览域名
    proxy: {
      // 代理 API 请求到后端服务
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
