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

</script>
