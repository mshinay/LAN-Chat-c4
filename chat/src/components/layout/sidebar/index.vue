<template>
  <div class="flex flex-col h-full overflow-hidden border-r relative">
    <OnlineHeader class="hidden md:flex" />
    <GlobalSearch />
    <OnlineList />
  </div>
</template>
<script setup lang="ts">
import OnlineHeader from './onlineHeader/index.vue'
import OnlineList from './onlineList/index.vue'
import GlobalSearch from './mobileCmp/globalSearch/index.vue'
</script>
