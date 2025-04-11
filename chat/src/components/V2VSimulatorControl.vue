<template>
    <div class="p-4 flex items-center gap-4">
      <button
        @click="toggleSimulation"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {{ isSimulating ? '停止 V2V 模拟' : '开始 V2V 模拟' }}
      </button>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onUnmounted } from 'vue'
  import { useChatStore } from '@/stores/chat'
  import { startV2VSimulation } from '@/lib/v2vSimulator'
  
  // Pinia 聊天状态
  const chatStore = useChatStore()
  
  // 模拟状态
  const isSimulating = ref(false)
  
  // 保存定时器清除函数
  let stopSim1: (() => void) | null = null
  let stopSim2: (() => void) | null = null
  
  // 切换模拟状态
  function toggleSimulation() {
    if (!isSimulating.value) {
      // vehicle-1 向 vehicle-2 发送状态，反之亦然
      stopSim1 = startV2VSimulation(chatStore, 'vehicle-2', 'vehicle-1')
      stopSim2 = startV2VSimulation(chatStore, 'vehicle-1', 'vehicle-2')
      isSimulating.value = true
    } else {
      stopSim1?.()
      stopSim2?.()
      isSimulating.value = false
    }
  }
  
  // 卸载组件时清除定时器
  onUnmounted(() => {
    stopSim1?.()
    stopSim2?.()
  })
  </script>
  
  <style scoped>
  button {
    font-weight: bold;
  }
  </style>
  