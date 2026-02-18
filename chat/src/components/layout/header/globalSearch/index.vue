<template>
  <div>
    <Combobox by="label">
      <ComboboxAnchor class="w-96">
        <div class="relative w-full items-center">
          <ComboboxInput class="pl-9 w-full" placeholder="搜索用户或消息" />
          <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
            <SearchIcon class="size-4 text-muted-foreground" />
          </span>
        </div>
      </ComboboxAnchor>

      <ComboboxList class="w-96">
        <ComboboxGroup> </ComboboxGroup>
      </ComboboxList>
    </Combobox>


    <!-- 查询 CID 的输入框 -->
    <div class="relative w-40">
      <input
        v-model="queryId"
        type="number"
        min="0"
        placeholder="查询ID"
        class="pl-3 pr-10 py-2 rounded border w-full text-sm"
      />
      <button
        @click="handleQuery"
        class="absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground hover:text-primary"
      >
        查询
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
} from '@/components/ui/combobox'

import SearchIcon from '@/assets/icon/search.vue'
import { ref } from 'vue'
import { retrieveCID,isInACL,hasRole } from '@/lib/contract'
import {UserRoles} from '@/common/contract/constant'
import { useToast } from '@/components/ui/toast/use-toast'
import { h } from 'vue'
const queryId = ref('')
const { toast } = useToast()
const currentUser = ref(JSON.parse(localStorage.getItem("currentUser") || "{}"));

const handleQuery = async () => {
  if (!queryId.value) return

  try {
    console.log(currentUser.value.name+"拥有角色："+hasRole(currentUser.value.name,UserRoles.ADMIN))
    console.log(currentUser.value.name+"拥有权限："+isInACL(Number(queryId.value),currentUser.value.name))
    const result = await retrieveCID(Number(queryId.value))
    console.log(result)
    toast({
      title: '查询成功',
      description: h(
        'a',
        {
          href: `https://gateway.pinata.cloud/ipfs/${result.cid}`,
          target: '_blank',
          class: 'underline text-blue-500 hover:text-blue-700',
        },
        `CID: ${result.uploader}`
      ),
    })
  } catch (error) {
    toast({
      title: '查询失败',
      description:  '请检查ID是否有效',
      variant: 'destructive',
    })
  }
}
</script>
<!-- description: h(
        'a',
        {
          href: `https://gateway.pinata.cloud/ipfs/${cid}`,
          target: '_blank',
          class: 'underline text-blue-500 hover:text-blue-700',
        },
        `CID: ${cid}`
      ), -->