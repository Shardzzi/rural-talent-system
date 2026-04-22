<template>
  <el-form
    ref="formRef"
    :model="modelValue"
    :rules="rules"
    label-width="120px"
    size="default"
  >
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="姓名" prop="name">
          <el-input :model-value="modelValue.name" @update:model-value="update('name', $event)" placeholder="请输入姓名" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="年龄" prop="age">
          <el-input-number
            :model-value="modelValue.age"
            @update:model-value="update('age', $event)"
            :min="1"
            :max="150"
            style="width: 100%; max-width: 280px;"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="性别" prop="gender">
          <el-select :model-value="modelValue.gender" @update:model-value="update('gender', $event)" placeholder="请选择性别" style="width: 100%" :teleported="true">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="学历" prop="education_level">
          <el-select :model-value="modelValue.education_level" @update:model-value="update('education_level', $event)" placeholder="请选择学历" style="width: 100%" :teleported="true">
            <el-option label="无" value="无" />
            <el-option label="小学" value="小学" />
            <el-option label="初中" value="初中" />
            <el-option label="高中" value="高中" />
            <el-option label="专科" value="专科" />
            <el-option label="本科" value="本科" />
            <el-option label="硕士" value="硕士" />
            <el-option label="博士" value="博士" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="联系电话" prop="phone">
          <el-input :model-value="modelValue.phone" @update:model-value="update('phone', $event)" placeholder="请输入联系电话" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="邮箱" prop="email">
          <el-input :model-value="modelValue.email" @update:model-value="update('email', $event)" placeholder="请输入邮箱地址" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="身份证号" prop="id_card">
          <el-input :model-value="modelValue.id_card" @update:model-value="update('id_card', $event)" placeholder="请输入身份证号" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="所在地区" prop="address">
          <el-input :model-value="modelValue.address" @update:model-value="update('address', $event)" placeholder="请输入所在地区" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="就业状态" prop="employment_status">
          <el-select :model-value="modelValue.employment_status" @update:model-value="update('employment_status', $event)" placeholder="请选择就业状态" style="width: 100%" :teleported="true">
            <el-option label="在岗" value="在岗" />
            <el-option label="求职中" value="求职中" />
            <el-option label="已退休" value="已退休" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="政治面貌" prop="political_status">
          <el-select :model-value="modelValue.political_status" @update:model-value="update('political_status', $event)" placeholder="请选择政治面貌" style="width: 100%" :teleported="true">
            <el-option label="群众" value="群众" />
            <el-option label="团员" value="团员" />
            <el-option label="党员" value="党员" />
            <el-option label="民主党派" value="民主党派" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="工作经验" prop="experience">
      <el-input
        :model-value="modelValue.experience"
        @update:model-value="update('experience', $event)"
        type="textarea"
        :rows="4"
        placeholder="请描述您的工作经验和专业背景"
      />
    </el-form-item>
  </el-form>
</template>

<script lang="ts">
import { ref } from 'vue'
import type { FormInstance } from 'element-plus'

export interface BasicFormData {
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
}

export default {
  name: 'FormStepBasic',
  props: {
    modelValue: {
      type: Object as () => BasicFormData,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup(props: { modelValue: BasicFormData }, { emit }: { emit: (event: 'update:modelValue', value: BasicFormData) => void }) {
    const formRef = ref<FormInstance | null>(null)

    const rules = {
      name: [
        { required: true, message: '请输入姓名', trigger: ['blur', 'change'] },
        { min: 2, max: 50, message: '姓名长度应在2-50个字符', trigger: ['blur', 'change'] }
      ],
      age: [
        { required: true, message: '请输入年龄', trigger: ['blur', 'change'] },
        { type: 'number' as const, min: 1, max: 150, message: '年龄应在1-150岁之间', trigger: ['blur', 'change'] }
      ],
      gender: [
        { required: true, message: '请选择性别', trigger: 'change' }
      ],
      email: [
        { required: false, type: 'email' as const, message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
      ],
      phone: [
        { required: false, pattern: /^(1[3-9]\d{9}|0\d{2,3}-\d{7,8})$/, message: '请输入正确的手机或固话号码', trigger: ['blur', 'change'] }
      ],
      id_card: [
        { required: false, pattern: /^\d{17}[\dXx]$/, message: '请输入18位有效身份证号', trigger: ['blur', 'change'] }
      ],
      experience: [
        { max: 500, message: '工作经验描述不超过500字符', trigger: ['blur', 'change'] }
      ]
    }

    function update(field: keyof BasicFormData, value: unknown) {
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
