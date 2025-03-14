<template>
  <div
    v-if="isMenuOpen && isMobile"
    class="fixed inset-x-0 top-[73px] z-20 bg-background border-b shadow-md p-4 flex flex-col gap-4 animate-in slide-in-from-top duration-300"
  >
    <div class="flex items-center justify-between">
      <span class="text-sm text-muted-foreground">深色模式</span>
      <ThemeToggle />
    </div>
  </div>
</template>
<script setup lang="ts">
import ThemeToggle from '../../themeToggle/index.vue'
const props = defineProps<{
  isMenuOpen: boolean
  isMobile: boolean
}>()
</script>
