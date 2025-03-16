<template>
  <div :class="['flex mb-4', props.data.isSelf ? 'justify-end' : 'justify-start']">
    <div
      :class="[
        'max-w-[70%] break-words',
        props.data.isSelf ? 'bg-primary text-primary-foreground' : 'bg-muted',
        'rounded-lg py-2 px-4',
      ]"
    >
      <!-- 文本消息 -->
      <template v-if="props.data.type === 'text'">
        <p>{{ (props.data as any).content }}</p>
      </template>

      <!-- 文件消息 -->
      <template v-else-if="props.data.type === 'file'">
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <FileIcon class="h-5 w-5" />
            <a
              :href="(props.data as any).url"
              target="_blank"
              download
              class="font-medium hover:underline"
            >
              {{ (props.data as any).fileName }}
            </a>
          </div>
          <p class="text-xs mt-1">{{ formatFileSize((props.data as any).fileSize) }}</p>

          <!-- 图片预览 -->
          <div v-if="isImage" class="mt-2">
            <img
              :src="(props.data as any).url"
              :alt="(props.data as any).fileName"
              class="max-w-full rounded-md max-h-[200px] object-contain"
            />
          </div>
        </div>
      </template>

      <p class="text-xs opacity-50 text-right mt-1">
        {{ new Date(props.data.timestamp).toLocaleTimeString() }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileIcon } from 'lucide-vue-next'
import { computed } from 'vue'
import type { Message } from '@/types/message'

const props = defineProps<{
  data: Message & { isSelf: boolean }
}>()

// 判断是否为图片文件
const isImage = computed(() => {
  if (props.data.type !== 'file') return false
  const fileType = (props.data as any).fileType || ''
  return fileType.startsWith('image/')
})

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}
</script>
