<template>
  <div class="flex flex-col h-full">
    <Header class="h-16" />
    <ChatContainer class="flex-1 overflow-hidden" />
  </div>
</template>
<script lang="ts" setup>
import Header from './header/index.vue'
import ChatContainer from './chatContainer/index.vue'
</script>
