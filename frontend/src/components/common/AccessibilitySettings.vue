<template>
  <el-dialog
    v-model="visible"
    title="无障碍设置"
    width="420px"
    :append-to-body="true"
  >
    <div class="a11y-settings">
      <div class="setting-item">
        <label class="setting-label">字体大小</label>
        <div class="setting-control">
          <el-slider
            v-model="settings.fontSize"
            :min="14"
            :max="24"
            :step="1"
            :show-tooltip="true"
            :format-tooltip="(val: number) => val + 'px'"
            @change="applySettings"
          />
          <span class="setting-value">{{ settings.fontSize }}px</span>
        </div>
      </div>

      <div class="setting-item">
        <label class="setting-label">高对比度模式</label>
        <div class="setting-control">
          <el-switch
            v-model="settings.highContrast"
            active-text="开"
            inactive-text="关"
            @change="applySettings"
          />
        </div>
      </div>

      <el-divider />

      <div class="setting-actions">
        <el-button @click="resetSettings">恢复默认</el-button>
        <el-button type="primary" @click="visible = false">确定</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

interface A11ySettings {
  fontSize: number
  highContrast: boolean
}

const visible = ref(false)

const DEFAULT_SETTINGS: A11ySettings = {
  fontSize: 14,
  highContrast: false
}

const settings = reactive<A11ySettings>({ ...DEFAULT_SETTINGS })

function applySettings() {
  document.documentElement.style.setProperty('--font-size-base', `${settings.fontSize}px`)
  document.documentElement.classList.toggle('high-contrast', settings.highContrast)
  localStorage.setItem('a11y-settings', JSON.stringify(settings))
}

function resetSettings() {
  Object.assign(settings, DEFAULT_SETTINGS)
  applySettings()
}

function open() {
  visible.value = true
}

function loadSettings() {
  try {
    const stored = localStorage.getItem('a11y-settings')
    if (stored) {
      const parsed = JSON.parse(stored) as A11ySettings
      if (typeof parsed.fontSize === 'number' && typeof parsed.highContrast === 'boolean') {
        Object.assign(settings, parsed)
      }
    }
  } catch {
    // Ignore corrupted localStorage data
  }
  applySettings()
}

onMounted(() => {
  loadSettings()
})

defineExpose({ open })
</script>

<style scoped>
.a11y-settings {
  padding: 8px 0;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
}

.setting-label {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text-primary);
  flex-shrink: 0;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 220px;
}

.setting-control .el-slider {
  flex: 1;
}

.setting-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  min-width: 36px;
  text-align: right;
}

.setting-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
