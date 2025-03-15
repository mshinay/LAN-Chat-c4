<template>
  <div :class="['flex mb-4', props.data.isSelf ? 'justify-end' : 'justify-start']">
    <div
      :class="[
        'max-w-[70%] break-words',
        props.data.isSelf ? 'bg-primary text-primary-foreground' : 'bg-muted',
        'rounded-lg py-2 px-4',
      ]"
    >
      <p>{{ props.data.content }}</p>
      <p class="text-xs opacity-50 text-right mt-1">
        {{ new Date(props.data.timestamp).toLocaleTimeString() }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: {
    isSelf: boolean
    id: string
    content: string
    senderId: string
    timestamp: number
    type: 'text' | 'file'
  }
}>()
</script>
