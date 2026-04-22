<template>
  <el-dialog
    v-model="dialogVisible"
    title="导入数据"
    width="800px"
    :close-on-click-modal="false"
    append-to-body
    @closed="handleClosed"
  >
    <el-steps :active="currentStep" finish-status="success" align-center class="import-steps">
      <el-step title="上传文件" />
      <el-step title="数据预览" />
      <el-step title="确认导入" />
    </el-steps>

    <div class="import-body">
      <!-- Step 1: Upload -->
      <div v-if="currentStep === 0" class="step-content">
        <el-upload
          ref="uploadRef"
          class="import-upload"
          drag
          :auto-upload="false"
          :limit="1"
          :on-change="handleFileChange"
          :on-exceed="handleExceed"
          accept=".csv,.xlsx,.xls"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 .csv 和 .xlsx 格式，文件大小不超过 10MB
            </div>
          </template>
        </el-upload>

        <div class="template-download">
          <el-button type="info" link @click="handleDownloadTemplate">
            <el-icon><Download /></el-icon>
            下载导入模板
          </el-button>
        </div>
      </div>

      <!-- Step 2: Preview -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="preview-summary">
          <el-tag type="success" size="large">有效: {{ validCount }} 条</el-tag>
          <el-tag type="danger" size="large">无效: {{ invalidCount }} 条</el-tag>
          <el-tag size="large">总计: {{ totalCount }} 条</el-tag>
        </div>

        <el-table
          :data="previewRows"
          max-height="400"
          border
          size="small"
          class="preview-table"
        >
          <el-table-column label="#" width="50" fixed>
            <template #default="scope">
              {{ scope.row.rowIndex }}
            </template>
          </el-table-column>
          <el-table-column
            v-for="col in previewColumns"
            :key="col"
            :prop="col"
            :label="FIELD_LABELS[col] || col"
            min-width="100"
            show-overflow-tooltip
          />
          <el-table-column label="状态" width="80" fixed="right">
            <template #default="scope">
              <el-icon v-if="scope.row.valid" color="#67C23A" :size="18"><CircleCheckFilled /></el-icon>
              <el-tooltip v-else :content="scope.row.errors.join('；')" placement="top">
                <el-icon color="#F56C6C" :size="18"><CircleCloseFilled /></el-icon>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Step 3: Confirm -->
      <div v-if="currentStep === 2" class="step-content">
        <div v-if="importing" class="import-progress">
          <el-progress :percentage="importProgress" :stroke-width="20" :text-inside="true" status="success" />
          <p class="progress-text">正在导入数据，请稍候...</p>
        </div>
        <div v-else-if="importResult" class="import-result">
          <el-result
            :icon="importResult.failed === 0 ? 'success' : 'warning'"
            :title="importResultTitle"
          >
            <template #sub-title>
              <p v-if="importResult.failed === 0">所有数据已成功导入！</p>
              <p v-else>部分数据导入失败，请检查后重试</p>
            </template>
          </el-result>
          <div v-if="importResult.failed > 0 && importResult.errors?.length" class="error-details">
            <el-collapse>
              <el-collapse-item :title="`查看失败详情 (${importResult.errors.length} 条)`">
                <div v-for="(err, idx) in importResult.errors.slice(0, 20)" :key="idx" class="error-item">
                  第 {{ err.row }} 行: {{ err.message }}
                </div>
                <div v-if="importResult.errors.length > 20" class="error-more">
                  ... 还有 {{ importResult.errors.length - 20 }} 条错误
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClosed">{{ footerCancelText }}</el-button>
      <el-button
        v-if="currentStep === 1 && validCount > 0"
        type="primary"
        @click="currentStep = 2; startImport()"
      >
        导入有效数据
      </el-button>
      <el-button
        v-if="currentStep === 0 && selectedFile"
        type="primary"
        :loading="uploading"
        @click="handleUpload"
      >
        下一步
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Download, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import personsApi from '../../api/persons'

interface PreviewRow {
  rowIndex: number
  data: Record<string, unknown>
  errors: string[]
  valid: boolean
}

interface ImportResult {
  success: number
  failed: number
  errors?: Array<{ row: number; field: string; message: string }>
}

const FIELD_LABELS: Record<string, string> = {
  name: '姓名',
  age: '年龄',
  gender: '性别',
  phone: '电话',
  email: '邮箱',
  address: '地址',
  education_level: '学历',
  political_status: '政治面貌'
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  'imported': []
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const currentStep = ref(0)
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const sessionId = ref('')
const previewRows = ref<PreviewRow[]>([])
const importing = ref(false)
const importProgress = ref(0)
const importResult = ref<ImportResult | null>(null)

const totalCount = computed(() => previewRows.value.length)
const validCount = computed(() => previewRows.value.filter(r => r.valid).length)
const invalidCount = computed(() => totalCount.value - validCount.value)

const importResultTitle = computed(() => {
  if (!importResult.value) return ''
  return `导入完成：成功 ${importResult.value.success} 条，失败 ${importResult.value.failed} 条`
})

const footerCancelText = computed(() => {
  if (currentStep.value === 2 && importResult.value) return '关闭'
  return '取消'
})

const previewColumns = computed(() => {
  if (previewRows.value.length === 0) return []
  const cols = new Set<string>()
  for (const row of previewRows.value) {
    for (const key of Object.keys(row.data)) {
      cols.add(key)
    }
  }
  return Array.from(cols)
})

function handleFileChange(file: { raw: File }): void {
  selectedFile.value = file.raw
}

function handleExceed(): void {
  ElMessage.warning('只能上传一个文件，请先移除已选文件')
}

async function handleUpload(): Promise<void> {
  if (!selectedFile.value) return
  uploading.value = true
  try {
    const result = await personsApi.uploadImport(selectedFile.value)
    sessionId.value = result.data.sessionId

    const previewResult = await personsApi.previewImport(sessionId.value)
    previewRows.value = previewResult.data.previews

    currentStep.value = 1
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    ElMessage.error(err.response?.data?.message || err.message || '文件上传失败')
  } finally {
    uploading.value = false
  }
}

async function startImport(): Promise<void> {
  importing.value = true
  importProgress.value = 0
  importResult.value = null

  const progressInterval = setInterval(() => {
    if (importProgress.value < 90) {
      importProgress.value += Math.random() * 15
    }
  }, 300)

  try {
    const result = await personsApi.confirmImport(sessionId.value)
    importResult.value = result.data
    importProgress.value = 100
    if (result.data.success > 0) {
      emit('imported')
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    ElMessage.error(err.response?.data?.message || err.message || '导入失败')
  } finally {
    clearInterval(progressInterval)
    importing.value = false
  }
}

async function handleDownloadTemplate(): Promise<void> {
  try {
    const blob = await personsApi.downloadTemplate()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '导入模板.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    ElMessage.error(err.response?.data?.message || err.message || '下载模板失败')
  }
}

function handleClosed(): void {
  currentStep.value = 0
  selectedFile.value = null
  sessionId.value = ''
  previewRows.value = []
  importing.value = false
  importProgress.value = 0
  importResult.value = null
}
</script>

<style scoped>
.import-steps {
  margin-bottom: 24px;
}

.step-content {
  min-height: 200px;
}

.import-upload {
  width: 100%;
}

.import-upload :deep(.el-upload-dragger) {
  width: 100%;
}

.template-download {
  text-align: center;
  margin-top: 12px;
}

.preview-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.preview-table {
  width: 100%;
}

.import-progress {
  text-align: center;
  padding: 40px 20px;
}

.progress-text {
  margin-top: 16px;
  color: #909399;
}

.import-result {
  padding: 10px 0;
}

.error-details {
  max-width: 600px;
  margin: 0 auto;
}

.error-item {
  padding: 6px 0;
  color: #f56c6c;
  font-size: 13px;
  border-bottom: 1px solid #fef0f0;
}

.error-more {
  padding: 8px 0;
  color: #909399;
  font-size: 13px;
  text-align: center;
}
</style>
