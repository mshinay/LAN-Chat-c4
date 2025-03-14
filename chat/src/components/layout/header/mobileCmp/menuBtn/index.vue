<template>
  <div>
    <!-- 移动端菜单按钮 -->
    <button v-if="isMobile" @click="handleClick" class="ml-2 p-1.5 rounded-md hover:bg-accent/50">
      <MenuIcon v-if="!isMenuOpen" class="size-5" />
      <XIcon v-else class="size-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import MenuIcon from '@/assets/icon/menu.vue'
import XIcon from '@/assets/icon/x.vue'
const props = defineProps<{
  isMobile: boolean
  isMenuOpen: boolean
}>()
const emit = defineEmits<{
  (e: 'update:isMenuOpen', value: boolean): void
}>()
const handleClick = () => {
  emit('update:isMenuOpen', !props.isMenuOpen)
}
</script>
