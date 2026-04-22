<template>
  <el-drawer
    v-model="visible"
    title="帮助中心"
    direction="rtl"
    size="400px"
    :append-to-body="true"
  >
    <div class="help-center">
      <section class="help-section">
        <h3 class="section-title">快速入门</h3>
        <p class="section-text">
          数字乡村人才信息系统是一个面向农村人才管理的综合平台。
          您可以通过左侧导航菜单访问不同功能模块，使用搜索功能快速定位人才信息。
        </p>
        <p class="section-text">
          管理员可以添加、编辑和删除人才信息，普通用户可以浏览和搜索人才数据。
        </p>
      </section>

      <el-divider />

      <section class="help-section">
        <h3 class="section-title">常见问题</h3>
        <el-collapse>
          <el-collapse-item
            v-for="(faq, index) in faqs"
            :key="index"
            :title="faq.q"
            :name="index"
          >
            <p class="faq-answer">{{ faq.a }}</p>
          </el-collapse-item>
        </el-collapse>
      </section>

      <el-divider />

      <section class="help-section">
        <h3 class="section-title">键盘快捷键</h3>
        <el-table :data="shortcuts" size="small" :border="true">
          <el-table-column prop="key" label="快捷键" width="160" />
          <el-table-column prop="description" label="功能说明" />
        </el-table>
      </section>

      <el-divider />

      <section class="help-section about">
        <h3 class="section-title">关于</h3>
        <p class="section-text">数字乡村人才信息系统 v4.0</p>
      </section>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface FaqItem {
  q: string
  a: string
}

interface ShortcutItem {
  key: string
  description: string
}

const visible = ref(false)

const faqs: FaqItem[] = [
  { q: '如何添加新的人才信息？', a: '点击"添加人才"按钮，按步骤填写基本信息、农村信息、技能特长和合作意向即可。' },
  { q: '如何批量导入数据？', a: '在管理后台点击"导入数据"，上传CSV或Excel文件，预览确认后即可批量导入。' },
  { q: '如何搜索特定技能的人才？', a: '在搜索区域选择技能筛选条件，或输入关键词进行搜索。支持保存常用搜索条件。' },
  { q: '如何导出数据？', a: '点击"导出"按钮，系统将生成CSV文件供下载。支持按筛选条件导出。' },
  { q: '如何修改个人信息？', a: '普通用户可在"个人中心"修改自己关联的人员信息。管理员可编辑所有记录。' }
]

const shortcuts: ShortcutItem[] = [
  { key: 'Ctrl + K', description: '聚焦搜索框' },
  { key: '/', description: '聚焦搜索框' },
  { key: 'Ctrl + N', description: '新建人才（管理员）' },
  { key: 'Esc', description: '关闭弹窗' },
  { key: 'Ctrl + ?', description: '显示快捷键帮助' }
]

function open() {
  visible.value = true
}

defineExpose({ open })
</script>

<style scoped>
.help-center {
  padding: 0 4px;
}

.help-section {
  margin-bottom: 4px;
}

.section-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px;
}

.section-text {
  font-size: var(--font-size-base);
  color: var(--color-text-regular);
  line-height: var(--line-height-relaxed);
  margin: 0 0 8px;
}

.faq-answer {
  font-size: var(--font-size-base);
  color: var(--color-text-regular);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.about {
  text-align: center;
}
</style>
