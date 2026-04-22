<script lang="ts">
export default {
  props: {
    content: { type: String, required: true },
    placement: { type: String, default: 'top' }
  }
}
</script>

<template>
  <el-tooltip :content="content" :placement="placement" effect="dark">
    <slot />
  </el-tooltip>
</template>
