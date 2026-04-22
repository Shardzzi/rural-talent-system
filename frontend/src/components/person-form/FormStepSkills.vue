<template>
  <el-form
    ref="formRef"
    :model="{ skills: skillsList }"
    label-width="0px"
    size="default"
  >
    <div class="skills-container">
      <div class="skills-header">
        <el-row :gutter="10">
          <el-col :span="6">
            <label class="skill-label">技能分类</label>
          </el-col>
          <el-col :span="6">
            <label class="skill-label">技能名称</label>
          </el-col>
          <el-col :span="5">
            <label class="skill-label">熟练程度</label>
          </el-col>
          <el-col :span="5">
            <label class="skill-label">从业年限</label>
          </el-col>
          <el-col :span="2">
            <label class="skill-label">操作</label>
          </el-col>
        </el-row>
      </div>
      <div v-for="(skill, index) in skillsList" :key="index" class="skill-item">
        <el-row :gutter="10">
          <el-col :span="6">
            <el-form-item :prop="`skills.${index}.category`" :rules="[{ required: true, message: '请选择分类', trigger: 'change' }]" label-width="0">
              <el-select
                :model-value="skill.category"
                @update:model-value="updateSkill(index, 'category', $event)"
                placeholder="请选择技能分类"
                style="width: 100%; max-width: 280px;"
                :teleported="true"
              >
                <el-option label="农业种植" value="农业种植" />
                <el-option label="畜牧养殖" value="畜牧养殖" />
                <el-option label="农业机械" value="农业机械" />
                <el-option label="营销技能" value="营销技能" />
                <el-option label="管理能力" value="管理能力" />
                <el-option label="加工技术" value="加工技术" />
                <el-option label="电子商务" value="电子商务" />
                <el-option label="其他技能" value="其他技能" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item :prop="`skills.${index}.name`" :rules="[{ required: true, message: '请输入名称', trigger: ['blur', 'change'] }]" label-width="0">
              <el-input
                :model-value="skill.name"
                @update:model-value="updateSkill(index, 'name', $event)"
                placeholder="如：玉米种植、养鸡技术"
              />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item :prop="`skills.${index}.proficiency`" label-width="0">
              <el-select
                :model-value="skill.proficiency"
                @update:model-value="updateSkill(index, 'proficiency', $event)"
                placeholder="请选择熟练度"
                style="width: 100%; max-width: 280px;"
                :teleported="true"
              >
                <el-option label="初级(1级)" :value="1" />
                <el-option label="入门(2级)" :value="2" />
                <el-option label="熟练(3级)" :value="3" />
                <el-option label="精通(4级)" :value="4" />
                <el-option label="专家(5级)" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item :prop="`skills.${index}.experience_years`" label-width="0">
              <el-input-number
                :model-value="skill.experience_years"
                @update:model-value="updateSkill(index, 'experience_years', $event)"
                :min="0"
                :max="50"
                placeholder="年"
                style="width: 100%; max-width: 280px;"
                controls-position="right"
              />
              <div class="form-tip">从事该技能的年数</div>
            </el-form-item>
          </el-col>
          <el-col :span="2">
            <el-button
              type="danger"
              circle
              size="small"
              @click="removeSkill(index)"
              :disabled="skillsList.length === 1"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-col>
        </el-row>
      </div>
      <el-button type="primary" size="small" @click="addSkill" style="margin-top: 10px;">
        <el-icon><Plus /></el-icon> 添加技能
      </el-button>
    </div>
  </el-form>
</template>

<script lang="ts">
import { ref, watch } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'

export interface SkillItem {
  category: string
  name: string
  proficiency: number | null
  experience_years: number | null
}

export default {
  name: 'FormStepSkills',
  components: { Delete, Plus },
  props: {
    modelValue: {
      type: Array as () => SkillItem[],
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup(props: { modelValue: SkillItem[] }, { emit }: { emit: (event: 'update:modelValue', value: SkillItem[]) => void }) {
    const formRef = ref<FormInstance | null>(null)
    const skillsList = ref<SkillItem[]>([...props.modelValue])

    watch(() => props.modelValue, (newVal) => {
      skillsList.value = [...newVal]
    }, { deep: true })

    function updateSkill(index: number, field: keyof SkillItem, value: unknown) {
      const updated = [...skillsList.value]
      updated[index] = { ...updated[index], [field]: value }
      skillsList.value = updated
      emit('update:modelValue', updated)
    }

    function addSkill() {
      const updated = [...skillsList.value, { category: '', name: '', proficiency: null, experience_years: null }]
      skillsList.value = updated
      emit('update:modelValue', updated)
    }

    function removeSkill(index: number) {
      if (skillsList.value.length <= 1) return
      const updated = skillsList.value.filter((_, i) => i !== index)
      skillsList.value = updated
      emit('update:modelValue', updated)
    }

    async function validate(): Promise<boolean> {
      if (!formRef.value) return false
      try {
        await formRef.value.validate()
        return true
      } catch {
        return false
      }
    }

    return { formRef, skillsList, updateSkill, addSkill, removeSkill, validate, Delete, Plus }
  }
}
</script>

<style scoped>
.skills-container {
  width: 100%;
}

.skills-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e9ecef;
}

.skill-label {
  font-weight: 600;
  color: #606266;
  font-size: 14px;
  display: block;
  text-align: center;
}

.skill-item {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
  text-align: center;
}
</style>
