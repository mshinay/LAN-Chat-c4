import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import autoprefixer from 'autoprefixer'
import tailwind from 'tailwindcss'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    plugins: [
      vue(),
      vueDevTools(),
      // 在生产环境生成包分析报告
      isProd && visualizer({
        open: false,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html'
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    css: {
      postcss: {
        plugins: [tailwind(), autoprefixer()],
      },
    },
    build: {
      // 输出目录设置为后端服务器的静态资源目录
      outDir: '../server/public',
      // 清空输出目录
      emptyOutDir: true,
      // 启用源码映射（仅在非生产环境）
      sourcemap: !isProd,
      // 代码分割策略
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'socket-vendor': ['socket.io-client'],
            'ui-vendor': ['tailwindcss']
          }
        }
      },
      // 压缩选项
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProd, // 生产环境删除console
          drop_debugger: isProd // 生产环境删除debugger
        }
      },
      // 启用CSS代码分割
      cssCodeSplit: true,
      // 启用gzip压缩
      reportCompressedSize: true,
      // 设置chunk大小警告阈值
      chunkSizeWarningLimit: 1000
    },
    server: {
      proxy: {
        '/socket.io': {
          target: 'http://localhost:3000',
          ws: true
        }
      }
    },
    // 优化依赖预构建
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'socket.io-client'
      ]
    }
  }
})
