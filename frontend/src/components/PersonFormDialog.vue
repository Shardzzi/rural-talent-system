<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑个人信息' : '添加个人信息'"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      size="default"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" placeholder="请输入姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="年龄" prop="age">
            <el-input-number 
              v-model="form.age" 
              :min="16" 
              :max="100" 
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="性别" prop="gender">
            <el-select v-model="form.gender" placeholder="请选择性别" style="width: 100%" :teleported="false">
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="学历" prop="education_level">
            <el-select v-model="form.education_level" placeholder="请选择学历" style="width: 100%" :teleported="false">
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
            <el-input v-model="form.phone" placeholder="请输入联系电话" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱地址" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所在地区" prop="address">
            <el-input v-model="form.address" placeholder="请输入所在地区" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="就业状态" prop="employment_status">
            <el-select v-model="form.employment_status" placeholder="请选择就业状态" style="width: 100%" :teleported="false">
              <el-option label="在岗" value="在岗" />
              <el-option label="求职中" value="求职中" />
              <el-option label="已退休" value="已退休" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="技能专长" prop="skillsList">
        <div class="skills-input-container">
          <div v-for="(skill, index) in skillsList" :key="index" class="skill-input-row">
            <el-input 
              v-model="skillsList[index]" 
              placeholder="请输入一项技能专长" 
              style="width: calc(100% - 90px)"
              @change="updateSkillsField"
            />
            <el-button type="danger" circle size="small" @click="removeSkill(index)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <el-button type="primary" size="small" @click="addSkillRow">
            <el-icon><Plus /></el-icon> 添加技能
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="工作经验" prop="experience">
        <el-input
          v-model="form.experience"
          type="textarea"
          :rows="4"
          placeholder="请描述您的工作经验和专业背景"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '添加' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

export default {
  name: 'PersonFormDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    person: {
      type: Object,
      default: null
    },
    isEdit: {
      type: Boolean,
      default: false
    },
    isUserMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const formRef = ref(null)
    const submitting = ref(false)
    
    // 技能列表数组，用于管理动态技能输入
    const skillsList = ref([''])
    
    const visible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })
    
    // 表单数据
    const form = reactive({
      name: '',
      age: null,
      gender: '',
      education_level: '',
      phone: '',
      email: '',
      address: '',
      employment_status: '',
      skills: '',
      experience: ''
    })
    
    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 10, message: '姓名长度应在2-10个字符', trigger: 'blur' }
      ],
      age: [
        { required: true, message: '请输入年龄', trigger: 'blur' },
        { type: 'number', min: 16, max: 100, message: '年龄应在16-100岁之间', trigger: 'blur' }
      ],
      gender: [
        { required: true, message: '请选择性别', trigger: 'change' }
      ],
      education_level: [
        { required: true, message: '请选择学历', trigger: 'change' }
      ],
      phone: [
        { required: true, message: '请输入联系电话', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ],
      address: [
        { required: true, message: '请输入所在地区', trigger: 'blur' }
      ],
      employment_status: [
        { required: true, message: '请选择就业状态', trigger: 'change' }
      ],
      skills: [
        { required: true, message: '请输入技能专长', trigger: 'blur' },
        { min: 2, message: '技能专长至少2个字符', trigger: 'blur' }
      ],
      experience: [
        { max: 500, message: '工作经验描述不超过500字符', trigger: 'blur' }
      ]
    }
    
    // 添加技能行
    const addSkillRow = () => {
      skillsList.value.push('')
    }
    
    // 删除技能行
    const removeSkill = (index) => {
      if (skillsList.value.length > 1) {
        skillsList.value.splice(index, 1)
        updateSkillsField()
      }
    }
    
    // 更新技能字段
    const updateSkillsField = () => {
      const validSkills = skillsList.value.filter(skill => skill.trim() !== '')
      form.skills = validSkills.join(', ')
    }
    
    // 从技能字符串解析为数组
    const parseSkillsFromString = (skillsString) => {
      if (!skillsString) return ['']
      const skills = skillsString.split(',').map(s => s.trim()).filter(s => s !== '')
      return skills.length ? skills : ['']
    }
    
    // 监听person属性变化，用于编辑模式
    watch(() => props.person, (newPerson) => {
      if (newPerson && props.isEdit) {
        Object.assign(form, {
          name: newPerson.name || '',
          age: newPerson.age || null,
          gender: newPerson.gender || '',
          education_level: newPerson.education_level || '',
          phone: newPerson.phone || '',
          email: newPerson.email || '',
          address: newPerson.address || '',
          employment_status: newPerson.employment_status || '',
          skills: newPerson.skills || '',
          experience: newPerson.experience || ''
        })
        
        // 解析技能字符串为数组
        skillsList.value = parseSkillsFromString(newPerson.skills)
      }
    }, { immediate: true })
    
    // 重置表单
    const resetForm = () => {
      Object.assign(form, {
        name: '',
        age: null,
        gender: '',
        education_level: '',
        phone: '',
        email: '',
        address: '',
        employment_status: '',
        skills: '',
        experience: ''
      })
      skillsList.value = ['']
      if (formRef.value) {
        formRef.value.clearValidate()
      }
    }
    
    // 关闭对话框
    const handleClose = () => {
      visible.value = false
      if (!props.isEdit) {
        resetForm()
      }
    }
    
    // 提交表单
    const handleSubmit = async () => {
      if (!formRef.value) return
      
      // 确保提交前更新技能字段
      updateSkillsField()
      
      try {
        const valid = await formRef.value.validate()
        if (!valid) return
        
        submitting.value = true
        
        const formData = { ...form }
        
        if (props.isEdit && props.person) {
          // 编辑模式
          const response = await axios.put(`/api/persons/${props.person.id}`, formData)
          ElMessage.success('更新成功')
          console.log('✅ 更新人员信息成功:', response.data)
        } else {
          // 添加模式
          const response = await axios.post('/api/persons', formData)
          ElMessage.success('添加成功')
          console.log('✅ 添加人员信息成功:', response.data)
          
          // 如果是用户模式，需要关联到用户账号
          if (props.isUserMode && response.data.data?.id) {
            try {
              await authStore.linkPersonToUser(response.data.data.id)
              console.log('✅ 用户关联人员信息成功')
            } catch (error) {
              console.error('❌ 用户关联人员信息失败:', error)
              // 不影响主流程，只是关联失败
            }
          }
        }
        
        emit('saved')
        handleClose()
        
      } catch (error) {
        console.error('❌ 保存失败:', error)
        ElMessage.error('保存失败: ' + (error.response?.data?.message || error.message))
      } finally {
        submitting.value = false
      }
    }
    
    return {
      visible,
      formRef,
      form,
      rules,
      submitting,
      skillsList,
      addSkillRow,
      removeSkill,
      updateSkillsField,
      handleClose,
      handleSubmit,
      Delete,
      Plus
    }
  }
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-textarea__inner) {
  resize: vertical;
}

.skills-input-container {
  width: 100%;
}

.skill-input-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.skill-input-row .el-button {
  margin-left: 10px;
}
</style>
