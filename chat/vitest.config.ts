import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'
import viteConfig from './vite.config'

export default mergeConfig(
    viteConfig,
    defineConfig({
        plugins: [vue()],
        test: {
            environment: 'happy-dom',
            globals: true,
            coverage: {
                provider: 'v8',
                reporter: ['text', 'json', 'html'],
                exclude: [
                    'node_modules/**',
                    'dist/**',
                    '**/*.d.ts',
                    '**/*.config.ts',
                    'src/types/**',
                    'src/assets/**',
                    'src/main.ts'
                ]
            },
            include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
            exclude: ['node_modules', 'dist'],
            root: fileURLToPath(new URL('./', import.meta.url))
        }
    })
) 