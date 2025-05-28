<template>
  <el-dialog 
    :model-value="visible" 
    :title="isEdit ? '编辑人才档案' : '新增人才档案'"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="80%"
    max-height="80vh"
    @close="handleClose"
    @update:model-value="$emit('update:visible', $event)">
    
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 基础信息 -->
      <el-tab-pane label="基础信息" name="basic">
        <el-form 
          :model="formData.basic" 
          :rules="basicRules" 
          ref="basicFormRef" 
          label-width="120px"
          class="form-container">
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="formData.basic.name" maxlength="20" show-word-limit />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="性别" prop="gender">
                <el-radio-group v-model="formData.basic.gender">
                  <el-radio value="男">男</el-radio>
                  <el-radio value="女">女</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="年龄" prop="age">
                <el-input-number 
                  v-model="formData.basic.age" 
                  :min="16" 
                  :max="80" 
                  controls-position="right" 
                  style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="文化程度" prop="education_level">
                <el-select v-model="formData.basic.education_level" placeholder="请选择文化程度" style="width: 100%">
                  <el-option label="小学" value="小学" />
                  <el-option label="初中" value="初中" />
                  <el-option label="高中" value="高中" />
                  <el-option label="中专" value="中专" />
                  <el-option label="大专" value="大专" />
                  <el-option label="本科" value="本科" />
                  <el-option label="研究生" value="研究生" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="formData.basic.email" type="email" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="formData.basic.phone" maxlength="11" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="身份证号" prop="id_card">
                <el-input v-model="formData.basic.id_card" maxlength="18" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="政治面貌" prop="political_status">
                <el-select v-model="formData.basic.political_status" placeholder="请选择政治面貌" style="width: 100%">
                  <el-option label="群众" value="群众" />
                  <el-option label="团员" value="团员" />
                  <el-option label="党员" value="党员" />
                  <el-option label="民主党派" value="民主党派" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="家庭住址" prop="address">
            <el-input v-model="formData.basic.address" type="textarea" :rows="2" placeholder="请输入详细的家庭住址" />
          </el-form-item>

          <el-form-item label="现居住地" prop="current_address">
            <el-input v-model="formData.basic.current_address" type="textarea" :rows="2" placeholder="如与家庭住址不同，请填写" />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 农村特色信息 -->
      <el-tab-pane label="农村特色信息" name="rural">
        <el-form 
          :model="formData.rural" 
          :rules="ruralRules" 
          ref="ruralFormRef" 
          label-width="120px"
          class="form-container">
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="务农年限" prop="farming_years">
                <el-input-number 
                  v-model="formData.rural.farming_years" 
                  :min="0" 
                  :max="60" 
                  controls-position="right" 
                  style="width: 100%" />
                <span class="form-tip">年</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="种植规模" prop="planting_scale">
                <el-input-number 
                  v-model="formData.rural.planting_scale" 
                  :min="0" 
                  :precision="1" 
                  controls-position="right" 
                  style="width: 100%" />
                <span class="form-tip">亩</span>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="主要作物" prop="main_crops">
            <el-select 
              v-model="formData.rural.main_crops" 
              multiple 
              filterable 
              allow-create 
              placeholder="请选择或输入主要作物" 
              style="width: 100%">
              <el-option label="苹果" value="苹果" />
              <el-option label="大樱桃" value="大樱桃" />
              <el-option label="小麦" value="小麦" />
              <el-option label="玉米" value="玉米" />
              <el-option label="蔬菜大棚" value="蔬菜大棚" />
              <el-option label="草莓" value="草莓" />
              <el-option label="葡萄" value="葡萄" />
              <el-option label="桃子" value="桃子" />
              <el-option label="花生" value="花生" />
              <el-option label="大豆" value="大豆" />
            </el-select>
          </el-form-item>

          <el-form-item label="养殖类型" prop="breeding_types">
            <el-select 
              v-model="formData.rural.breeding_types" 
              multiple 
              filterable 
              allow-create 
              placeholder="请选择或输入养殖类型" 
              style="width: 100%">
              <el-option label="生猪" value="生猪" />
              <el-option label="土鸡" value="土鸡" />
              <el-option label="奶牛" value="奶牛" />
              <el-option label="肉牛" value="肉牛" />
              <el-option label="羊" value="羊" />
              <el-option label="鸭" value="鸭" />
              <el-option label="鹅" value="鹅" />
              <el-option label="鱼" value="鱼" />
              <el-option label="虾" value="虾" />
              <el-option label="蟹" value="蟹" />
            </el-select>
          </el-form-item>

          <el-form-item label="合作意愿" prop="cooperation_willingness">
            <el-checkbox-group v-model="formData.rural.cooperation_willingness">
              <el-checkbox value="合作社">加入合作社</el-checkbox>
              <el-checkbox value="技术服务">提供技术服务</el-checkbox>
              <el-checkbox value="电商合作">电商合作</el-checkbox>
              <el-checkbox value="品牌推广">品牌推广</el-checkbox>
              <el-checkbox value="技术培训">参与技术培训</el-checkbox>
              <el-checkbox value="项目合作">项目合作</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="发展方向" prop="development_direction">
            <el-input v-model="formData.rural.development_direction" type="textarea" :rows="3" placeholder="描述个人发展方向和规划" />
          </el-form-item>

          <el-form-item label="可用时间" prop="available_time">
            <el-checkbox-group v-model="formData.rural.available_time">
              <el-checkbox value="春季">春季</el-checkbox>
              <el-checkbox value="夏季">夏季</el-checkbox>
              <el-checkbox value="秋季">秋季</el-checkbox>
              <el-checkbox value="冬季">冬季</el-checkbox>
              <el-checkbox value="全年">全年</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 技能特长 -->
      <el-tab-pane label="技能特长" name="skills">
        <div class="skills-container">
          <div class="skills-header">
            <h4>技能列表</h4>
            <el-button type="primary" size="small" @click="addSkill">添加技能</el-button>
          </div>
          
          <div v-if="formData.skills.length === 0" class="empty-skills">
            <el-empty description="暂无技能信息，点击上方按钮添加" />
          </div>
          
          <div v-else class="skills-list">
            <el-card v-for="(skill, index) in formData.skills" :key="index" class="skill-card">
              <div class="skill-content">
                <div class="skill-info">
                  <el-tag :type="getSkillTagType(skill.skill_category)" size="small">{{ skill.skill_category }}</el-tag>
                  <span class="skill-name">{{ skill.skill_name }}</span>
                  <el-rate v-model="skill.proficiency_level" :max="5" show-text disabled size="small" />
                  <span class="experience">{{ skill.experience_years }}年经验</span>
                </div>
                <el-button type="danger" size="small" text @click="removeSkill(index)">删除</el-button>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ submitting ? '保存中...' : '保存' }}
        </el-button>
      </span>
    </template>

    <!-- 技能添加对话框 -->
    <el-dialog
      v-model="skillDialogVisible"
      title="添加技能"
      width="400px"
      :close-on-click-modal="false">
      <el-form :model="newSkill" :rules="skillRules" ref="skillFormRef" label-width="80px">
        <el-form-item label="技能类别" prop="skill_category">
          <el-select v-model="newSkill.skill_category" placeholder="请选择技能类别" style="width: 100%">
            <el-option label="种植技术" value="种植技术" />
            <el-option label="养殖技术" value="养殖技术" />
            <el-option label="加工技术" value="加工技术" />
            <el-option label="营销技能" value="营销技能" />
            <el-option label="管理能力" value="管理能力" />
            <el-option label="其他技能" value="其他技能" />
          </el-select>
        </el-form-item>
        <el-form-item label="技能名称" prop="skill_name">
          <el-input v-model="newSkill.skill_name" placeholder="请输入具体技能名称" />
        </el-form-item>
        <el-form-item label="熟练程度" prop="proficiency_level">
          <el-rate v-model="newSkill.proficiency_level" :max="5" show-text />
        </el-form-item>
        <el-form-item label="经验年限" prop="experience_years">
          <el-input-number v-model="newSkill.experience_years" :min="0" :max="50" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="相关证书" prop="certification">
          <el-input v-model="newSkill.certification" placeholder="如有相关证书请填写" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="skillDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddSkill">确定</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script>
import { ref, reactive, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'RuralTalentForm',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    personData: {
      type: Object,
      default: () => ({})
    },
    isEdit: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible', 'submit'],
  setup(props, { emit }) {
    const activeTab = ref('basic')
    const submitting = ref(false)
    const skillDialogVisible = ref(false)
    
    const basicFormRef = ref(null)
    const ruralFormRef = ref(null)
    const skillFormRef = ref(null)

    // 表单数据
    const formData = reactive({
      basic: {
        name: '',
        gender: '',
        age: null,
        email: '',
        phone: '',
        id_card: '',
        address: '',
        current_address: '',
        education_level: '',
        political_status: ''
      },
      rural: {
        farming_years: null,
        main_crops: [],
        planting_scale: null,
        breeding_types: [],
        cooperation_willingness: [],
        development_direction: '',
        available_time: []
      },
      skills: []
    })

    // 新技能表单
    const newSkill = reactive({
      skill_category: '',
      skill_name: '',
      proficiency_level: 0,
      experience_years: 0,
      certification: ''
    })

    // 验证规则
    const basicRules = {
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      gender: [
        { required: true, message: '请选择性别', trigger: 'change' }
      ],
      age: [
        { required: true, message: '请输入年龄', trigger: 'blur' },
        { type: 'number', min: 16, max: 80, message: '年龄必须在 16 到 80 之间', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ],
      phone: [
        { required: true, message: '请输入手机号码', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ]
    }

    const ruralRules = {
      farming_years: [
        { required: true, message: '请输入务农年限', trigger: 'blur' }
      ]
    }

    const skillRules = {
      skill_category: [
        { required: true, message: '请选择技能类别', trigger: 'change' }
      ],
      skill_name: [
        { required: true, message: '请输入技能名称', trigger: 'blur' }
      ],
      proficiency_level: [
        { required: true, message: '请选择熟练程度', trigger: 'change' }
      ],
      experience_years: [
        { required: true, message: '请输入经验年限', trigger: 'blur' }
      ]
    }

    // 监听传入数据变化
    watch(() => props.personData, (newData) => {
      if (newData && Object.keys(newData).length > 0) {
        // 填充基础信息
        Object.keys(formData.basic).forEach(key => {
          if (newData[key] !== undefined) {
            formData.basic[key] = newData[key]
          }
        })

        // 填充农村特色信息
        if (newData.ruralProfile) {
          const rural = newData.ruralProfile
          formData.rural.farming_years = rural.farming_years
          formData.rural.main_crops = rural.main_crops ? rural.main_crops.split(',') : []
          formData.rural.planting_scale = rural.planting_scale
          formData.rural.breeding_types = rural.breeding_types ? rural.breeding_types.split(',') : []
          formData.rural.cooperation_willingness = rural.cooperation_willingness ? rural.cooperation_willingness.split(',') : []
          formData.rural.development_direction = rural.development_direction || ''
          formData.rural.available_time = rural.available_time ? rural.available_time.split(',') : []
        }

        // 填充技能信息
        if (newData.skills && Array.isArray(newData.skills)) {
          formData.skills = [...newData.skills]
        }
      }
    }, { immediate: true, deep: true })

    // 技能相关方法
    const getSkillTagType = (category) => {
      const types = {
        '种植技术': 'success',
        '养殖技术': 'warning',
        '加工技术': 'info',
        '营销技能': 'danger',
        '管理能力': 'primary',
        '其他技能': ''
      }
      return types[category] || ''
    }

    const addSkill = () => {
      skillDialogVisible.value = true
      // 重置新技能表单
      Object.assign(newSkill, {
        skill_category: '',
        skill_name: '',
        proficiency_level: 0,
        experience_years: 0,
        certification: ''
      })
    }

    const confirmAddSkill = async () => {
      try {
        await skillFormRef.value.validate()
        formData.skills.push({...newSkill})
        skillDialogVisible.value = false
        ElMessage.success('技能添加成功')
      } catch (error) {
        console.log('技能表单验证失败', error)
      }
    }

    const removeSkill = (index) => {
      formData.skills.splice(index, 1)
      ElMessage.success('技能删除成功')
    }

    // 表单提交
    const handleSubmit = async () => {
      try {
        submitting.value = true

        // 验证基础信息
        await basicFormRef.value.validate()

        // 准备提交数据
        const submitData = {
          basic: {...formData.basic},
          rural: {
            ...formData.rural,
            main_crops: formData.rural.main_crops.join(','),
            breeding_types: formData.rural.breeding_types.join(','),
            cooperation_willingness: formData.rural.cooperation_willingness.join(','),
            available_time: formData.rural.available_time.join(',')
          },
          skills: formData.skills
        }

        emit('submit', submitData)
      } catch (error) {
        console.log('表单验证失败', error)
        ElMessage.error('请检查表单信息是否正确')
      } finally {
        submitting.value = false
      }
    }

    const handleCancel = () => {
      emit('update:visible', false)
    }

    const handleClose = () => {
      emit('update:visible', false)
    }

    return {
      activeTab,
      submitting,
      skillDialogVisible,
      basicFormRef,
      ruralFormRef,
      skillFormRef,
      formData,
      newSkill,
      basicRules,
      ruralRules,
      skillRules,
      getSkillTagType,
      addSkill,
      confirmAddSkill,
      removeSkill,
      handleSubmit,
      handleCancel,
      handleClose
    }
  }
}
</script>

<style scoped>
.form-container {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.form-tip {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

.skills-container {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.skills-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.skills-header h4 {
  margin: 0;
  color: #303133;
}

.empty-skills {
  text-align: center;
  padding: 40px 0;
}

.skills-list {
  display: grid;
  gap: 12px;
}

.skill-card {
  margin-bottom: 12px;
}

.skill-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skill-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.skill-name {
  font-weight: 500;
  color: #303133;
}

.experience {
  color: #909399;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-tabs__content) {
  padding: 0;
}

:deep(.el-rate__text) {
  font-size: 12px;
}
</style>
