<template>
  <div class="flex gap-2.5 items-center">
    <div class="bg-gradient-to-br from-primary/80 to-primary p-2 rounded-lg shadow-sm">
      <BrandIcon :style="brandStyle" />
    </div>
    <div>
      <h1 class="text-lg font-bold leading-none">{{ brandName }}</h1>
      <p class="text-xs text-muted-foreground">{{ des }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import BrandIcon from '@/assets/icon/brand.vue'
import { computed } from 'vue'
const props = defineProps<{
  brandName?: string
  des?: string
  size?: 'sm' | 'md' | 'lg'
}>()

const brandStyle = computed(() => {
  return {
    width: props.size === 'sm' ? '18px' : props.size === 'md' ? '22px' : '28px',
    height: props.size === 'sm' ? '18px' : props.size === 'md' ? '22px' : '28px',
  }
})
</script>
