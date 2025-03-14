<template>
  <div class="flex flex-col h-full overflow-hidden border-r">
    <OnlineHeader class="hidden md:flex" />
    <GlobalSearch class="px-4 py-2" />
    <OnlineList />
  </div>
</template>
<script setup lang="ts">
import OnlineHeader from './onlineHeader/index.vue'
import OnlineList from './onlineList/index.vue'
import GlobalSearch from './mobileCmp/globalSearch/index.vue'
</script>
