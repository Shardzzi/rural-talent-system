<template>
  <el-tooltip :content="isFavorited ? '取消收藏' : '收藏'" placement="top" :hide-after="0">
    <el-button
      link
      class="favorite-btn"
      :class="{ 'is-favorited': isFavorited, 'bounce': isAnimating }"
      :loading="isLoading"
      @click="toggleFavorite"
    >
      <el-icon :size="20">
        <StarFilled v-if="isFavorited" />
        <Star v-else />
      </el-icon>
    </el-button>
  </el-tooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ElMessage } from 'element-plus'
import { Star, StarFilled } from '@element-plus/icons-vue'
import personsApi from '@/api/persons'

export default defineComponent({
  name: 'FavoriteButton',
  components: { Star, StarFilled },
  props: {
    personId: {
      type: Number,
      required: true
    },
    initialFavorite: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:favorite'],
  data() {
    return {
      isFavorited: this.initialFavorite,
      isLoading: false,
      isAnimating: false
    }
  },
  watch: {
    initialFavorite(val: boolean) {
      this.isFavorited = val
    }
  },
  methods: {
    async toggleFavorite() {
      if (this.isLoading) return
      this.isLoading = true

      try {
        if (this.isFavorited) {
          await personsApi.removeFavorite(this.personId)
          this.isFavorited = false
          ElMessage.success('已取消收藏')
        } else {
          await personsApi.addFavorite(this.personId)
          this.isFavorited = true
          ElMessage.success('已收藏')
        }

        this.triggerBounce()
        this.$emit('update:favorite', this.isFavorited)
      } catch (error) {
        ElMessage.error('操作失败，请重试')
      } finally {
        this.isLoading = false
      }
    },
    triggerBounce() {
      this.isAnimating = true
      setTimeout(() => {
        this.isAnimating = false
      }, 400)
    }
  }
})
</script>

<style scoped>
.favorite-btn {
  color: var(--color-text-placeholder);
  transition: color var(--transition-fast), transform var(--transition-fast);
  padding: 4px;
}

.favorite-btn:hover {
  color: var(--color-warning);
}

.favorite-btn.is-favorited {
  color: var(--color-warning);
}

.favorite-btn.bounce {
  animation: bounce-scale 0.4s ease;
}

@keyframes bounce-scale {
  0% { transform: scale(1); }
  30% { transform: scale(1.35); }
  60% { transform: scale(0.9); }
  100% { transform: scale(1); }
}
</style>
