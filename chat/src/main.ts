import './assets/index.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { logger } from './lib/utils/logger'

// 创建Pinia实例并添加持久化插件
const pinia = createPinia()

// 创建应用实例
const app = createApp(App)

// 注册全局错误处理
app.config.errorHandler = (err, instance, info) => {
    logger.error(`Global error: ${info}`, err)
}

// 注册插件
app.use(pinia)
app.use(router)

// 挂载应用
app.mount('#app')

logger.info('Application initialized')
