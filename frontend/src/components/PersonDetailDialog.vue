<template>
  <el-dialog
    v-model="visible"
    title="人员详情"
    width="700px"
    @close="handleClose"
  >
    <div class="person-detail" v-if="currentPerson">
      <!-- 基本信息卡片 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <div class="person-title">
              <h3>{{ currentPerson.name }}</h3>
              <el-tag 
                :type="getStatusTagType(currentPerson.employment_status)" 
                size="default"
              >
                {{ currentPerson.employment_status || '未设置' }}
              </el-tag>
            </div>
          </div>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-group">
              <h4>基本信息</h4>
              <div class="info-item">
                <label>年龄：</label>
                <span>{{ currentPerson.age }}岁</span>
              </div>
              <div class="info-item">
                <label>性别：</label>
                <span>{{ currentPerson.gender }}</span>
              </div>
              <div class="info-item">
                <label>学历：</label>
                <span>{{ currentPerson.education_level || currentPerson.education || '未设置' }}</span>
              </div>
              <div class="info-item">
                <label>所在地区：</label>
                <span>{{ currentPerson.address || currentPerson.location || '未设置' }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-group">
              <h4>联系方式</h4>
              <div class="info-item">
                <label>联系电话：</label>
                <span v-if="!isGuestMode">{{ currentPerson.phone || '未设置' }}</span>
                <span v-else class="masked-info">
                  <el-icon><Lock /></el-icon>
                  需要登录查看
                </span>
              </div>
              <div class="info-item">
                <label>邮箱地址：</label>
                <span v-if="!isGuestMode">{{ currentPerson.email || '未设置' }}</span>
                <span v-else class="masked-info">
                  <el-icon><Lock /></el-icon>
                  需要登录查看
                </span>
              </div>
              <div class="info-item">
                <label>就业状态：</label>
                <span>{{ currentPerson.employment_status || '未设置' }}</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 技能专长卡片 -->
      <el-card class="skills-card" v-if="currentPerson.skills || (currentPerson.talent_skills && currentPerson.talent_skills.length > 0)">
        <template #header>
          <h4>
            <el-icon><Star /></el-icon>
            技能专长
          </h4>
        </template>
        
        <div class="skills-content">
          <!-- 显示字符串格式的技能 -->
          <div v-if="currentPerson.skills" class="skills-tags">
            <el-tag
              v-for="skill in skillsArray"
              :key="skill"
              type="primary"
              size="default"
              effect="light"
              class="skill-tag"
            >
              {{ skill }}
            </el-tag>
          </div>
          
          <!-- 显示数组格式的技能详情 -->
          <div v-else-if="currentPerson.talent_skills && currentPerson.talent_skills.length > 0" class="skills-detailed">
            <div 
              v-for="skill in currentPerson.talent_skills" 
              :key="skill.id"
              class="skill-item"
            >
              <div class="skill-header">
                <el-tag type="success" size="default" effect="light">
                  {{ skill.skill_category }}
                </el-tag>
                <span class="skill-name">{{ skill.skill_name }}</span>
                <el-rate
                  v-model="skill.proficiency_level"
                  disabled
                  size="small"
                  show-score
                  text-color="#ff9900"
                />
              </div>
              <div class="skill-details">
                <span class="skill-experience">从业{{ skill.experience_years }}年</span>
                <span v-if="skill.certification" class="skill-cert">
                  证书：{{ skill.certification }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 工作经验卡片 -->
      <el-card class="experience-card" v-if="currentPerson.experience">
        <template #header>
          <h4>
            <el-icon><Briefcase /></el-icon>
            工作经验
          </h4>
        </template>
        
        <div class="experience-content">
          <p>{{ currentPerson.experience }}</p>
        </div>
      </el-card>

      <!-- 农村特色信息卡片 -->
      <el-card class="rural-profile-card" v-if="currentPerson.rural_profile">
        <template #header>
          <h4>
            <el-icon><Platform /></el-icon>
            农村特色信息
          </h4>
        </template>
        
        <div class="rural-profile-content">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="info-item" v-if="currentPerson.rural_profile.farming_years">
                <label>从事农业年限：</label>
                <span>{{ currentPerson.rural_profile.farming_years }}年</span>
              </div>
              <div class="info-item" v-if="currentPerson.rural_profile.main_crops">
                <label>主要作物：</label>
                <span>{{ formatJsonArray(currentPerson.rural_profile.main_crops) }}</span>
              </div>
              <div class="info-item" v-if="currentPerson.rural_profile.planting_scale">
                <label>种植规模：</label>
                <span>{{ currentPerson.rural_profile.planting_scale }}亩</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="info-item" v-if="currentPerson.rural_profile.breeding_types">
                <label>养殖类型：</label>
                <span>{{ formatJsonArray(currentPerson.rural_profile.breeding_types) }}</span>
              </div>
              <div class="info-item" v-if="currentPerson.rural_profile.development_direction">
                <label>发展方向：</label>
                <span>{{ formatJsonArray(currentPerson.rural_profile.development_direction) }}</span>
              </div>
              <div class="info-item" v-if="currentPerson.rural_profile.available_time">
                <label>空闲时间：</label>
                <span>{{ formatJsonArray(currentPerson.rural_profile.available_time) }}</span>
              </div>
            </el-col>
          </el-row>
          <div class="info-item full-width" v-if="currentPerson.rural_profile.cooperation_willingness">
            <label>合作意愿：</label>
            <span>{{ formatJsonArray(currentPerson.rural_profile.cooperation_willingness) }}</span>
          </div>
        </div>
      </el-card>

      <!-- 合作意向卡片 -->
      <el-card class="cooperation-card" v-if="currentPerson.cooperation_intentions">
        <template #header>
          <h4>
            <el-icon><Connection /></el-icon>
            合作意向
          </h4>
        </template>
        
        <div class="cooperation-content">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="info-item" v-if="currentPerson.cooperation_intentions.cooperation_type">
                <label>合作类型：</label>
                <span>{{ currentPerson.cooperation_intentions.cooperation_type }}</span>
              </div>
              <div class="info-item" v-if="currentPerson.cooperation_intentions.preferred_scale">
                <label>意向规模：</label>
                <span>{{ currentPerson.cooperation_intentions.preferred_scale }}</span>
              </div>
              <div class="info-item" v-if="currentPerson.cooperation_intentions.investment_capacity">
                <label>投资能力：</label>
                <span>{{ currentPerson.cooperation_intentions.investment_capacity }}万元</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="info-item" v-if="currentPerson.cooperation_intentions.time_availability">
                <label>时间安排：</label>
                <span>{{ currentPerson.cooperation_intentions.time_availability }}</span>
              </div>
              <div class="info-item" v-if="currentPerson.cooperation_intentions.contact_preference">
                <label>联系偏好：</label>
                <span>{{ currentPerson.cooperation_intentions.contact_preference }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 其他信息卡片 -->
      <el-card class="meta-card">
        <template #header>
          <h4>
            <el-icon><InfoFilled /></el-icon>
            其他信息
          </h4>
        </template>
        
        <div class="meta-content">
          <div class="meta-item">
            <label>创建时间：</label>
            <span>{{ formatDate(currentPerson.created_at) }}</span>
          </div>
          <div class="meta-item" v-if="currentPerson.updated_at && currentPerson.updated_at !== currentPerson.created_at">
            <label>更新时间：</label>
            <span>{{ formatDate(currentPerson.updated_at) }}</span>
          </div>
          <div class="meta-item" v-if="!isGuestMode && currentPerson.id">
            <label>编号：</label>
            <span>{{ currentPerson.id }}</span>
          </div>
        </div>
      </el-card>

      <!-- 游客模式提示 -->
      <el-card class="guest-tip-card" v-if="isGuestMode">
        <div class="guest-tip">
          <el-icon class="tip-icon"><Lock /></el-icon>
          <div class="tip-content">
            <h4>想要获取完整联系方式？</h4>
            <p>登录后可以查看详细的联系方式，还可以添加和管理您自己的人才信息。</p>
            <el-button type="primary" @click="goToLogin">
              <el-icon><User /></el-icon>
              立即登录/注册
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button v-if="!isGuestMode" type="primary" @click="copyInfo">
          <el-icon><CopyDocument /></el-icon>
          复制信息
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Lock, 
  Star, 
  Briefcase, 
  InfoFilled, 
  User, 
  CopyDocument,
  Platform,
  Connection
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

export default {
  name: 'PersonDetailDialog',
  components: {
    Lock,
    Star,
    Briefcase,
    InfoFilled,
    User,
    CopyDocument,
    Platform,
    Connection
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    person: {
      type: Object,
      default: null
    },
    isGuestMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const router = useRouter()
    
    // 添加详细信息状态
    const detailedPerson = ref(null)
    const loading = ref(false)
    
    const visible = computed({
      get: () => props.modelValue,
      set: (value) => {
        emit('update:modelValue', value)
        if (!value) {
          // 关闭时清理详细信息
          detailedPerson.value = null
        }
      }
    })
    
    // 当对话框打开且有person数据时，获取详细信息
    const loadDetailedInfo = async () => {
      if (!props.person?.id || props.isGuestMode) {
        detailedPerson.value = props.person
        return
      }
      
      loading.value = true
            try {
        // 导入API服务
        const { default: personService } = await import('../api/persons')
        const response = await personService.getPersonDetails(props.person.id)
        console.log('获取到详细信息响应:', response)
        
        if (response.success) {
          // 获取并映射详细信息
          detailedPerson.value = {
            ...props.person,
            // 兼容旧版字段名
            rural_profile: response.data.ruralProfile || response.data.rural_profile,
            talent_skills: response.data.skills || [],
            cooperation_intentions: response.data.cooperation || null
          }
          console.log('组装后的详细信息:', detailedPerson.value)
        } else {
          detailedPerson.value = props.person
        }
      } catch (error) {
        console.error('获取详细信息失败:', error)
        detailedPerson.value = props.person
      } finally {
        loading.value = false
      }
    }
    
    // 监听visible和person变化
    watch([() => props.modelValue, () => props.person], ([newVisible, newPerson]) => {
      if (newVisible && newPerson) {
        loadDetailedInfo()
      }
    })
    
    // 计算当前显示的person数据
    const currentPerson = computed(() => {
      return detailedPerson.value || props.person
    })
    
    const skillsArray = computed(() => {
      if (!currentPerson.value?.skills) return []
      return currentPerson.value.skills.split(/[,，、]/).map(s => s.trim()).filter(s => s)
    })
    
    const handleClose = () => {
      visible.value = false
    }
    
    const goToLogin = () => {
      handleClose()
      router.push('/login')
    }
    
    const getStatusTagType = (status) => {
      switch (status) {
        case '在岗': return 'success'
        case '求职中': return 'warning'
        case '已退休': return 'info'
        default: return 'info'
      }
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return '未知'
      return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    const formatJsonArray = (jsonString) => {
      if (!jsonString) return '未设置'
      try {
        const parsed = JSON.parse(jsonString)
        if (Array.isArray(parsed)) {
          return parsed.join('、')
        }
        return jsonString
      } catch (e) {
        return jsonString
      }
    }
    
    const formatSkillsForCopy = (person) => {
      if (!person) return '未设置'
      
      // 优先使用talent_skills数组
      if (person.talent_skills && Array.isArray(person.talent_skills) && person.talent_skills.length > 0) {
        return person.talent_skills.map(skill => {
          let skillStr = skill.skill_name || skill.name || '未知技能'
          if (skill.proficiency_level) {
            skillStr += ` (${skill.proficiency_level})`
          }
          return skillStr
        }).join('、')
      }
      
      // 回退到skills字符串
      if (person.skills) {
        return person.skills
      }
      
      return '未设置'
    }
    
    const copyInfo = async () => {
      if (!currentPerson.value) return
      
      const info = `
姓名：${currentPerson.value.name}
年龄：${currentPerson.value.age}岁
性别：${currentPerson.value.gender}
学历：${currentPerson.value.education_level || currentPerson.value.education || '未设置'}
联系电话：${currentPerson.value.phone || '未设置'}
邮箱：${currentPerson.value.email || '未设置'}
所在地区：${currentPerson.value.address || currentPerson.value.location || '未设置'}
就业状态：${currentPerson.value.employment_status || '未设置'}
技能专长：${formatSkillsForCopy(currentPerson.value)}
工作经验：${currentPerson.value.experience || '未设置'}
      `.trim()
      
      try {
        await navigator.clipboard.writeText(info)
        ElMessage.success('信息已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
        ElMessage.error('复制失败，请手动选择文本复制')
      }
    }
    
    return {
      visible,
      currentPerson,
      loading,
      skillsArray,
      handleClose,
      goToLogin,
      getStatusTagType,
      formatDate,
      formatJsonArray,
      copyInfo
    }
  }
}
</script>

<style scoped>
.person-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.info-card {
  margin-bottom: 20px;
}

.card-header {
  margin: -8px 0;
}

.person-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.person-title h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.info-group {
  margin-bottom: 20px;
}

.info-group h4 {
  margin: 0 0 16px 0;
  color: #409EFF;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.info-item label {
  min-width: 80px;
  color: #666;
  font-weight: 500;
}

.info-item span {
  color: #333;
  flex: 1;
}

.masked-info {
  color: #999 !important;
  display: flex;
  align-items: center;
  gap: 4px;
  font-style: italic;
}

.skills-card, 
.experience-card, 
.meta-card, 
.guest-tip-card {
  margin-bottom: 20px;
}

.skills-card h4,
.experience-card h4,
.meta-card h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.skills-content {
  padding: 4px 0;
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag {
  margin: 0;
  font-size: 13px;
  padding: 4px 8px;
}

.skills-detailed {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skill-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #fafafa;
}

.skill-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.skill-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.skill-details {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.skill-experience {
  background-color: #ecf5ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 4px;
}

.skill-cert {
  background-color: #f0f9ff;
  color: #67c23a;
  padding: 2px 8px;
  border-radius: 4px;
}

.experience-content p {
  margin: 0;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  white-space: pre-wrap;
}

.meta-content {
  padding: 4px 0;
}

.meta-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.meta-item label {
  min-width: 80px;
  color: #666;
  font-weight: 500;
}

.meta-item span {
  color: #333;
}

.guest-tip-card {
  border: 2px dashed #409EFF;
  background-color: #f0f9ff;
}

.guest-tip {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 4px;
}

.tip-icon {
  font-size: 32px;
  color: #409EFF;
  flex-shrink: 0;
  margin-top: 4px;
}

.tip-content h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
}

.tip-content p {
  margin: 0 0 16px 0;
  color: #666;
  line-height: 1.5;
}

.dialog-footer {
  text-align: right;
}

/* 滚动条样式 */
.person-detail::-webkit-scrollbar {
  width: 6px;
}

.person-detail::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.person-detail::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.person-detail::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 农村特色信息和合作意向卡片样式 */
.rural-profile-card,
.cooperation-card {
  margin-bottom: 20px;
}

.rural-profile-content,
.cooperation-content {
  padding: 0;
}

.full-width {
  grid-column: span 2;
}

.full-width .info-item {
  margin-bottom: 0;
}

.full-width .info-item label {
  min-width: 100px;
}
</style>
