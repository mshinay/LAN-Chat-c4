<template>
  <div class="flex flex-row justify-between px-8 py-4 h-20 border-b sticky top-0 z-10 shadow-sm">
    <!-- 左侧Logo部分 -->
    <Logo brand-name="LAN Chat" des="点对点局域网聊天" :size="isMobile ? 'sm' : 'md'" />
    <!-- 中间搜索部分 - 在移动端隐藏 -->
    <GlobalSearch class="hidden md:flex flex-1 justify-center" />
    <!-- 右侧用户信息和主题切换 -->
    <div class="flex flex-shrink-0 items-center">
      <UserInfo :name="userStore.currentUser?.name" :avatar-size="isMobile ? 'sm' : 'md'" />
      <Separator orientation="vertical" class="h-6 mx-4 hidden md:block" />
      <ThemeToggle class="hidden md:flex" />
      <!-- 移动端主题切换 -->
      <ThemeToggleMobile class="md:hidden ml-3" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import Logo from './logo/index.vue'
import GlobalSearch from './globalSearch/index.vue'
import UserInfo from './userinfo/index.vue'
import ThemeToggle from './themeToggle/index.vue'
import Separator from '@/components/ui/separator/Separator.vue'
import MenuBtn from './mobileCmp/menuBtn/index.vue'
import ThemeToggleMobile from './mobileCmp/themeToggle/index.vue'
import useMobile from '@/hooks/useMobile'
import { useUserStore } from '@/stores/user'

const isMobile = useMobile()
const userStore = useUserStore()
</script>
