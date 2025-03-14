<template>
  <div class="flex items-center gap-2 bg-accent/50 px-2.5 py-1.5 rounded-full">
    <SunIcon class="size-4" :class="{ 'text-primary': !isDarkMode }" />
    <Switch :model-value="isDarkMode" @update:model-value="toggleTheme" class="flex items-center" />
    <MoonIcon class="size-4" :class="{ 'text-primary': isDarkMode }" />
  </div>
</template>

<script setup lang="ts">
import Switch from '@/components/ui/switch/Switch.vue'
import SunIcon from '@/assets/icon/sun.vue'
import MoonIcon from '@/assets/icon/moon.vue'
import { useDarkMode } from '@/hooks/useTheme'
// 响应式状态
const { isDarkMode, changeDarkMode } = useDarkMode()
// 切换主题
const toggleTheme = () => {
  changeDarkMode()
}
</script>
