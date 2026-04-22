<template>
  <el-dialog
    title="编辑收藏备注"
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    width="460px"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-input
      v-model="localNotes"
      type="textarea"
      :rows="4"
      placeholder="请输入备注信息..."
      maxlength="500"
      show-word-limit
    />
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="isSaving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FavoriteNotesDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    personId: {
      type: Number,
      required: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  emits: ['update:visible', 'save'],
  data() {
    return {
      localNotes: this.notes,
      isSaving: false
    }
  },
  watch: {
    notes(val: string) {
      this.localNotes = val
    }
  },
  methods: {
    handleSave() {
      this.isSaving = true
      this.$emit('save', this.localNotes)
      this.$emit('update:visible', false)
      this.isSaving = false
    }
  }
})
</script>
