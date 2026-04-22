<template>
  <div>
    <el-form
      ref="formRef"
      :model="modelValue"
      :rules="rules"
      label-width="120px"
      size="default"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="合作类型" prop="cooperation_type">
            <el-select
              :model-value="modelValue.cooperation_type"
              @update:model-value="update('cooperation_type', $event)"
              placeholder="请选择合作类型"
              style="width: 100%; max-width: 280px;"
              :teleported="true"
            >
              <el-option label="技术合作" value="技术合作" />
              <el-option label="销售合作" value="销售合作" />
              <el-option label="项目投资" value="项目投资" />
              <el-option label="合作社加入" value="合作社加入" />
              <el-option label="培训服务" value="培训服务" />
              <el-option label="设备租赁" value="设备租赁" />
              <el-option label="土地流转" value="土地流转" />
              <el-option label="品牌合作" value="品牌合作" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="偏好规模" prop="preferred_scale">
            <el-select
              :model-value="modelValue.preferred_scale"
              @update:model-value="update('preferred_scale', $event)"
              placeholder="请选择偏好规模"
              style="width: 100%; max-width: 280px;"
              :teleported="true"
            >
              <el-option label="小规模(1-10亩)" value="小规模" />
              <el-option label="中等规模(10-50亩)" value="中等规模" />
              <el-option label="大规模(50-200亩)" value="大规模" />
              <el-option label="超大规模(200亩以上)" value="超大规模" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="投资能力(万元)" prop="investment_capacity">
            <el-input-number
              :model-value="modelValue.investment_capacity"
              @update:model-value="update('investment_capacity', $event)"
              :min="0"
              :precision="1"
              style="width: 100%; max-width: 280px;"
              placeholder="请输入投资能力"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="时间可用性" prop="time_availability">
            <el-select
              :model-value="modelValue.time_availability"
              @update:model-value="update('time_availability', $event)"
              placeholder="请选择时间可用性"
              style="width: 100%; max-width: 280px;"
              :teleported="true"
            >
              <el-option label="全职" value="全职" />
              <el-option label="兼职" value="兼职" />
              <el-option label="季节性" value="季节性" />
              <el-option label="周末" value="周末" />
              <el-option label="农闲时" value="农闲时" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="联系偏好" prop="contact_preference">
        <el-select
          :model-value="modelValue.contact_preference"
          @update:model-value="update('contact_preference', $event)"
          placeholder="请选择联系偏好"
          style="width: 100%"
          :teleported="true"
        >
          <el-option label="电话联系" value="电话联系" />
          <el-option label="微信联系" value="微信联系" />
          <el-option label="邮件联系" value="邮件联系" />
          <el-option label="上门拜访" value="上门拜访" />
          <el-option label="网络沟通" value="网络沟通" />
        </el-select>
      </el-form-item>
    </el-form>

    <el-divider>信息确认</el-divider>
    <el-descriptions :column="2" border size="small" class="review-section">
      <el-descriptions-item label="姓名">{{ allFormData.name || '-' }}</el-descriptions-item>
      <el-descriptions-item label="年龄">{{ allFormData.age || '-' }}</el-descriptions-item>
      <el-descriptions-item label="性别">{{ allFormData.gender || '-' }}</el-descriptions-item>
      <el-descriptions-item label="学历">{{ allFormData.education_level || '-' }}</el-descriptions-item>
      <el-descriptions-item label="联系电话">{{ allFormData.phone || '-' }}</el-descriptions-item>
      <el-descriptions-item label="邮箱">{{ allFormData.email || '-' }}</el-descriptions-item>
      <el-descriptions-item label="身份证号">{{ allFormData.id_card || '-' }}</el-descriptions-item>
      <el-descriptions-item label="所在地区">{{ allFormData.address || '-' }}</el-descriptions-item>
      <el-descriptions-item label="就业状态">{{ allFormData.employment_status || '-' }}</el-descriptions-item>
      <el-descriptions-item label="政治面貌">{{ allFormData.political_status || '-' }}</el-descriptions-item>
      <el-descriptions-item label="从事农业年限">{{ allFormData.farming_years ?? '-' }}</el-descriptions-item>
      <el-descriptions-item label="种植规模(亩)">{{ allFormData.planting_scale ?? '-' }}</el-descriptions-item>
      <el-descriptions-item label="主要作物" :span="2">{{ (allFormData.main_crops || []).join('、') || '-' }}</el-descriptions-item>
      <el-descriptions-item label="养殖类型" :span="2">{{ (allFormData.breeding_types || []).join('、') || '-' }}</el-descriptions-item>
      <el-descriptions-item label="合作意愿" :span="2">{{ (allFormData.cooperation_willingness || []).join('、') || '-' }}</el-descriptions-item>
      <el-descriptions-item label="发展方向" :span="2">{{ (allFormData.development_direction || []).join('、') || '-' }}</el-descriptions-item>
      <el-descriptions-item label="可用时间" :span="2">{{ (allFormData.available_time || []).join('、') || '-' }}</el-descriptions-item>
      <el-descriptions-item label="技能专长" :span="2">
        <template v-if="allFormData.skills && allFormData.skills.length > 0">
          <el-tag v-for="(s, i) in allFormData.skills" :key="i" size="small" style="margin-right: 4px; margin-bottom: 2px;">
            {{ s.category }} - {{ s.name }} ({{ s.proficiency || '-' }}级)
          </el-tag>
        </template>
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="合作类型">{{ allFormData.cooperation_type || '-' }}</el-descriptions-item>
      <el-descriptions-item label="偏好规模">{{ allFormData.preferred_scale || '-' }}</el-descriptions-item>
      <el-descriptions-item label="投资能力(万元)">{{ allFormData.investment_capacity ?? '-' }}</el-descriptions-item>
      <el-descriptions-item label="时间可用性">{{ allFormData.time_availability || '-' }}</el-descriptions-item>
      <el-descriptions-item label="联系偏好" :span="2">{{ allFormData.contact_preference || '-' }}</el-descriptions-item>
      <el-descriptions-item label="工作经验" :span="2">{{ allFormData.experience || '-' }}</el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue'
import type { FormInstance } from 'element-plus'
import type { SkillItem } from './FormStepSkills.vue'

export interface CooperationFormData {
  cooperation_type: string
  preferred_scale: string
  investment_capacity: number | null
  time_availability: string
  contact_preference: string
}

interface AllFormData extends CooperationFormData {
  name: string
  age: number | null
  gender: string
  education_level: string
  phone: string
  email: string
  id_card: string
  address: string
  employment_status: string
  political_status: string
  experience: string
  farming_years: number | null
  planting_scale: number | null
  main_crops: string[]
  breeding_types: string[]
  cooperation_willingness: string[]
  development_direction: string[]
  available_time: string[]
  skills: SkillItem[]
}

export default {
  name: 'FormStepCooperation',
  props: {
    modelValue: {
      type: Object as () => CooperationFormData,
      required: true
    },
    allFormData: {
      type: Object as () => AllFormData,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup(props: { modelValue: CooperationFormData; allFormData: AllFormData }, { emit }: { emit: (event: 'update:modelValue', value: CooperationFormData) => void }) {
    const formRef = ref<FormInstance | null>(null)

    const rules = {
      cooperation_type: [
        {
          validator: (_rule: unknown, value: string | null, callback: (error?: Error) => void) => {
            const form = props.modelValue
            const hasCooperationInfo = form.preferred_scale ||
              form.investment_capacity !== null ||
              form.time_availability ||
              form.contact_preference
            if (hasCooperationInfo && !value) {
              callback(new Error('填写了合作意向时，合作类型不能为空'))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ],
      investment_capacity: [
        { type: 'number' as const, min: 0, message: '投资能力必须为正数', trigger: ['blur', 'change'] }
      ]
    }

    function update(field: keyof CooperationFormData, value: unknown) {
      emit('update:modelValue', { ...props.modelValue, [field]: value })
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

    return { formRef, rules, update, validate }
  }
}
</script>

<style scoped>
.review-section {
  margin-top: 16px;
}
</style>
