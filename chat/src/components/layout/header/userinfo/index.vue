<template>
  <div class="flex flex-row items-center">
    <h2 class="mr-3 text-sm sm:text-base">{{ name }}</h2>
     <!--meatamask登录-->
    <!--<MetaMaskButton />--> 
  </div>
</template>

<script setup lang="ts">
import Avatar from '@/components/ui/avatar/Avatar.vue'
import AvatarImage from '@/components/ui/avatar/AvatarImage.vue'
//import MetaMaskButton from "@/components/ui/metamask/MetaMaskButton.vue"
import { computed } from 'vue'
const props = withDefaults(
  defineProps<{
    name?: string
    avatarUrl?: string
    avatarSize?: 'sm' | 'md' | 'lg'
  }>(),
  {
    avatarUrl: '',
    avatarSize: 'sm',
  },
)

const avatarSizeToClass = computed(() => {
  return props.avatarSize === 'sm' ? 'size-7' : props.avatarSize === 'md' ? 'size-8' : 'size-9'
})

</script>
