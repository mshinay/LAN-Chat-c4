import { ref, onMounted, onUnmounted } from 'vue'

export const useDarkMode = () => {
    const isDarkMode = ref(false)


    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateDarkMode = () => {
        isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (isDarkMode.value) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }
    onMounted(() => {
        // 初次加载时检查
        updateDarkMode()
        // 监听变化
        mediaQuery.addEventListener('change', updateDarkMode)
    })

    onUnmounted(() => {
        // 清理监听器
        mediaQuery.removeEventListener('change', updateDarkMode)
    })

    const changeDarkMode = () => {
        isDarkMode.value = !isDarkMode.value
        if (isDarkMode.value) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }
    return { isDarkMode, updateDarkMode, changeDarkMode }
}