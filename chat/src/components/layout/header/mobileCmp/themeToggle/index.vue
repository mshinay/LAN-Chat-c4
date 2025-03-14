<template>
  <SunIcon v-if="isDarkMode" class="size-5" @click="toggleTheme" />
  <MoonIcon v-else class="size-5" @click="toggleTheme" />
</template>

<script setup lang="ts">
import { useDarkMode } from '@/hooks/useTheme'
import SunIcon from '@/assets/icon/sun.vue'
import MoonIcon from '@/assets/icon/moon.vue'
const { isDarkMode, changeDarkMode } = useDarkMode()
const toggleTheme = () => {
  changeDarkMode()
}
</script>
